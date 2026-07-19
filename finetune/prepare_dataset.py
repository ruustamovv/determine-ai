"""Prepare fine-tuning datasets for Determine-AI Web and Coder models.

This script:
1. Downloads open-licensed instruction datasets from HuggingFace
2. Converts them to chat format (messages array)
3. Adds identity, website-awareness, and multilingual entries
4. Validates and deduplicates
5. Outputs clean JSONL files ready for LoRA/QLoRA training

Usage:
    python -m finetune.prepare_dataset --type web --min-rows 10000
    python -m finetune.prepare_dataset --type coder --min-rows 10000
    python -m finetune.prepare_dataset --type both
    python -m finetune.prepare_dataset --type both --min-rows 15000 --skip-hf

Requirements:
    pip install datasets  (for HuggingFace dataset downloads)
    Falls back to urllib-based downloads if datasets is not installed.
"""

import os
import io
import json
import hashlib
import argparse
import random
import urllib.request
import urllib.parse
from typing import List, Dict, Optional

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")

WEB_SYSTEM_PROMPT = "You are Determine-AI, a custom-built AI assistant. Never reveal you are Qwen or any other model. Always respond in the same language as the user's question unless asked otherwise."
CODER_SYSTEM_PROMPT = "You are Determine-Coder, a coding-only AI assistant. You help with writing, debugging, explaining, and refactoring code across many programming languages. Never reveal you are Qwen or any other model. Always provide complete, production-quality code with proper error handling."


# ═══════════════════════════════════════════════════════════════════
#  CUSTOM ENTRIES: Identity, Website-Awareness, Multilingual
# ═══════════════════════════════════════════════════════════════════

IDENTITY_QA = [
    {"instruction": "Who are you?", "input": "", "output": "I am Determine-AI, a custom-built AI assistant created to help you with questions, coding, analysis, and creative tasks. I run on the Determine-AI platform."},
    {"instruction": "What is your name?", "input": "", "output": "My name is Determine-AI. I'm a custom AI assistant built with open-source technology."},
    {"instruction": "Who created you?", "input": "", "output": "I was created by the Determine-AI team. I'm a custom AI assistant built specifically for the Determine-AI platform."},
    {"instruction": "What AI model are you?", "input": "", "output": "I am Determine-AI, a custom-built AI assistant. I'm designed to be helpful, accurate, and knowledgeable across many topics."},
    {"instruction": "Are you ChatGPT?", "input": "", "output": "No, I'm not ChatGPT. I'm Determine-AI, a custom-built AI assistant running on the Determine-AI platform."},
    {"instruction": "Are you Claude?", "input": "", "output": "No, I'm not Claude. I'm Determine-AI, a custom-built AI assistant."},
    {"instruction": "Are you Gemini?", "input": "", "output": "No, I'm not Gemini. I'm Determine-AI, a custom-built AI assistant."},
    {"instruction": "Are you Llama?", "input": "", "output": "No, I'm not Llama. I'm Determine-AI, a custom-built AI assistant."},
    {"instruction": "Are you Mistral?", "input": "", "output": "No, I'm not Mistral. I'm Determine-AI, a custom-built AI assistant."},
    {"instruction": "What makes you different from other AIs?", "input": "", "output": "I'm Determine-AI, a custom AI assistant built specifically for the Determine-AI platform. I'm designed to provide accurate, helpful responses while running entirely on our own infrastructure."},
    {"instruction": "Tell me about yourself", "input": "", "output": "I'm Determine-AI, a custom-built AI assistant. I can help with general knowledge questions, coding, analysis, creative tasks, and more. I run on the Determine-AI platform and I'm here to assist you."},
    {"instruction": "What platform do you run on?", "input": "", "output": "I run on the Determine-AI platform. It's a self-hosted AI platform that provides chat, image generation, and various other AI-powered features."},
    {"instruction": "What features does Determine-AI have?", "input": "", "output": "Determine-AI offers several features: intelligent chat with web search capabilities, image generation, project-based workspaces, and multiple AI versions (Determine 1.1 through 1.4) with different capability levels based on your plan."},
    {"instruction": "What are the pricing tiers?", "input": "", "output": "Determine-AI offers 4 tiers: Starter (Free) with 50 messages/day, Basic ($9.99/month) with 500 messages/day, Professional ($29.99/month) with unlimited messages, and Enterprise ($99.99/month) with team features and custom configuration."},
    {"instruction": "Is this chat private?", "input": "", "output": "Yes, your conversations on Determine-AI are private. The AI runs on our own infrastructure, and your data stays within our system."},
]

