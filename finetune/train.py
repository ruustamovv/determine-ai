"""Fine-tune Qwen2.5 using LoRA on exported conversation data.

Usage:
    python -m finetune.train --epochs 3 --lr 2e-4
"""

import os
import json
import argparse
from datasets import load_dataset


def load_conversations(data_path):
    data = []
    with open(data_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    return data


def format_for_qwen(example, tokenizer):
    text = tokenizer.apply_chat_template(
        example["messages"], tokenize=False, add_generation_prompt=False
    )
    return {"text": text}


def train(args):
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
    from peft import LoraConfig, get_peft_model, TaskType
    from torch.utils.data import Dataset

    data_path = args.data
    if not os.path.exists(data_path):
        print(f"Data not found at {data_path}. Run export_data.py first.")
        return

    print(f"Loading model: {args.model}")
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        args.model, torch_dtype="auto", trust_remote_code=True
    )

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.1,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    raw_data = load_conversations(data_path)
    print(f"Loaded {len(raw_data)} training examples")

    class ChatDataset(Dataset):
        def __init__(self, data, tokenizer, max_length=512):
            self.data = data
            self.tokenizer = tokenizer
            self.max_length = max_length

        def __len__(self):
            return len(self.data)

        def __getitem__(self, idx):
            example = self.data[idx]
            text = self.tokenizer.apply_chat_template(
                example["messages"], tokenize=False, add_generation_prompt=False
            )
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

    dataset = ChatDataset(raw_data, tokenizer, max_length=args.max_length)

    output_dir = os.path.join(os.path.dirname(__file__), "checkpoints", "lora")
    os.makedirs(output_dir, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        warmup_steps=args.warmup,
        logging_steps=10,
        save_steps=args.save_steps,
        save_total_limit=3,
        fp16=args.fp16,
        dataloader_pin_memory=False,
        report_to="none",
        remove_unused_columns=False,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
    )

    print("Starting training...")
    trainer.train()

    merged_dir = os.path.join(os.path.dirname(__file__), "checkpoints", "merged")
    os.makedirs(merged_dir, exist_ok=True)
    model.save_pretrained(merged_dir)
    tokenizer.save_pretrained(merged_dir)
    print(f"Model saved to {merged_dir}")


def main():
    parser = argparse.ArgumentParser(description="Fine-tune Qwen2.5 with LoRA")
    parser.add_argument("--model", type=str, default="Qwen/Qwen2.5-0.5B-Instruct")
    parser.add_argument("--data", type=str, default=os.path.join(os.path.dirname(__file__), "data", "conversations.jsonl"))
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--grad-accum", type=int, default=8)
    parser.add_argument("--warmup", type=int, default=50)
    parser.add_argument("--max-length", type=int, default=512)
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    parser.add_argument("--save-steps", type=int, default=100)
    parser.add_argument("--fp16", action="store_true")
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
