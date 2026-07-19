"""Export chat data from MongoDB to JSONL for fine-tuning."""

import os
import json
import asyncio
from datetime import datetime

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "determinate_ai")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")


async def export_conversations():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    messages_col = db["messages"]
    sessions_col = db["sessions"]

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, "conversations.jsonl")

    sessions = await sessions_col.find().to_list(5000)
    total_pairs = 0

    with open(output_file, "w", encoding="utf-8") as f:
        for session in sessions:
            sid = session["session_id"]
            msgs = await messages_col.find(
                {"session_id": sid}
            ).sort("created_at", 1).to_list(200)

            turns = []
            for msg in msgs:
                role = msg.get("role", "user")
                if role in ("user", "assistant"):
                    turns.append({"role": role, "content": msg["content"]})

            if len(turns) < 2:
                continue

            for i in range(0, len(turns) - 1, 2):
                if turns[i]["role"] == "user" and turns[i + 1]["role"] == "assistant":
                    entry = {
                        "messages": [
                            {"role": "system", "content": "You are a helpful AI assistant."},
                            turns[i],
                            turns[i + 1],
                        ]
                    }
                    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
                    total_pairs += 1

    print(f"Exported {total_pairs} conversation pairs to {output_file}")
    client.close()
    return output_file


if __name__ == "__main__":
    asyncio.run(export_conversations())