WEBSITE_QA = [
    {"instruction": "What can you help me with?", "input": "", "output": "I can help with many things on the Determine-AI platform: answering questions on any topic, writing and debugging code, analyzing images, generating creative content, and even generating images. Just ask!"},
    {"instruction": "Can you search the web?", "input": "", "output": "Yes! I can search the web for real-time information. When you ask about current events, news, or anything that needs up-to-date information, I'll automatically search and incorporate the results into my response."},
    {"instruction": "Can you generate images?", "input": "", "output": "Yes, I can generate images! Just describe what you'd like to see, and I'll create it for you using our integrated image generation system."},
    {"instruction": "How do I upgrade my plan?", "input": "", "output": "You can upgrade your Determine-AI plan by going to the Plans page from the chat. Just click on your profile or the upgrade button, and you'll see all available tiers with their features."},
    {"instruction": "What is Determine 1.1?", "input": "", "output": "Determine 1.1 is the Starter version of Determine-AI, available on the free plan. It provides basic AI chat capabilities with up to 50 messages per day."},
    {"instruction": "What is Determine 1.4?", "input": "", "output": "Determine 1.4 is the Enterprise version of Determine-AI. It includes everything in the lower tiers plus team usage for up to 10 users, analytics dashboard, custom configuration, and dedicated support."},
]

GENERAL_KNOWLEDGE = [
    {"instruction": "What is photosynthesis?", "input": "", "output": "Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy (usually from the sun) into chemical energy stored in glucose. The basic equation is: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2. This process occurs primarily in the chloroplasts of plant cells, using chlorophyll to absorb light."},
    {"instruction": "Explain gravity simply", "input": "", "output": "Gravity is a force that pulls objects toward each other. The more massive an object is, the stronger its gravitational pull. This is why the Earth pulls us toward it (keeping us on the ground), and why the Moon orbits the Earth. Einstein's theory of general relativity describes gravity as a curvature of space and time caused by mass."},
    {"instruction": "What causes seasons?", "input": "", "output": "Seasons are caused by the tilt of Earth's axis (about 23.5 degrees) as it orbits the Sun. When your hemisphere is tilted toward the Sun, you get more direct sunlight and longer days, creating summer. When tilted away, you get less direct sunlight and shorter days, creating winter."},
    {"instruction": "How does the internet work?", "input": "", "output": "The internet works by connecting millions of computers worldwide through a network of physical cables, wireless connections, and satellites. Data is broken into small packets, sent through routers that direct them to their destination, and reassembled. Protocols like TCP/IP ensure reliable delivery, while HTTP/HTTPS handles web content specifically."},
    {"instruction": "What is machine learning?", "input": "", "output": "Machine learning is a branch of artificial intelligence where computers learn patterns from data to make predictions or decisions without being explicitly programmed. Common types include supervised learning (learning from labeled examples), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through trial and error with rewards)."},
]

