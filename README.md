# Determine-AI

A powerful, customizable AI assistant with chat, image analysis, code generation, web search, and more.

## Features

- **Streaming Chat** — Real-time token-by-token responses.
- **Image Analysis** — Upload images and discuss them with AI (BLIP vision model).
- **Code Generation** — Generate complete projects, functions, and full-stack apps.
- **Web Search** — Enhanced responses with real-time web context.
- **Session Management** — Persistent chat history with MongoDB.
- **Admin Panel** — Monitor users, messages, and sessions.
- **User Auth** — JWT-based registration and login, Google OAuth.
- **Premium Tiers** — 4 subscription plans with increasing capabilities.
- **CLI Tool** — Command-line interface for terminal-based AI access.
- **Multi-Language** — English, Russian, and Uzbek interface.
- **Fine-tuning** — Export chat data and fine-tune with LoRA.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..
cd admin && npm install && npm run build && cd ..

# 2. Configure .env with your MongoDB connection string

# 3. Run
python run.py
```

Open http://localhost:8000 — register and start chatting.
Admin panel: http://localhost:8000/admin (login: admin / admin123)

## How to Train Your AI (Improve Its Knowledge)

Your Determine-AI can be fine-tuned on your own conversations to become better at responding the way you want.

### Step 1: Have conversations

Use the chat app normally. The more conversations you have, the better the training data.

### Step 2: Export your data

This reads all chats from MongoDB and saves them as training data:

```bash
python -m finetune.export_data
```

This creates `finetune/data/conversations.jsonl` with all your chat history formatted as training examples.

### Step 3: Install training dependencies

```bash
pip install datasets peft
```

### Step 4: Fine-tune with LoRA

LoRA (Low-Rank Adaptation) lets you fine-tune the model efficiently without needing a GPU farm:

```bash
# Basic fine-tuning (works on CPU, slow but works)
python -m finetune.train --epochs 3 --lr 2e-4

# If you have a GPU:
python -m finetune.train --epochs 3 --lr 2e-4 --fp16

# More epochs = more learning (but risk overfitting)
python -m finetune.train --epochs 5 --lr 1e-4 --max-length 1024

# Adjust LoRA rank for more/fewer trainable parameters
python -m finetune.train --lora-r 32 --lora-alpha 64
```

The fine-tuned model saves to `finetune/checkpoints/merged/`.

### Step 5: Use your fine-tuned model

Option A — Load it directly by pointing `MODEL_NAME` in `.env` to the merged checkpoint:

```
MODEL_NAME=D:\coding\determinate-ai\finetune\checkpoints\merged
```

Option B — Upload it to HuggingFace and use the model name:

```bash
python -c "from huggingface_hub import HfApi; HfApi().upload_folder('finetune/checkpoints/merged', repo_id='your-username/determine-ai-finetuned')"
```

Then set `MODEL_NAME=your-username/determine-ai-finetuned` in `.env`.

### What the fine-tuning parameters mean

| Parameter | What it does | Recommended |
|-----------|-------------|-------------|
| `--epochs` | How many times to loop through data | 3-5 |
| `--lr` | Learning rate (how fast it learns) | 2e-4 |
| `--lora-r` | LoRA rank (more = more capacity) | 16 |
| `--batch-size` | Examples per step | 2 (CPU) / 4+ (GPU) |
| `--max-length` | Max conversation length in tokens | 512-1024 |
| `--fp16` | Use half-precision (needs GPU) | if GPU available |

### Tips for better training

1. **More data = better** — Have at least 50-100 conversations before fine-tuning
2. **Quality matters** — Remove bad/outlier conversations before exporting
3. **Don't overtrain** — Start with 3 epochs, check results, increase if needed
4. **Regular retraining** — Export and retrain periodically as you get more conversations
5. **Test after training** — Chat with the fine-tuned model and compare to base model

## Architecture

```
determinate-ai/
  backend/
    main.py        — FastAPI server, routes, system prompt, premium tiers
    database.py    — MongoDB operations (motor async driver)
    auth.py        — JWT auth, password hashing
  frontend/        — React chat UI with image upload
  admin/           — React admin panel
  cli/             — Command-line interface tool
  infer.py         — Inference engine + BLIP vision engine
  finetune/
    export_data.py — Export MongoDB chats to JSONL training format
    train.py       — LoRA fine-tuning
```

## Privacy

- All AI inference runs on your machine.
- No telemetry, no analytics, no external API calls.
- Chat data stored in your own MongoDB instance.
- Model: Built on open-source transformer architecture.

## License

MIT
