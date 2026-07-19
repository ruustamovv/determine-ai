"""MongoDB connection and database operations."""

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from datetime import datetime
from typing import Optional, List

import motor.motor_asyncio
from bson import ObjectId

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "determine_ai")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

users_col = db["users"]
sessions_col = db["sessions"]
messages_col = db["messages"]
teachings_col = db["teachings"]
announcements_col = db["announcements"]
premium_col = db["premium_subscriptions"]
settings_col = db["user_settings"]
ai_config_col = db["ai_config"]
user_teachings_col = db["user_teachings"]
blog_col = db["blog_posts"]


async def init_db():
    await users_col.create_index("username", unique=True)
    await sessions_col.create_index("user_id")
    await sessions_col.create_index("created_at")
    await messages_col.create_index("session_id")
    await messages_col.create_index("created_at")
    await teachings_col.create_index("created_at")
    await announcements_col.create_index("created_at")
    await premium_col.create_index("user_id")
    await settings_col.create_index("username", unique=True)
    await ai_config_col.create_index("key", unique=True)
    await user_teachings_col.create_index([("user_id", 1), ("created_at", -1)])
    projects_col = db["projects"]
    await projects_col.create_index([("visibility", 1), ("created_at", -1)])
    await projects_col.create_index("username")
    await blog_col.create_index("slug", unique=True)
    await blog_col.create_index([("published", -1), ("created_at", -1)])
    await blog_col.create_index("tags")
    existing_config = await ai_config_col.find_one({"key": "main"})
    if not existing_config:
        await ai_config_col.insert_one({
            "key": "main",
            "system_prompt": "",
            "custom_features": [],
            "tier_versions": {"free": "1.1", "basic": "1.2", "pro": "1.3", "enterprise": "1.4"},
            "payment_urls": {"basic": "", "pro": "", "enterprise": ""},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })


def ser(doc):
    if doc is None:
        return None
    d = dict(doc)
    d["id"] = str(d.pop("_id"))
    return d


def sers(docs):
    return [ser(d) for d in docs]


class User:
    @staticmethod
    async def create(username, password_hash, role="user", display_name=None):
        doc = {
            "username": username,
            "password": password_hash,
            "role": role,
            "display_name": display_name or username,
            "created_at": datetime.utcnow(),
        }
        r = await users_col.insert_one(doc)
        doc["_id"] = r.inserted_id
        return ser(doc)

    @staticmethod
    async def find_by_username(username):
        return ser(await users_col.find_one({"username": username}))

    @staticmethod
    async def find_all():
        return sers(await users_col.find().to_list(5000))

    @staticmethod
    async def count():
        return await users_col.count_documents({})

    @staticmethod
    async def delete(user_id):
        r = await users_col.delete_one({"_id": ObjectId(user_id)})
        return r.deleted_count > 0

    @staticmethod
    async def update_role(user_id, role):
        r = await users_col.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": role}})
        return r.modified_count > 0

    @staticmethod
    async def update_subscription(user_id, tier_id):
        r = await users_col.update_one({"_id": ObjectId(user_id)}, {"$set": {"subscription": tier_id}})
        return r.modified_count > 0

    @staticmethod
    async def update_display_name(username, display_name):
        r = await users_col.update_one({"username": username}, {"$set": {"display_name": display_name}})
        return r.modified_count > 0

    @staticmethod
    async def update_password(username, password_hash):
        r = await users_col.update_one({"username": username}, {"$set": {"password": password_hash}})
        return r.modified_count > 0