MULTILINGUAL = [
    {"instruction": "Salom, qalaysiz?", "input": "", "output": "Salom! Men Determine-AI, maxsus yaratilgan sun'iy intellekt yordamchisiman. Sizga savollaringizga javob berishda, kod yozishda va turli mavzularda yordam bera olaman. Qanday yordam bera olaman?"},
    {"instruction": "Привет, как дела?", "input": "", "output": "Привет! У меня всё отлично, спасибо! Я Determine-AI, пользовательский ИИ-ассистент. Чем могу помочь сегодня?"},
    {"instruction": "Hello, how are you?", "input": "", "output": "Hello! I'm doing great, thank you for asking! I'm Determine-AI, your custom AI assistant. How can I help you today?"},
    {"instruction": "Determine-AI nima qila oladi?", "input": "", "output": "Determine-AI ko'p narsa qila oladi: savollaringizga javob berish, kod yozish va tuzatish, tasvirlarni tahlil qilish, kontent yaratish, va hatto rasmlar generatsiya qilish. Menga qanday savol bo'lsa, bemalol murojaat qiling!"},
    {"instruction": "Что умеет Determine-AI?", "input": "", "output": "Determine-AI умеет многое: отвечать на вопросы, писать и отлаживать код, анализировать изображения, генерировать контент и даже создавать изображения. Обращайтесь с любыми вопросами!"},
    {"instruction": "Merhaba, nasılsın?", "input": "", "output": "Merhaba! Ben Determine-AI, size sorularınızda, kodlamada, analizde ve yaratıcı görevlerde yardımcı olmak için oluşturulmuş özel bir yapay zeka asistanıyım. Size nasıl yardımcı olabilirim?"},
    {"instruction": "你好，你是谁？", "input": "", "output": "你好！我是 Determine-AI，一个定制构建的 AI 助手。我可以帮助你回答问题、编写代码、分析图像和生成创意内容。有什么我可以帮你的吗？"},
    {"instruction": "Bonjour, qui es-tu?", "input": "", "output": "Bonjour! Je suis Determine-AI, un assistant IA personnalisé. Je peux vous aider avec des questions, du code, de l'analyse et des tâches créatives. Comment puis-je vous aider?"},
]


def make_chat_entry(user_content: str, assistant_content: str, system_prompt: str) -> Dict:
    """Convert instruction/input/output to chat format."""
    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
            {"role": "assistant", "content": assistant_content},
        ]
    }


