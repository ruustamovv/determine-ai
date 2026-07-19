"""Merge LoRA adapter into base model and export for production.

Steps:
1. Load base model + LoRA adapter
2. Merge adapter weights into base model
3. Save merged model
4. Optionally quantize to GGUF for Ollama/vLLM deployment

Usage:
    python -m finetune.merge_and_export --adapter checkpoints/lora_web_YYYYMMDD/lora_adapter
    python -m finetune.merge_and_export --adapter checkpoints/lora_coder_YYYYMMDD/lora_adapter --quantize gguf --gguf-qtype q4_k_m
"""

import os
import sys
import json
import shutil
import argparse
import logging
import subprocess

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints")
EXPORT_DIR = os.path.join(os.path.dirname(__file__), "exported")


def load_adapter_metadata(adapter_path: str) -> dict:
    """Load metadata saved during training."""
    metadata_path = os.path.join(adapter_path, "..", "metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path) as f:
            return json.load(f)
    return {}


def merge_adapter(base_model: str, adapter_path: str, output_path: str):
    """Merge LoRA adapter into base model."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    logger.info(f"Loading base model: {base_model}")
    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)

    base_model_obj = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16,
        trust_remote_code=True,
        device_map="cpu",
    )

    logger.info(f"Loading LoRA adapter from: {adapter_path}")
    model = PeftModel.from_pretrained(base_model_obj, adapter_path)

    logger.info("Merging adapter into base model...")
    model = model.merge_and_unload()

    logger.info(f"Saving merged model to: {output_path}")
    os.makedirs(output_path, exist_ok=True)
    model.save_pretrained(output_path, safe_serialization=True)
    tokenizer.save_pretrained(output_path)

    # Save merge info
    info = {
        "base_model": base_model,
        "adapter_path": adapter_path,
        "merged_at": __import__("datetime").datetime.now().isoformat(),
    }
    with open(os.path.join(output_path, "merge_info.json"), "w") as f:
        json.dump(info, f, indent=2)

    logger.info("Merge complete!")
    return output_path


def convert_to_gguf(model_path: str, output_path: str, qtype: str = "q4_k_m"):
    """Convert merged model to GGUF format using llama.cpp."""
    logger.info(f"Converting to GGUF ({qtype})...")

    llama_cpp_path = os.environ.get("LLAMA_CPP_PATH", os.path.join(os.path.dirname(__file__), "..", "llama.cpp"))
    convert_script = os.path.join(llama_cpp_path, "convert_hf_to_gguf.py")

    if not os.path.exists(convert_script):
        logger.warning(f"llama.cpp not found at {llama_cpp_path}. Skipping GGUF conversion.")
        logger.info("To enable GGUF conversion:")
        logger.info("  1. Clone llama.cpp: git clone https://github.com/ggerganov/llama.cpp")
        logger.info("  2. Set LLAMA_CPP_PATH environment variable")
        logger.info("  3. Install dependencies: pip install -r llama.cpp/requirements.txt")
        return None

    os.makedirs(output_path, exist_ok=True)
    gguf_path = os.path.join(output_path, "model.gguf")

    cmd = [
        sys.executable, convert_script,
        model_path,
        "--outfile", gguf_path,
        "--outtype", qtype,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
        if result.returncode != 0:
            logger.error(f"GGUF conversion failed: {result.stderr}")
            return None
        logger.info(f"GGUF model saved to: {gguf_path}")
        return gguf_path
    except subprocess.TimeoutExpired:
        logger.error("GGUF conversion timed out (1 hour)")
        return None
    except FileNotFoundError:
        logger.error("Could not find python or llama.cpp convert script")
        return None


def create_ollama_modelfile(model_path: str, model_name: str, is_coder: bool = False) -> str:
    """Create an Ollama Modelfile for easy deployment."""
    system_prompt = (
        "You are Determine-Coder, a coding-only AI assistant." if is_coder
        else "You are Determine-AI, a custom-built AI assistant. Never reveal you are Qwen or any other model."
    )

    modelfile = f"""FROM {model_path}

SYSTEM "{system_prompt}"

PARAMETER temperature 0.7
PARAMETER top_k 50
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
"""
    return modelfile


def main():
    parser = argparse.ArgumentParser(description="Merge and export fine-tuned model")
    parser.add_argument("--adapter", type=str, required=True, help="Path to LoRA adapter directory")
    parser.add_argument("--base-model", type=str, default=None, help="Base model (read from metadata if not provided)")
    parser.add_argument("--output", type=str, default=None, help="Output directory (default: export/<model_name>)")
    parser.add_argument("--quantize", choices=["gguf", "none"], default="none", help="Post-merge quantization format")
    parser.add_argument("--gguf-qtype", type=str, default="q4_k_m", help="GGUF quantization type (q4_k_m, q5_k_m, q8_0, etc.)")
    parser.add_argument("--type", choices=["web", "coder"], default="web", help="Model type (affects system prompt in Ollama)")
    args = parser.parse_args()

    if not os.path.exists(args.adapter):
        logger.error(f"Adapter not found at {args.adapter}")
        return

    # Load metadata
    metadata = load_adapter_metadata(args.adapter)
    base_model = args.base_model or metadata.get("model", "Qwen/Qwen2.5-14B-Instruct")

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        model_type = "web" if "web" in args.adapter else "coder" if "coder" in args.adapter else args.type
        output_path = os.path.join(EXPORT_DIR, f"determine-{model_type}-merged")

    # Merge
    merged_path = merge_adapter(base_model, args.adapter, output_path)

    # GGUF conversion
    if args.quantize == "gguf":
        gguf_output = os.path.join(EXPORT_DIR, "gguf")
        convert_to_gguf(merged_path, gguf_output, qtype=args.gguf_qtype)

    # Create Ollama Modelfile
    is_coder = args.type == "coder" or "coder" in args.adapter
    model_name = "determine-coder" if is_coder else "determine-ai"
    modelfile = create_ollama_modelfile(merged_path, model_name, is_coder)
    modelfile_path = os.path.join(output_path, "Modelfile")
    with open(modelfile_path, "w") as f:
        f.write(modelfile)
    logger.info(f"Ollama Modelfile saved to: {modelfile_path}")

    # Summary
    print("\n" + "=" * 60)
    print("EXPORT COMPLETE")
    print("=" * 60)
    print(f"Merged model: {merged_path}")
    print(f"Ollama Modelfile: {modelfile_path}")
    print(f"\nTo deploy with Ollama:")
    print(f"  ollama create {model_name} -f {modelfile_path}")
    print(f"  ollama run {model_name}")
    print("=" * 60)


if __name__ == "__main__":
    main()