class Session:
    @staticmethod
    async def create(session_id, user_id, title="New Chat"):
        doc = {"session_id": session_id, "user_id": user_id, "title": title, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "message_count": 0}
        r = await sessions_col.insert_one(doc)
        doc["_id"] = r.inserted_id
        return ser(doc)

    @staticmethod
    async def find(session_id):
        return ser(await sessions_col.find_one({"session_id": session_id}))

    @staticmethod
    async def find_by_user(user_id):
        return sers(await sessions_col.find({"user_id": user_id}).sort("updated_at", -1).to_list(500))

    @staticmethod
    async def find_all(limit=200):
        return sers(await sessions_col.find().sort("updated_at", -1).limit(limit).to_list(limit))

    @staticmethod
    async def update(session_id, title=None, message_count=None):
        update_fields = {"updated_at": datetime.utcnow()}
        if title is not None:
            update_fields["title"] = title
        if message_count is not None:
            update_fields["message_count"] = message_count
        await sessions_col.update_one({"session_id": session_id}, {"$set": update_fields})

    @staticmethod
    async def delete(session_id):
        r = await sessions_col.delete_one({"session_id": session_id})
        await messages_col.delete_many({"session_id": session_id})
        return r.deleted_count > 0

    @staticmethod
    async def delete_by_user(user_id):
        sessions = await Session.find_by_user(user_id)
        for s in sessions:
            await Session.delete(s["session_id"])

    @staticmethod
    async def count():
        return await sessions_col.count_documents({})


class Message:
    @staticmethod
    async def create(session_id, role, content, username=None):
        doc = {"session_id": session_id, "role": role, "content": content, "username": username, "created_at": datetime.utcnow()}
        r = await messages_col.insert_one(doc)
        doc["_id"] = r.inserted_id
        return ser(doc)

    @staticmethod
    async def find_by_session(session_id, limit=100):
        return sers(await messages_col.find({"session_id": session_id}).sort("created_at", 1).limit(limit).to_list(limit))

    @staticmethod
    async def find_all(limit=100, skip=0):
        return sers(await messages_col.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit))

    @staticmethod
    async def count():
        return await messages_col.count_documents({})

    @staticmethod
    async def delete(msg_id):
        r = await messages_col.delete_one({"_id": ObjectId(msg_id)})
        return r.deleted_count > 0

    @staticmethod
    async def update(msg_id, content):
        r = await messages_col.update_one({"_id": ObjectId(msg_id)}, {"$set": {"content": content}})
        return r.modified_count > 0

    @staticmethod
    async def delete_by_session(session_id):
        r = await messages_col.delete_many({"session_id": session_id})
        return r.deleted_count

    @staticmethod
    async def search(query, limit=50):
        return sers(await messages_col.find({"content": {"$regex": query, "$options": "i"}}).sort("created_at", -1).limit(limit).to_list(limit))


class BlogPost:
    @staticmethod
    async def create(title, slug, excerpt, content, author, tags=None, published=False):
        now = datetime.utcnow()
        doc = {
            "title": title,
            "slug": slug,
            "excerpt": excerpt,
            "content": content,
            "author": author,
            "tags": tags or [],
            "published": published,
            "created_at": now,
            "updated_at": now,
        }
        r = await blog_col.insert_one(doc)
        doc["_id"] = r.inserted_id
        return ser(doc)

    @staticmethod
    async def find_by_slug(slug):
        return ser(await blog_col.find_one({"slug": slug}))

    @staticmethod
    async def find_by_id(post_id):
        return ser(await blog_col.find_one({"_id": ObjectId(post_id)}))

    @staticmethod
    async def find_published(limit=50):
        return sers(await blog_col.find({"published": True}).sort("created_at", -1).limit(limit).to_list(limit))

    @staticmethod
    async def find_all(limit=100):
        return sers(await blog_col.find().sort("created_at", -1).limit(limit).to_list(limit))

    @staticmethod
    async def update(post_id, update_fields):
        update_fields["updated_at"] = datetime.utcnow()
        r = await blog_col.update_one({"_id": ObjectId(post_id)}, {"$set": update_fields})
        return r.modified_count > 0

    @staticmethod
    async def delete(post_id):
        r = await blog_col.delete_one({"_id": ObjectId(post_id)})
        return r.deleted_count > 0

    @staticmethod
    async def count():
        return await blog_col.count_documents({})