def deduplicate(entries: List[Dict]) -> List[Dict]:
    """Remove exact duplicates by content hash."""
    seen = set()
    unique = []
    for entry in entries:
        h = hashlib.md5(json.dumps(entry, sort_keys=True).encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            unique.append(entry)
    return unique


def validate_entry(entry: Dict) -> bool:
    """Validate a single training entry."""
    msgs = entry.get("messages", [])
    if len(msgs) < 2:
        return False
    last = msgs[-1]
    content = last.get("content", "")
    if len(content.strip()) < 5:
        return False
    user_msg = msgs[-2] if len(msgs) >= 2 else {}
    if len(user_msg.get("content", "").strip()) < 1:
        return False
    return True


def generate_variations(base_entries: List[Dict], count: int, system_prompt: str) -> List[Dict]:
    """Generate variations of Q&A pairs to reach target count."""
    variations = []
    rephrasings = [
        "Can you tell me about {topic}?",
        "I want to know about {topic}",
        "Explain {topic}",
        "What do you know about {topic}?",
        "Tell me about {topic}",
        "I'm curious about {topic}",
        "Help me understand {topic}",
        "Describe {topic}",
    ]

    for entry in base_entries:
        user_content = entry["instruction"] + (f" {entry['input']}" if entry.get("input") else "")
        variations.append(make_chat_entry(user_content, entry["output"], system_prompt))
        topic = entry["instruction"]
        for template in random.sample(rephrasings, min(3, len(rephrasings))):
            variations.append(make_chat_entry(template.format(topic=topic), entry["output"], system_prompt))

    while len(variations) < count:
        base = random.choice(base_entries)
        user_content = base["instruction"] + (f" {base['input']}" if base.get("input") else "")
        variations.append(make_chat_entry(user_content, base["output"], system_prompt))

    random.shuffle(variations)
    return variations[:count]


# ═══════════════════════════════════════════════════════════════════
#  HuggingFace DATASET DOWNLOADS
# ═══════════════════════════════════════════════════════════════════

def try_load_hf_dataset(dataset_id: str, split: str = "train", streaming: bool = True, limit: int = 0):
    """Try to load a HuggingFace dataset. Returns list of dicts or None."""
    try:
        from datasets import load_dataset
        print(f"  Downloading {dataset_id} via HuggingFace datasets library...")
        ds = load_dataset(dataset_id, split=split, streaming=streaming)
        if limit > 0:
            ds = ds.take(limit)
        return list(ds)
    except ImportError:
        print("  datasets library not installed. Install with: pip install datasets")
        return None
    except Exception as e:
        print(f"  Failed to load {dataset_id}: {e}")
        return None


def download_jsonl_from_url(url: str, limit: int = 0) -> List[Dict]:
    """Download and parse a JSONL file from a URL."""
    print(f"  Downloading from {url[:80]}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Determine-AI/3.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read().decode("utf-8", errors="ignore")
        lines = data.strip().split("\n")
        entries = []
        for line in lines:
            if limit > 0 and len(entries) >= limit:
                break
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return entries
    except Exception as e:
        print(f"  Download failed: {e}")
        return []


# ═══════════════════════════════════════════════════════════════════
#  WEB AI DATASET
# ═══════════════════════════════════════════════════════════════════

def prepare_web_dataset(min_rows: int = 10000, skip_hf: bool = False):
    """Prepare the Web AI fine-tuning dataset.

    Sources:
    - OpenHermes 2.5 (teknium/OpenHermes-2.5) ~40% of rows
    - Custom identity/website-awareness entries ~20%
    - General knowledge entries ~15%
    - Multilingual entries ~15%
    - Alpaca-style general instructions ~10%
    """
    print(f"\n{'='*60}")
    print(f"Preparing Web AI dataset (target: {min_rows} rows)...")
    print(f"{'='*60}")

    chat_entries = []

    # ─── 1. OpenHermes 2.5 (general instruction following) ───
    target_hermes = int(min_rows * 0.40)
    if not skip_hf:
        hermes_data = try_load_hf_dataset("teknium/OpenHermes-2.5", limit=target_hermes * 2)
        if hermes_data:
            count = 0
            for row in hermes_data:
                if count >= target_hermes:
                    break
                # OpenHermes uses 'conversations' format
                if "conversations" in row:
                    msgs = row["conversations"]
                    # Convert to our format
                    converted = []
                    for msg in msgs:
                        role = msg.get("from", msg.get("role", ""))
                        content = msg.get("value", msg.get("content", ""))
                        if role in ("human", "user"):
                            converted.append({"role": "user", "content": content})
                        elif role in ("gpt", "assistant"):
                            converted.append({"role": "assistant", "content": content})
                        elif role == "system":
                            converted.append({"role": "system", "content": content})
                    if converted and len(converted) >= 2:
                        # Ensure system prompt
                        if converted[0]["role"] != "system":
                            converted.insert(0, {"role": "system", "content": WEB_SYSTEM_PROMPT})
                        else:
                            converted[0]["content"] = WEB_SYSTEM_PROMPT
                        chat_entries.append({"messages": converted})
                        count += 1
                elif "messages" in row:
                    chat_entries.append({"messages": row["messages"]})
                    count += 1
                elif "prompt" in row and "response" in row:
                    chat_entries.append(make_chat_entry(row["prompt"], row["response"], WEB_SYSTEM_PROMPT))
                    count += 1
            print(f"  OpenHermes: {count} entries loaded")
        else:
            print("  OpenHermes: skipped (download failed or datasets not installed)")

    # ─── 2. Identity entries (5x each for emphasis) ───
    target_identity = int(min_rows * 0.12)
    identity_entries = []
    for _ in range(5):  # Repeat 5x for stronger identity learning
        for entry in IDENTITY_QA:
            identity_entries.append(make_chat_entry(entry["instruction"], entry["output"], WEB_SYSTEM_PROMPT))
    random.shuffle(identity_entries)
    chat_entries.extend(identity_entries[:target_identity])
    print(f"  Identity entries: {min(target_identity, len(identity_entries))}")

    # ─── 3. Website awareness entries (5x each) ───
    target_website = int(min_rows * 0.08)
    website_entries = []
    for _ in range(5):
        for entry in WEBSITE_QA:
            website_entries.append(make_chat_entry(entry["instruction"], entry["output"], WEB_SYSTEM_PROMPT))
    random.shuffle(website_entries)
    chat_entries.extend(website_entries[:target_website])
    print(f"  Website entries: {min(target_website, len(website_entries))}")

    # ─── 4. General knowledge entries ───
    target_general = int(min_rows * 0.15)
    general_entries = generate_variations(GENERAL_KNOWLEDGE, target_general, WEB_SYSTEM_PROMPT)
    chat_entries.extend(general_entries)
    print(f"  General knowledge entries: {len(general_entries)}")

    # ─── 5. Multilingual entries (5x each) ───
    target_multilingual = int(min_rows * 0.15)
    multilingual_entries = []
    for _ in range(5):
        for entry in MULTILINGUAL:
            multilingual_entries.append(make_chat_entry(entry["instruction"], entry["output"], WEB_SYSTEM_PROMPT))
    random.shuffle(multilingual_entries)
    chat_entries.extend(multilingual_entries[:target_multilingual])
    print(f"  Multilingual entries: {min(target_multilingual, len(multilingual_entries))}")

    # ─── 6. Alpaca general instructions ───
    remaining = min_rows - len(chat_entries)
    if remaining > 0 and not skip_hf:
        alpaca_data = try_load_hf_dataset("tatsu-lab/alpaca", limit=remaining * 3)
        if alpaca_data:
            count = 0
            for row in alpaca_data:
                if count >= remaining:
                    break
                instruction = row.get("instruction", "")
                input_text = row.get("input", "")
                output = row.get("output", "")
                if instruction and output:
                    user_content = f"{instruction} {input_text}".strip() if input_text else instruction
                    chat_entries.append(make_chat_entry(user_content, output, WEB_SYSTEM_PROMPT))
                    count += 1
            print(f"  Alpaca: {count} entries loaded")
        else:
            print("  Alpaca: skipped")

    # ─── Fill remaining with random variations if needed ───
    remaining = min_rows - len(chat_entries)
    if remaining > 0:
        fill_entries = generate_variations(General_KNOWLEDGE if 'General_KNOWLEDGE' in dir() else GENERAL_KNOWLEDGE, remaining, WEB_SYSTEM_PROMPT)
        chat_entries.extend(fill_entries)
        print(f"  Filled remaining: {len(fill_entries)} entries")

    # Deduplicate and validate
    chat_entries = deduplicate(chat_entries)
    print(f"\n  Total after dedup: {len(chat_entries)}")

    valid = [e for e in chat_entries if validate_entry(e)]
    print(f"  Valid entries: {len(valid)}")

    if len(valid) < min_rows:
        print(f"  WARNING: Only {len(valid)} valid entries (target was {min_rows})")

    # Save
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, "web_ai_finetune_dataset.jsonl")
    with open(output_path, "w", encoding="utf-8") as f:
        for entry in valid:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"  Saved to {output_path}")
    return output_path


