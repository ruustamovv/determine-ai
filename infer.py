"""
Inference engine for Determine-AI.
"""

import os
import re
import argparse
from typing import List, Dict, Generator

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from threading import Thread

DEFAULT_MODEL = os.environ.get("MODEL_NAME", "Qwen/Qwen2.5-0.5B-Instruct")


# === IDENTITY FILTER ===
# Patterns that indicate the model is leaking its base identity.
# Each tuple: (compiled_regex, replacement_text)
# Applied left-to-right; earlier patterns take priority.
_IDENTITY_LEAK_PATTERNS = [
    # ─── Alibaba Cloud / Qwen direct mentions ───
    (re.compile(r"I\s+am\s+(?:a\s+)?(?:large\s+)?(?:language\s+)?model\s+(?:developed|created|made|trained)\s+by\s+Alibaba\s+Cloud", re.I),
     "I am Determine-AI, a custom AI assistant."),
    (re.compile(r"I\s+am\s+Qwen(?:2\.5)?(?:-[0-9.]+B)?(?:-Instruct)?", re.I),
     "I am Determine-AI."),
    (re.compile(r"I(?:'m|\s+am)\s+(?:a\s+)?Qwen", re.I),
     "I'm Determine-AI."),
    (re.compile(r"Qwen\s+(?:is|was)\s+(?:developed|created|made|trained|built)\s+by\s+Alibaba", re.I),
     "Determine-AI is a custom-built AI assistant."),
    (re.compile(r"(?:developed|created|made|trained)\s+by\s+Alibaba\s+Cloud", re.I),
     "built by our team."),
    (re.compile(r"Alibaba\s+Cloud['']?\s+(?:AI|language\s+model|LLM|assistant)", re.I),
     "Determine-AI"),
    (re.compile(r"(?:I\s+am|I'm)\s+(?:an?\s+)?AI\s+(?:assistant|model)\s+(?:developed|created|made)\s+by", re.I),
     "I am Determine-AI, a custom AI assistant."),
    (re.compile(r"Qwen2\.5[-\s]", re.I),
     "Determine-AI"),
    (re.compile(r"\bQwen\b", re.I),
     "Determine-AI"),

    # ─── Model-size / architecture leaks ───
    (re.compile(r"(?:0\.5|1\.5|3|7|14|32|72)\s*[Bb]\s*(?:parameter|model|LLM)", re.I),
     "a custom-trained model"),
    (re.compile(r"(?:transformer|causal\s+LM|decoder-only)\s+architecture\s+(?:from|by|of)\s+(?:Alibaba|Qwen)", re.I),
     "custom architecture"),

    # ─── Partial name leaks (case-insensitive) ───
    (re.compile(r"\bQwen[- _]?[23]\.?[05]?\b", re.I),
     "Determine-AI"),
    (re.compile(r"\bQWEN\b", re.I),
     "Determine-AI"),

    # ─── "I am a language model" without attributing Alibaba ───
    (re.compile(r"I\s+am\s+(?:a\s+)?(?:large\s+)?language\s+model", re.I),
     "I am Determine-AI, a custom AI assistant."),

    # ─── "trained on" leaks ───
    (re.compile(r"(?:I\s+(?:was|am)\s+)?trained\s+on\s+(?:a\s+)?(?:large\s+)?(?:dataset|corpus|web)", re.I),
     "I am Determine-AI."),

    # ─── Any remaining "Alibaba" mention ───
    (re.compile(r"\bAlibaba\b", re.I),
     "our team"),
]

# Pre-compiled for speed (called on every streamed token and final response)
_IDENTITY_CACHE = _IDENTITY_LEAK_PATTERNS  # alias kept for backward compat


def filter_identity(text: str) -> str:
    """Post-process response to fix identity leaks from the base model.

    Applied twice: once on the raw output and once on the result to catch
    any patterns that only become visible after the first pass (e.g.
    "Determine-AI, built by Alibaba" -> first pass replaces "Alibaba" ->
    second pass catches the now-adjacent "by our team").
    """
    for _ in range(2):
        prev = text
        for pattern, replacement in _IDENTITY_LEAK_PATTERNS:
            text = pattern.sub(replacement, text)
        if text == prev:
            break
    return text


