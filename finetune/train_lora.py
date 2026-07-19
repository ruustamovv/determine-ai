"""LoRA/QLoRA fine-tuning pipeline for Determine-AI models.

Supports both Web AI (Qwen2.5-14B/32B-Instruct) and Coder AI (Qwen2.5-Coder-32B-Instruct).
Uses Unsloth/PEFT for memory-efficient training on a single GPU.

Usage:
    python -m finetune.train_lora --type web --model Qwen/Qwen2.5-14B-Instruct
    python -m finetune.train_lora --type coder --model Qwen/Qwen2.5-Coder-32B-Instruct
    python -m finetune.train_lora --type web --quantize 4bit --epochs 3
"""

import os
import json
import argparse
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints")


def load_dataset(path: str) -> list:
    """Load JSONL training dataset."""
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    logger.info(f"Loaded {len(data)} examples from {path}")
    return data


def setup_model(model_name: str, use_4bit: bool = False):
    """Load model and tokenizer with optional 4-bit quantization."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

    logger.info(f"Loading model: {model_name} (4-bit: {use_4bit})")

    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    quantization_config = None
    if use_4bit:
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=quantization_config,
        torch_dtype=torch.float16 if use_4bit else torch.float32,
        trust_remote_code=True,
        device_map="auto",
    )

    params = sum(p.numel() for p in model.parameters()) / 1e6
    logger.info(f"Model loaded: {params:.0f}M parameters")
    return model, tokenizer


def apply_lora(model, r: int = 16, alpha: int = 32, dropout: float = 0.1):
    """Apply LoRA adapters to the model."""
    from peft import LoraConfig, get_peft_model, TaskType, prepare_model_for_kbit_training

    # Prepare for training (important for quantized models)
    model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=r,
        lora_alpha=alpha,
        lora_dropout=dropout,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        bias="none",
        inference_mode=False,
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    return model


def create_dataset(data: list, tokenizer, max_length: int = 512):
    """Create a PyTorch dataset from training data."""
    import torch
    from torch.utils.data import Dataset

    class ChatDataset(Dataset):
        def __init__(self, data, tokenizer, max_length):
            self.data = data
            self.tokenizer = tokenizer
            self.max_length = max_length

        def __len__(self):
            return len(self.data)

        def __getitem__(self, idx):
            example = self.data[idx]
            messages = example.get("messages", [])

            if hasattr(self.tokenizer, "apply_chat_template"):
                text = self.tokenizer.apply_chat_template(
                    messages, tokenize=False, add_generation_prompt=False
                )
            else:
                parts = []
                for msg in messages:
                    parts.append(f"{msg['role'].capitalize()}: {msg['content']}")
                text = "\n".join(parts)

            enc = self.tokenizer(
                text,
                truncation=True,
                max_length=self.max_length,
                padding="max_length",
                return_tensors="pt",
            )

            input_ids = enc["input_ids"].squeeze()
            attention_mask = enc["attention_mask"].squeeze()
            labels = input_ids.clone()
            labels[attention_mask == 0] = -100

            return {"input_ids": input_ids, "attention_mask": attention_mask, "labels": labels}

    return ChatDataset(data, tokenizer, max_length)


def train(args):
    """Run the fine-tuning process."""
    from transformers import TrainingArguments, Trainer
    import torch

    # Determine dataset path
    dataset_name = "web_ai_finetune_dataset.jsonl" if args.type == "web" else "coder_ai_finetune_dataset.jsonl"
    data_path = args.data or os.path.join(DATA_DIR, dataset_name)

    if not os.path.exists(data_path):
        logger.error(f"Dataset not found at {data_path}. Run prepare_dataset.py first.")
        return

    # Load data
    raw_data = load_dataset(data_path)

    # Split train/eval (95/5)
    split_idx = int(len(raw_data) * 0.95)
    train_data = raw_data[:split_idx]
    eval_data = raw_data[split_idx:]
    logger.info(f"Train: {len(train_data)} | Eval: {len(eval_data)}")

    # Load model
    model, tokenizer = setup_model(args.model, use_4bit=args.quantize)

    # Apply LoRA
    model = apply_lora(model, r=args.lora_r, alpha=args.lora_alpha, dropout=args.lora_dropout)

    # Create datasets
    train_dataset = create_dataset(train_data, tokenizer, max_length=args.max_length)
    eval_dataset = create_dataset(eval_data, tokenizer, max_length=args.max_length)

    # Output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = os.path.join(CHECKPOINT_DIR, f"lora_{args.type}_{timestamp}")
    os.makedirs(output_dir, exist_ok=True)

    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        warmup_ratio=args.warmup_ratio,
        logging_steps=args.logging_steps,
        eval_strategy="steps",
        eval_steps=args.eval_steps,
        save_steps=args.save_steps,
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        fp16=args.fp16,
        bf16=args.bf16,
        dataloader_pin_memory=False,
        report_to="none",
        remove_unused_columns=False,
        optim="adamw_torch",
        lr_scheduler_type="cosine",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
    )

    # Train
    logger.info("Starting training...")
    train_result = trainer.train()

    # Save LoRA adapter
    lora_path = os.path.join(output_dir, "lora_adapter")
    model.save_pretrained(lora_path)
    tokenizer.save_pretrained(lora_path)
    logger.info(f"LoRA adapter saved to {lora_path}")

    # Save training metadata
    metadata = {
        "model": args.model,
        "type": args.type,
        "lora_r": args.lora_r,
        "lora_alpha": args.lora_alpha,
        "epochs": args.epochs,
        "train_samples": len(train_data),
        "eval_samples": len(eval_data),
        "train_loss": train_result.training_loss,
        "timestamp": timestamp,
    }
    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Training complete! Loss: {train_result.training_loss:.4f}")
    logger.info(f"Output: {output_dir}")
    return output_dir


def main():
    parser = argparse.ArgumentParser(description="LoRA/QLoRA fine-tuning for Determine-AI")
    parser.add_argument("--type", choices=["web", "coder"], required=True, help="Model type to train")
    parser.add_argument("--model", type=str, default=None, help="Base model name (default based on type)")
    parser.add_argument("--data", type=str, default=None, help="Path to training data JSONL")
    parser.add_argument("--quantize", action="store_true", help="Use 4-bit quantization (QLoRA)")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--batch-size", type=int, default=2, help="Per-device batch size")
    parser.add_argument("--grad-accum", type=int, default=8, help="Gradient accumulation steps")
    parser.add_argument("--warmup-ratio", type=float, default=0.05, help="Warmup ratio")
    parser.add_argument("--max-length", type=int, default=512, help="Max sequence length")
    parser.add_argument("--lora-r", type=int, default=16, help="LoRA rank")
    parser.add_argument("--lora-alpha", type=int, default=32, help="LoRA alpha")
    parser.add_argument("--lora-dropout", type=float, default=0.1, help="LoRA dropout")
    parser.add_argument("--logging-steps", type=int, default=10, help="Log every N steps")
    parser.add_argument("--eval-steps", type=int, default=100, help="Evaluate every N steps")
    parser.add_argument("--save-steps", type=int, default=200, help="Save checkpoint every N steps")
    parser.add_argument("--fp16", action="store_true", help="Use FP16 training")
    parser.add_argument("--bf16", action="store_true", help="Use BF16 training")
    args = parser.parse_args()

    # Set default model based on type
    if args.model is None:
        if args.type == "web":
            args.model = "Qwen/Qwen2.5-14B-Instruct"
        else:
            args.model = "Qwen/Qwen2.5-Coder-32B-Instruct"

    train(args)


if __name__ == "__main__":
    main()