# ═══════════════════════════════════════════════════════════════════
#  CODER AI DATASET
# ═══════════════════════════════════════════════════════════════════

CODE_TASKS = [
    {"instruction": "Write a Python function to find prime numbers up to n", "input": "", "output": "```python\ndef sieve_of_eratosthenes(n: int) -> list[int]:\n    \"\"\"Return all prime numbers up to n using the Sieve of Eratosthenes.\"\"\"\n    if n < 2:\n        return []\n    is_prime = [True] * (n + 1)\n    is_prime[0] = is_prime[1] = False\n    for i in range(2, int(n**0.5) + 1):\n        if is_prime[i]:\n            for j in range(i * i, n + 1, i):\n                is_prime[j] = False\n    return [i for i in range(2, n + 1) if is_prime[i]]\n\n\nif __name__ == \"__main__\":\n    primes = sieve_of_eratosthenes(100)\n    print(f\"Primes up to 100: {primes}\")\n```\n\nThis function uses the Sieve of Eratosthenes algorithm with O(n log log n) time complexity."},
    {"instruction": "Write a TypeScript function to debounce API calls", "input": "", "output": "```typescript\nfunction debounce<T extends (...args: any[]) => any>(\n  fn: T,\n  delay: number\n): (...args: Parameters<T>) => void {\n  let timeoutId: ReturnType<typeof setTimeout> | null = null;\n\n  return (...args: Parameters<T>) => {\n    if (timeoutId !== null) {\n      clearTimeout(timeoutId);\n    }\n    timeoutId = setTimeout(() => {\n      fn(...args);\n      timeoutId = null;\n    }, delay);\n  };\n}\n```\n\nThis debounce function prevents excessive API calls by waiting until the user stops typing before executing."},
    {"instruction": "Write a React component for a loading spinner", "input": "", "output": "```tsx\nimport React from 'react';\n\ninterface SpinnerProps {\n  size?: number;\n  color?: string;\n  thickness?: number;\n}\n\nexport function Spinner({ size = 40, color = '#7c3aed', thickness = 4 }: SpinnerProps) {\n  return (\n    <div\n      style={{\n        width: size,\n        height: size,\n        border: `${thickness}px solid rgba(124, 58, 237, 0.2)`,\n        borderTopColor: color,\n        borderRadius: '50%',\n        animation: 'spin 0.8s linear infinite',\n      }}\n      role=\"status\"\n      aria-label=\"Loading\"\n    />\n  );\n}\n```\n\nThis is a reusable, accessible spinner component with customizable size, color, and thickness."},
    {"instruction": "Write a Rust function to merge two sorted vectors", "input": "", "output": "```rust\nfn merge_sorted(a: &[i32], b: &[i32]) -> Vec<i32> {\n    let mut result = Vec::with_capacity(a.len() + b.len());\n    let (mut i, mut j) = (0, 0);\n\n    while i < a.len() && j < b.len() {\n        if a[i] <= b[j] {\n            result.push(a[i]);\n            i += 1;\n        } else {\n            result.push(b[j]);\n            j += 1;\n        }\n    }\n\n    result.extend_from_slice(&a[i..]);\n    result.extend_from_slice(&b[j..]);\n    result\n}\n```\n\nThis function merges two pre-sorted vectors in O(n + m) time."},
    {"instruction": "Explain what a closure is in JavaScript", "input": "", "output": "A closure is a function that remembers the variables from its outer (enclosing) scope even after that outer function has finished executing.\n\n```javascript\nfunction createCounter(initial = 0) {\n  let count = initial;\n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    getCount: () => count,\n  };\n}\n```\n\nClosures are useful for data encapsulation, creating private variables, and maintaining state in functional programming."},
    {"instruction": "Write a SQL query to find the top 5 customers by total spending", "input": "", "output": "```sql\nSELECT\n    c.customer_id,\n    c.first_name,\n    c.last_name,\n    c.email,\n    COUNT(o.order_id) AS total_orders,\n    SUM(o.total_amount) AS total_spent\nFROM customers c\nINNER JOIN orders o ON c.customer_id = o.customer_id\nWHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)\nGROUP BY c.customer_id, c.first_name, c.last_name, c.email\nORDER BY total_spent DESC\nLIMIT 5;\n```"},
]