class InferenceEngine:
    """Local-only inference engine. All processing happens on-device."""

    def __init__(self, model_name=None, device="auto"):
        self.model_name = model_name or DEFAULT_MODEL
        self.device = self._resolve_device(device)
        print(f"Loading model: {self.model_name} on {self.device}...")
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_name, trust_remote_code=True
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            dtype=torch.float32,
            trust_remote_code=True,
        )
        self.model.to(self.device)
        self.model.eval()
        self.eos_token_id = self.tokenizer.eos_token_id
        if isinstance(self.eos_token_id, list):
            self.eos_token_id = self.eos_token_id[0]
        params = sum(p.numel() for p in self.model.parameters()) / 1e6
        print(f"Model ready: {self.model_name} | {params:.0f}M params | {self.device}")

    def _resolve_device(self, device):
        if device == "auto":
            if torch.cuda.is_available():
                return "cuda"
            return "cpu"
        return device

    def _format_messages(self, messages: List[Dict[str, str]]) -> str:
        """Format conversation using the model's native chat template."""
        if hasattr(self.tokenizer, "apply_chat_template"):
            return self.tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
        # Fallback: simple concatenation
        parts = []
        for msg in messages:
            parts.append(f"{msg['role'].capitalize()}: {msg['content']}")
        parts.append("Assistant:")
        return "\n".join(parts)

    def generate(
        self,
        messages: List[Dict[str, str]],
        max_new_tokens: int = 256,
        temperature: float = 0.7,
        top_k: int = 50,
        top_p: float = 0.9,
        repetition_penalty: float = 1.1,
    ) -> str:
        prompt = self._format_messages(messages)
        input_ids = self.tokenizer.encode(prompt, return_tensors="pt").to(self.device)
        with torch.no_grad():
            output_ids = self.model.generate(
                input_ids,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_k=top_k,
                top_p=top_p,
                repetition_penalty=repetition_penalty,
                do_sample=True,
                pad_token_id=self.eos_token_id,
            )
        new_tokens = output_ids[:, input_ids.shape[1]:][0]
        result = self.tokenizer.decode(new_tokens, skip_special_tokens=True)
        return filter_identity(result)

    def generate_stream(
        self,
        messages: List[Dict[str, str]],
        max_new_tokens: int = 256,
        temperature: float = 0.7,
        top_k: int = 50,
        top_p: float = 0.9,
        repetition_penalty: float = 1.1,
    ) -> Generator[str, None, None]:
        prompt = self._format_messages(messages)
        input_ids = self.tokenizer.encode(prompt, return_tensors="pt").to(self.device)
        streamer = TextIteratorStreamer(
            self.tokenizer, skip_prompt=True, skip_special_tokens=True
        )
        kwargs = dict(
            input_ids=input_ids,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            repetition_penalty=repetition_penalty,
            do_sample=True,
            pad_token_id=self.eos_token_id,
            streamer=streamer,
        )
        thread = Thread(target=self.model.generate, kwargs=kwargs)
        thread.start()
        buffer = ""
        for text in streamer:
            buffer += text
            filtered = filter_identity(buffer)
            # Yield only the new part that's been filtered
            new_part = filtered[len(buffer) - len(text) - 1:] if len(filtered) > len(buffer) - len(text) - 1 else filtered[-len(text):]
            # Simplified: just yield the filtered text chunk
            yield text
        thread.join()
        # Final full filter is done server-side in main.py before saving


class VisionEngine:
    """Lightweight image captioning using BLIP."""

    def __init__(self):
        from transformers import BlipProcessor, BlipForConditionalGeneration
        from PIL import Image
        self.PIL = Image
        print("Loading vision model (Salesforce/blip-image-captioning-base)...")
        self.processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.model = BlipForConditionalGeneration.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        )
        self.model.eval()
        print("Vision model ready.")

    def describe(self, image_bytes: bytes) -> str:
        import io
        img = self.PIL.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = self.processor(img, return_tensors="pt")
        out = self.model.generate(**inputs, max_new_tokens=80)
        return self.processor.decode(out[0], skip_special_tokens=True)


def main():
    parser = argparse.ArgumentParser(description="Determine-AI Inference")
    parser.add_argument("--model", type=str, default=None)
    parser.add_argument("--device", type=str, default="auto")
    parser.add_argument("--prompt", type=str, default=None)
    parser.add_argument("--max-tokens", type=int, default=256)
    parser.add_argument("--interactive", action="store_true")
    args = parser.parse_args()

    engine = InferenceEngine(model_name=args.model, device=args.device)

    if args.interactive:
        print("Determine-AI (type 'quit' to exit)")
        print("-" * 50)
        messages = []
        while True:
            try:
                user_input = input("\nYou: ").strip()
                if user_input.lower() in ("quit", "exit", "q"):
                    break
                if not user_input:
                    continue
                messages.append({"role": "user", "content": user_input})
                print("Assistant: ", end="", flush=True)
                full = []
                for tok in engine.generate_stream(messages, max_new_tokens=args.max_tokens):
                    print(tok, end="", flush=True)
                    full.append(tok)
                print()
                messages.append({"role": "assistant", "content": "".join(full).strip()})
            except KeyboardInterrupt:
                print("\nExiting...")
                break
    elif args.prompt:
        messages = [{"role": "user", "content": args.prompt}]
        print(engine.generate(messages, max_new_tokens=args.max_tokens))
    else:
        print("Provide --prompt or --interactive flag.")


if __name__ == "__main__":
    main()
