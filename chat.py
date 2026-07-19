"""CLI Chat interface with memory for Determine-AI."""

import os
import sys
import time
import json
import argparse
from datetime import datetime
from typing import List, Dict, Optional


class ChatMemory:
    def __init__(self, max_history: int = 10, max_memory_entries: int = 50):
        self.max_history = max_history
        self.max_memory_entries = max_memory_entries
        self.conversation_history: List[Dict[str, str]] = []
        self.memories: List[Dict[str, str]] = []

    def add_user_message(self, text: str):
        self.conversation_history.append({"role": "user", "content": text})

    def add_assistant_message(self, text: str):
        self.conversation_history.append({"role": "assistant", "content": text})

    def add_memory(self, content: str):
        self.memories.append({"content": content, "timestamp": datetime.now().isoformat()})
        if len(self.memories) > self.max_memory_entries:
            self.memories = self.memories[-self.max_memory_entries:]

    def clear_history(self):
        self.conversation_history.clear()

    def build_prompt(self, system_prompt: str, user_message: str) -> str:
        recent = self.conversation_history[-self.max_history:]
        parts = []
        for msg in recent:
            if msg["role"] == "user":
                parts.append(f"User: {msg['content']}")
            else:
                parts.append(f"Bot: {msg['content']}")
        parts.append(f"User: {user_message}")
        parts.append("Bot:")
        return " ".join(parts)

    def get_stats(self) -> Dict[str, int]:
        return {"history_turns": len(self.conversation_history), "memories_stored": len(self.memories)}


def main():
    parser = argparse.ArgumentParser(description="Determine-AI Chat")
    parser.add_argument("--model", type=str, default=None)
    parser.add_argument("--device", type=str, default="auto")
    args = parser.parse_args()

    from infer import InferenceEngine
    engine = InferenceEngine(model_name=args.model, device=args.device)
    memory = ChatMemory()

    print("=" * 50)
    print("  DETERMINATE-AI Chat")
    print("=" * 50)

    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("/quit", "/exit", "/q"):
                break
            if user_input == "/clear":
                memory.clear_history()
                print("History cleared.")
                continue

            memory.add_user_message(user_input)
            messages = [{"role": "system", "content": "You are a helpful assistant."}]
            messages.extend(memory.conversation_history[-memory.max_history:])

            start = time.time()
            print("Assistant: ", end="", flush=True)
            full = []
            for token in engine.generate_stream(messages, max_new_tokens=256):
                print(token, end="", flush=True)
                full.append(token)
            print()
            memory.add_assistant_message("".join(full).strip())
            elapsed = time.time() - start
            print(f"  ({elapsed:.2f}s)")

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break


if __name__ == "__main__":
    main()