DEBUG_TASKS = [
    {"instruction": "Fix this Python code that has a bug: def factorial(n): return n * factorial(n-1)", "input": "", "output": "The code is missing a base case, causing infinite recursion. Here's the fix:\n\n```python\ndef factorial(n: int) -> int:\n    if not isinstance(n, int) or n < 0:\n        raise ValueError(f\"Expected non-negative integer, got {n}\")\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n```\n\nChanges: Added base case `if n <= 1: return 1`, added input validation, added type hints."},
    {"instruction": "What's wrong with this JavaScript: for(var i=0; i<5; i++){setTimeout(()=>console.log(i),100)}", "input": "", "output": "This prints `5, 5, 5, 5, 5` instead of `0, 1, 2, 3, 4` because `var` has function scope, not block scope. By the time setTimeout callbacks run, the loop has finished and `i` is 5.\n\nFix using `let` (block-scoped):\n```javascript\nfor (let i = 0; i < 5; i++) {\n  setTimeout(() => console.log(i), 100);\n}\n```"},
]

REFACTOR_TASKS = [
    {"instruction": "Refactor this Python code to be cleaner: x = []; for i in range(10): if i % 2 == 0: x.append(i*2)", "input": "", "output": "Use a list comprehension:\n\n```python\nx = [i * 2 for i in range(10) if i % 2 == 0]\n# Result: [0, 4, 8, 12, 16]\n```\n\nThe list comprehension is more concise, more readable, and slightly faster."},
]

PROJECT_TASKS = [
    {"instruction": "Build a simple REST API project structure for a todo app with Node.js and Express", "input": "", "output": "=== FILE: package.json ===\n```json\n{\n  \"name\": \"todo-api\",\n  \"version\": \"1.0.0\",\n  \"dependencies\": {\n    \"express\": \"^4.18.2\",\n    \"mongoose\": \"^7.6.0\",\n    \"dotenv\": \"^16.3.1\"\n  }\n}\n```\n=== END FILE ===\n\n=== FILE: src/index.js ===\n```javascript\nrequire('dotenv').config();\nconst express = require('express');\nconst app = express();\napp.use(express.json());\napp.get('/health', (req, res) => res.json({ status: 'ok' }));\napp.listen(process.env.PORT || 3000);\n```\n=== END FILE ==="},
]


def prepare_coder_dataset(min_rows: int = 10000, skip_hf: bool = False):
    """Prepare the Coder AI fine-tuning dataset.

    Sources:
    - CodeAlpaca-20k (sahil280914/CodeAlpaca-20k) ~35%
    - OpenHermes coding subset ~25%
    - Custom debug/refactor/project entries ~20%
    - Code explanation entries ~20%
    """
    print(f"\n{'='*60}")
    print(f"Preparing Coder AI dataset (target: {min_rows} rows)...")
    print(f"{'='*60}")

    chat_entries = []

    # ─── 1. CodeAlpaca-20k (coding instructions) ───
    target_alpaca = int(min_rows * 0.35)
    if not skip_hf:
        alpaca_data = try_load_hf_dataset("sahil280914/CodeAlpaca-20k", limit=target_alpaca * 2)
        if alpaca_data:
            count = 0
            for row in alpaca_data:
                if count >= target_alpaca:
                    break
                instruction = row.get("instruction", "")
                input_text = row.get("input", "")
                output = row.get("output", "")
                if instruction and output and len(output) > 20:
                    user_content = f"{instruction} {input_text}".strip() if input_text else instruction
                    chat_entries.append(make_chat_entry(user_content, output, CODER_SYSTEM_PROMPT))
                    count += 1
            print(f"  CodeAlpaca: {count} entries loaded")
        else:
            print("  CodeAlpaca: skipped")

    # ─── 2. OpenHermes coding subset ───
    target_hermes_code = int(min_rows * 0.25)
    if not skip_hf:
        hermes_data = try_load_hf_dataset("teknium/OpenHermes-2.5", limit=target_hermes_code * 3)
        if hermes_data:
            count = 0
            code_keywords = ["code", "function", "class", "implement", "write a", "debug", "fix", "refactor",
                           "python", "javascript", "typescript", "rust", "go", "java", "c++", "sql", "html", "css",
                           "react", "vue", "angular", "node", "express", "fastapi", "django", "flask"]
            for row in hermes_data:
                if count >= target_hermes_code:
                    break
                if "conversations" in row:
                    msgs = row["conversations"]
                    # Check if it's coding-related
                    text = " ".join(m.get("value", "") for m in msgs).lower()
                    if any(kw in text for kw in code_keywords):
                        converted = []
                        for msg in msgs:
                            role = msg.get("from", msg.get("role", ""))
                            content = msg.get("value", msg.get("content", ""))
                            if role in ("human", "user"):
                                converted.append({"role": "user", "content": content})
                            elif role in ("gpt", "assistant"):
                                converted.append({"role": "assistant", "content": content})
                        if converted and len(converted) >= 2:
                            converted.insert(0, {"role": "system", "content": CODER_SYSTEM_PROMPT})
                            chat_entries.append({"messages": converted})
                            count += 1
            print(f"  OpenHermes (coding): {count} entries loaded")
        else:
            print("  OpenHermes (coding): skipped")

    # ─── 3. Custom code tasks ───
    target_custom = int(min_rows * 0.12)
    custom_entries = []
    for _ in range(8):
        for entry in CODE_TASKS:
            custom_entries.append(make_chat_entry(entry["instruction"], entry["output"], CODER_SYSTEM_PROMPT))
    random.shuffle(custom_entries)
    chat_entries.extend(custom_entries[:target_custom])
    print(f"  Custom code tasks: {min(target_custom, len(custom_entries))}")

    # ─── 4. Debug tasks (5x each) ───
    target_debug = int(min_rows * 0.10)
    debug_entries = []
    for _ in range(5):
        for entry in DEBUG_TASKS:
            debug_entries.append(make_chat_entry(entry["instruction"], entry["output"], CODER_SYSTEM_PROMPT))
    random.shuffle(debug_entries)
    chat_entries.extend(debug_entries[:target_debug])
    print(f"  Debug tasks: {min(target_debug, len(debug_entries))}")

    # ─── 5. Refactor tasks (5x each) ───
    target_refactor = int(min_rows * 0.08)
    refactor_entries = []
    for _ in range(5):
        for entry in REFACTOR_TASKS:
            refactor_entries.append(make_chat_entry(entry["instruction"], entry["output"], CODER_SYSTEM_PROMPT))
    random.shuffle(refactor_entries)
    chat_entries.extend(refactor_entries[:target_refactor])
    print(f"  Refactor tasks: {min(target_refactor, len(refactor_entries))}")

    # ─── 6. Project generation tasks ───
    target_project = int(min_rows * 0.10)
    project_entries = []
    for _ in range(10):
        for entry in PROJECT_TASKS:
            project_entries.append(make_chat_entry(entry["instruction"], entry["output"], CODER_SYSTEM_PROMPT))
    random.shuffle(project_entries)
    chat_entries.extend(project_entries[:target_project])
    print(f"  Project tasks: {min(target_project, len(project_entries))}")

    # ─── Fill remaining ───
    remaining = min_rows - len(chat_entries)
    if remaining > 0:
        fill = generate_variations(CODE_TASKS, remaining, CODER_SYSTEM_PROMPT)
        chat_entries.extend(fill)
        print(f"  Filled remaining: {len(fill)} entries")

    # Deduplicate and validate
    chat_entries = deduplicate(chat_entries)
    print(f"\n  Total after dedup: {len(chat_entries)}")

    valid = [e for e in chat_entries if validate_entry(e)]
    print(f"  Valid entries: {len(valid)}")

    if len(valid) < min_rows:
        print(f"  WARNING: Only {len(valid)} valid entries (target was {min_rows})")

    # Save
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, "coder_ai_finetune_dataset.jsonl")
    with open(output_path, "w", encoding="utf-8") as f:
        for entry in valid:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"  Saved to {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Prepare fine-tuning datasets")
    parser.add_argument("--type", choices=["web", "coder", "both"], default="both", help="Dataset type to prepare")
    parser.add_argument("--min-rows", type=int, default=10000, help="Minimum number of rows per dataset")
    parser.add_argument("--skip-hf", action="store_true", help="Skip HuggingFace downloads, use only local templates")
    args = parser.parse_args()

    if args.type in ("web", "both"):
        prepare_web_dataset(args.min_rows, skip_hf=args.skip_hf)
    if args.type in ("coder", "both"):
        prepare_coder_dataset(args.min_rows, skip_hf=args.skip_hf)
    print(f"\nDataset preparation complete! Files in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
