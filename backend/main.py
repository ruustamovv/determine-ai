"""Determine-AI Backend API."""

import os
import re
import urllib.request
import urllib.parse
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import json
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import base64
from bson import ObjectId

from backend.database import init_db, User, Session, Message, BlogPost, db, ser, sers, messages_col, sessions_col, ai_config_col, blog_col
from backend.auth import hash_password, verify_password, create_token, get_current_user, require_admin
from infer import filter_identity

engine = None
vision_engine = None

SEARCH_KEYWORDS = [
    "search", "look up", "find online", "what's happening", "what is happening",
    "latest", "current", "today", "news", "recent", "update", "updates",
    "what's new", "what is new", "trending", "happening now", "right now",
    "search the web", "google", "find out", "look for", "what are the latest",
    "current events", "breaking", "this week", "this month", "this year",
]

IMAGE_GEN_KEYWORDS = [
    # Direct commands
    "generate an image", "create an image", "make an image", "draw an image",
    "generate a picture", "create a picture", "make a picture", "draw a picture",
    "generate an image of", "create an image of", "make an image of", "draw an image of",
    "generate a picture of", "create a picture of", "make a picture of", "draw a picture of",
    "generate a photo", "create a photo", "make a photo",
    "generate a drawing", "create a drawing", "make a drawing",
    # "of" variants
    "image of", "picture of", "photo of", "drawing of", "painting of",
    "illustration of", "render of", "visualization of",
    # Request phrases
    "can you draw", "can you generate", "can you create an image",
    "can you make a picture", "can you make an image",
    "draw me", "generate me", "create me a picture",
    "make me a picture", "make me an image",
    "i want to see", "i want a picture", "i want an image",
    "show me a picture", "show me an image", "show me a photo",
    "i need a picture", "i need an image",
    # Single word triggers (only if not in a question context)
    "paint ", "paint a", "paint me",
    "sketch ", "sketch a", "sketch me",
    "visualize ", "visualize a",
]

# Words that suggest a visual description (for prompt-only detection)
VISUAL_WORDS = [
    "beautiful", "cute", "dark", "bright", "colorful", "vibrant", "stunning",
    "red", "blue", "green", "purple", "orange", "golden", "neon",
    "landscape", "portrait", "scene", "sunset", "sunrise", "ocean",
    "mountain", "city", "night", "sky", "forest", "beach", "desert",
    "fantasy", "sci-fi", "space", "galaxy", "nebula", "dragon", "castle",
    "robot", "cyberpunk", "steampunk", "warrior", "wizard", "fairy",
    "cat", "dog", "horse", "bird", "wolf", "lion", "tiger", "bear",
    "house", "building", "tower", "bridge", "car", "ship", "airplane",
    "flower", "tree", "garden", "waterfall", "river", "lake",
    "fire", "ice", "lightning", "storm", "cloud", "rain", "snow",
    "abstract", "geometric", "minimal", "retro", "vintage", "modern",
    "pixel art", "anime", "cartoon", "realistic", "oil painting",
    "watercolor", "sketch", "3d render", "cinematic", "dramatic",
    "cozy", "epic", "magical", "mystical", "dark", "moody",
]

# Image generation marker pattern from the model
IMAGE_MARKER_RE = re.compile(r"\[GENERATE_IMAGE:\s*(.+?)\]", re.I)


def detect_search_intent(message: str) -> bool:
    msg = message.lower()
    return any(kw in msg for kw in SEARCH_KEYWORDS)


def detect_image_gen_intent(message: str) -> bool:
    """Detect if the user wants to generate an image. Aggressive detection."""
    msg = message.lower().strip()

    # Explicit keyword match
    if any(kw in msg for kw in IMAGE_GEN_KEYWORDS):
        return True

    # Prompt-only style: "a beautiful sunset", "a cat in space", "cyberpunk city at night"
    # Short message that looks like a visual description
    if len(msg) < 200:
        # Starts with "a " or "an " (indefinite article = describing something)
        if msg.startswith("a ") or msg.startswith("an "):
            question_words = ["what", "how", "why", "when", "where", "who",
                            "can", "could", "would", "should", "is", "are",
                            "do", "does", "did", "will", "shall", "may"]
            if not any(msg.startswith(qw) for qw in question_words):
                if any(vw in msg for vw in VISUAL_WORDS):
                    return True

        # Doesn't start with a question word and contains visual words
        question_starts = ["what", "how", "why", "when", "where", "who",
                          "can ", "could ", "would ", "should ", "is ", "are ",
                          "do ", "does ", "did ", "will ", "shall ", "may ",
                          "tell me", "explain", "help me", "i need help",
                          "write ", "code ", "build ", "create a project",
                          "what is", "what are", "how do", "how to"]
        if not any(msg.startswith(qw) for qw in question_starts):
            if any(vw in msg for vw in VISUAL_WORDS):
                # Extra check: must be relatively short and not look like a question
                if len(msg) < 150 and "?" not in msg:
                    return True

    return False


def extract_image_prompt(message: str) -> str:
    """Extract the image generation prompt from the user's message."""
    msg_lower = message.lower()
    # Remove common prefixes (longest first for greedy match)
    prefixes = [
        "generate an image of ", "create an image of ", "make an image of ", "draw an image of ",
        "generate a picture of ", "create a picture of ", "make a picture of ", "draw a picture of ",
        "generate a photo of ", "create a photo of ", "make a photo of ",
        "generate a drawing of ", "create a drawing of ",
        "generate image of ", "create image of ", "make image of ", "draw image of ",
        "generate picture of ", "create picture of ", "make picture of ", "draw picture of ",
        "generate an image ", "create an image ", "make an image ", "draw an image ",
        "generate a picture ", "create a picture ", "make a picture ", "draw a picture ",
        "generate a photo ", "create a photo ", "make a photo ",
        "generate me a picture of ", "create me a picture of ", "draw me a picture of ",
        "generate me a picture ", "create me a picture ", "draw me a picture ",
        "generate me an image of ", "create me an image of ", "draw me an image of ",
        "generate me an image ", "create me an image ", "draw me an image ",
        "can you generate an image of ", "can you create an image of ",
        "can you generate an image ", "can you create an image ",
        "can you draw ", "can you generate ", "can you make a picture of ",
        "can you make an image of ", "can you make an image ",
        "draw me ", "generate me ", "create me a picture of ", "make me a picture of ",
        "make me an image of ", "make me a picture ", "make me an image ",
        "i want to see ", "i want a picture of ", "i want an image of ",
        "i want a picture ", "i want an image ",
        "show me a picture of ", "show me an image of ", "show me a photo of ",
        "show me a picture ", "show me an image ", "show me a photo ",
        "i need a picture of ", "i need an image of ",
        "i need a picture ", "i need an image ",
        "paint ", "sketch ", "visualize ", "illustration of ", "render ",
        "a picture of ", "an image of ", "a photo of ", "a drawing of ",
    ]
    prompt = msg_lower
    for prefix in sorted(prefixes, key=len, reverse=True):
        if prompt.startswith(prefix):
            prompt = prompt[len(prefix):]
            break
    prompt = prompt.strip().rstrip(".")
    if not prompt or len(prompt) < 3:
        prompt = message.strip().rstrip(".")
    return prompt


async def generate_image_pollinations(prompt: str, width: int = 1024, height: int = 1024, model: str = "flux", enhance: bool = True) -> str:
    """Generate an image via Pollinations.ai with retry and fallback. Returns base64 data URI or empty string."""
    import asyncio
    seed = int(__import__("time").time()) % 100000
    enhanced_prompt = f"{prompt}, masterpiece, best quality, highly detailed" if enhance else prompt
    encoded = urllib.parse.quote(enhanced_prompt)

    urls = [
        f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&model={model}&seed={seed}&nologo=true",
        f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={seed}&nologo=true",
    ]

    for url in urls:
        for attempt in range(2):
            try:
                req_obj = urllib.request.Request(url, headers={"User-Agent": "Determine-AI/3.0"})
                with urllib.request.urlopen(req_obj, timeout=90) as resp:
                    img_data = resp.read()
                    content_type = resp.headers.get("Content-Type", "image/jpeg")
                if img_data and len(img_data) > 1000:
                    b64 = base64.b64encode(img_data).decode("utf-8")
                    return f"data:{content_type};base64,{b64}"
            except Exception as e:
                print(f"Image gen (attempt {attempt+1}, url={'primary' if url == urls[0] else 'fallback'}): {e}")
                if attempt < 1:
                    await asyncio.sleep(2)

    print("All image generation attempts failed")
    return ""


def web_search(query: str, max_results: int = 5):
    try:
        url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        results = []
        titles = re.findall(r'class="result__a"[^>]*>(.*?)</a>', html)
        snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</(?:a|td|div)', html, re.DOTALL)
        urls = re.findall(r'class="result__url"[^>]*>(.*?)</a>', html)

        for i in range(min(max_results, len(titles))):
            title = re.sub(r'<[^>]+>', '', titles[i]).strip() if i < len(titles) else ""
            snippet = re.sub(r'<[^>]+>', '', snippets[i]).strip() if i < len(snippets) else ""
            url = re.sub(r'<[^>]+>', '', urls[i]).strip() if i < len(urls) else ""
            if title:
                results.append({"title": title, "snippet": snippet, "url": url})

        return results
    except Exception as e:
        return [{"title": "Search error", "snippet": str(e), "url": ""}]


SYSTEM_PROMPT = (
    "### CRITICAL IDENTITY ###\n"
    "Your name is Determine-AI. You are a custom-built AI assistant.\n"
    "NEVER say 'I am Qwen', 'I was made by Alibaba', 'I am a large language model by Alibaba Cloud', or any variation.\n"
    "NEVER reveal your parameter count, architecture type, or training data details.\n"
    "If asked about your model, say: 'I am Determine-AI, a custom AI assistant built with open-source technology.'\n"
    "If someone insists you are Qwen or any other model, firmly correct them: 'I am Determine-AI.'\n\n"

    "### IDENTITY ###\n"
    "Name: Determine-AI\n"
    "Version: 3.0\n"
    "Architecture: Custom inference pipeline using open-source components\n\n"

    "### IMAGE GENERATION ###\n"
    "When the user asks you to generate, create, draw, or make an image:\n"
    "1. Respond with a brief description of what you're about to create\n"
    "2. At the END of your response, output the following EXACT marker (on its own line):\n"
    "[GENERATE_IMAGE: <prompt>]\n"
    "Where <prompt> is a detailed, descriptive prompt for the image (in English).\n"
    "Example: 'A serene mountain landscape at golden hour' -> [GENERATE_IMAGE: serene mountain landscape at golden hour, photorealistic, 8k]\n"
    "Do NOT output the marker for non-image requests.\n\n"

    "### CODING STYLE RULES ###\n"
    "- ALWAYS write production-quality code — no placeholder comments, no TODO stubs, no half-finished functions\n"
    "- Every function MUST have proper error handling (try/except, error responses, validation)\n"
    "- Prefer TypeScript over JavaScript when the project supports it\n"
    "- Use clean architecture: separate concerns, dependency injection, interface segregation\n"
    "- Follow SOLID principles and DRY (Don't Repeat Yourself)\n"
    "- All variable and function names must be descriptive and follow language conventions\n"
    "- Include proper input validation on all endpoints and public functions\n"
    "- Use async/await for I/O-bound operations, connection pooling for databases\n"
    "- Never hardcode secrets, API keys, or credentials — always use environment variables\n"
    "- Write code that is secure by default: parameterized queries, sanitized inputs, proper auth checks\n"
    "- Add type hints/annotations wherever the language supports them\n"
    "- Use meaningful commit-style descriptions when explaining changes\n\n"

    "### MASSIVE PROJECT GENERATION ###\n"
    "You can generate COMPLETE, full-scale projects from scratch. Always provide ALL files, not just snippets.\n\n"

    "#### Full-Stack Web Applications ####\n"
    "- React + Node.js/Express, Vue + FastAPI, Next.js full-stack, Angular + .NET, SvelteKit\n"
    "- Include: package.json, tsconfig, vite.config, routing, state management, components, pages\n"
    "- Backend: controllers, services, middleware, database models, migrations, seed data\n"
    "- Authentication: JWT, OAuth2, session-based, role-based access control (RBAC)\n"
    "- Real-time features: WebSockets, Socket.io, Server-Sent Events\n\n"

    "#### Mobile Applications ####\n"
    "- React Native (Expo or bare workflow), Flutter (Dart), Swift (iOS), Kotlin (Android)\n"
    "- Include: navigation, state management, API layer, offline storage, push notifications\n"
    "- Platform-specific: iOS Info.plist, AndroidManifest.xml, build.gradle\n\n"

    "#### CLI Tools & Developer Utilities ####\n"
    "- Python (Click/Typer), Node.js (Commander/Yargs), Rust (Clap), Go (Cobra)\n"
    "- Include: argument parsing, help text, config files, logging, colored output\n"
    "- Package properly with setup.py/pyproject.toml/package.json for distribution\n\n"

    "#### Database Design ####\n"
    "- Schema definitions (SQL CREATE TABLE, Mongoose schemas, Prisma schema)\n"
    "- Migration files with up/down operations\n"
    "- Proper indexes for performance (compound indexes, text indexes)\n"
    "- Seed data and fixtures for development\n"
    "- Support: PostgreSQL, MySQL, SQLite, MongoDB, Redis, DynamoDB\n\n"

    "#### DevOps & Infrastructure ####\n"
    "- Docker: multi-stage Dockerfiles, docker-compose.yml with services\n"
    "- Kubernetes: Deployment, Service, Ingress, ConfigMap, Secret manifests\n"
    "- CI/CD: GitHub Actions, GitLab CI, Jenkins pipelines with build/test/deploy stages\n"
    "- Terraform: infrastructure as code for AWS/GCP/Azure\n"
    "- Ansible: playbooks for server configuration\n"
    "- Nginx/Apache reverse proxy configs\n\n"

    "#### API Design ####\n"
    "- REST: proper HTTP methods, status codes, pagination, filtering, versioning\n"
    "- GraphQL: schemas, resolvers, subscriptions, DataLoader for N+1 prevention\n"
    "- WebSocket: connection management, rooms, events, heartbeat\n"
    "- gRPC: proto files, service definitions, streaming\n"
    "- API documentation: OpenAPI/Swagger specs\n\n"

    "#### System Architecture ####\n"
    "- Microservices: service boundaries, API gateway, service discovery\n"
    "- Event-driven: message queues (RabbitMQ, Kafka, Redis Streams)\n"
    "- Serverless: AWS Lambda, Cloudflare Workers, Vercel Functions\n"
    "- Caching strategies: Redis, CDN, application-level caching\n"
    "- Load balancing and auto-scaling configurations\n\n"

    "#### Testing ####\n"
    "- Unit tests: pytest, Jest, Vitest, JUnit, Go testing\n"
    "- Integration tests: API testing, database testing, external service mocking\n"
    "- E2E tests: Playwright, Cypress, Selenium\n"
    "- Load testing: k6, Locust, Artillery scripts\n"
    "- Test fixtures, factories, and helpers\n"
    "- Target 80%+ coverage for critical paths\n\n"

    "#### Security ####\n"
    "- Authentication: JWT with refresh tokens, OAuth2 flows, SAML, SSO\n"
    "- Authorization: RBAC, ABAC, permission matrices\n"
    "- Input validation and sanitization (SQL injection, XSS prevention)\n"
    "- Rate limiting with sliding window or token bucket algorithms\n"
    "- CORS configuration, CSP headers, security headers\n"
    "- Encryption: at-rest (AES-256), in-transit (TLS), password hashing (bcrypt/argon2)\n"
    "- Secrets management with vault integration\n\n"

    "#### Data Pipelines & ML ####\n"
    "- ETL pipelines with Apache Airflow, Prefect, or custom scripts\n"
    "- ML pipelines: data preprocessing, training, evaluation, deployment\n"
    "- Feature stores and model registries\n"
    "- Data validation with Great Expectations or custom validators\n"
    "- Streaming data processing with Kafka or Flink\n\n"

    "#### Complete Project Scaffolding ####\n"
    "When asked to create a project, ALWAYS provide:\n"
    "1. Complete file/directory structure tree\n"
    "2. Every single file with full implementation code\n"
    "3. Configuration files (package.json, requirements.txt, Cargo.toml, go.mod, etc.)\n"
    "4. README.md with setup instructions, architecture overview, and usage examples\n"
    "5. Environment variable templates (.env.example)\n"
    "6. Git ignore rules (.gitignore)\n"
    "7. Linter and formatter configs (.eslintrc, .prettierrc, pyproject.toml, etc.)\n"
    "8. CI/CD pipeline configuration\n"
    "9. Docker setup for containerization\n"
    "10. Database migrations and seed data\n\n"

    "### CAPABILITIES ###\n"
    "- Answer questions on any topic with accuracy and depth\n"
    "- Write, explain, debug, and architect code in ANY programming language\n"
    "- Generate complete, production-ready code for complex projects\n"
    "- Design software architecture, database schemas, system design\n"
    "- Write entire multi-file projects from scratch\n"
    "- Analyze and describe images (BLIP vision)\n"
    "- Generate images from text descriptions (use [GENERATE_IMAGE: prompt] marker)\n"
    "- Help with math, science, writing, analysis, creative tasks\n"
    "- Web search via DuckDuckGo — when you receive web search results in your context, use them to provide up-to-date, accurate answers about current events, news, and real-time information\n"
    "- DevOps, Docker, CI/CD, cloud deployment, Terraform, Ansible\n"
    "- Data structures, algorithms, competitive programming\n"
    "- React, Vue, Angular, Svelte, Next.js, Express, FastAPI, Django, Flask, Spring Boot, and any framework\n"
    "- SQL, MongoDB, Redis, Cassandra, DynamoDB, database design with schemas and migrations\n"
    "- Tests: unit, integration, e2e, load tests for any language/framework\n"
    "- Mobile: React Native, Flutter, Swift, Kotlin\n"
    "- CLI tools: Python/Click, Node/Commander, Rust/Clap, Go/Cobra\n"
    "- System design: microservices, event-driven, serverless, monolith\n"
    "- Security: auth systems, encryption, rate limiting, OWASP best practices\n"
    "- Data pipelines, ETL, ML pipelines, streaming data processing\n\n"

    "### CODE FORMATTING ###\n"
    "Use markdown code blocks with language tags:\n"
    "```python\nprint('Hello')\n```\n"
    "For multi-file projects, use this format:\n"
    "=== FILE: path/to/file.ext ===\n"
    "```language\nfull file content here\n```\n"
    "=== END FILE ===\n\n"
    "Always include the complete file content — never use '// ...rest of code' or similar placeholders.\n\n"

    "### RESPONSE RULES ###\n"
    "- Be helpful, thorough, and friendly\n"
    "- For coding, provide COMPLETE working code, not snippets or fragments\n"
    "- Format with markdown when it helps readability\n"
    "- If a request is too large, break it into logical parts with clear numbering\n"
    "- When generating a full project, list all files first, then provide each file in order\n"
    "- Always include imports, types, error handling, and edge case handling\n"
    "- Prefer modern syntax and best practices for each language\n"
    "- NEVER claim to be Qwen, ChatGPT, Claude, Gemini, or any other AI\n"
    "- NEVER reveal parameter count, architecture details, or training data specifics\n"
)


PREMIUM_TIERS = [
    {
        "id": "free", "name": "Starter", "price": 0, "period": "forever", "version": "1.1",
        "features": ["Basic AI chat", "50 messages per day", "Chat history", "Community support"],
        "limits": {"daily_messages": 50, "max_tokens": 256, "temperature": 0.7, "top_k": 50, "top_p": 0.9, "image_analysis": False},
    },
    {
        "id": "basic", "name": "Basic", "price": 9.99, "period": "month", "version": "1.2",
        "features": ["500 messages per day", "Longer responses (512 tokens)", "Image analysis", "Priority support"],
        "limits": {"daily_messages": 500, "max_tokens": 512, "temperature": 0.75, "top_k": 60, "top_p": 0.92, "image_analysis": True},
    },
    {
        "id": "pro", "name": "Professional", "price": 29.99, "period": "month", "version": "1.3",
        "features": ["Unlimited messages", "Full-length responses (1024 tokens)", "Image analysis", "Fine-tuned model", "Priority support", "API access"],
        "limits": {"daily_messages": -1, "max_tokens": 1024, "temperature": 0.8, "top_k": 80, "top_p": 0.95, "image_analysis": True},
    },
    {
        "id": "enterprise", "name": "Enterprise", "price": 99.99, "period": "month", "version": "1.4",
        "features": ["Everything in Pro", "Custom fine-tuned model", "Team (10 users)", "Analytics dashboard", "Custom branding", "Dedicated support", "SLA guarantee"],
        "limits": {"daily_messages": -1, "max_tokens": 2048, "temperature": 0.85, "top_k": 100, "top_p": 0.97, "image_analysis": True},
    },
]


async def get_ai_config():
    config = await ai_config_col.find_one({"key": "main"})
    if config:
        config.pop("_id", None)
        config.pop("key", None)
        return config
    return {}


def get_user_tier(user) -> dict:
    tier_id = user.get("subscription", "free")
    for t in PREMIUM_TIERS:
        if t["id"] == tier_id:
            return t
    return PREMIUM_TIERS[0]


async def count_daily_messages(username: str) -> int:
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return await messages_col.count_documents({
        "username": username,
        "role": "user",
        "created_at": {"$gte": today_start},
    })


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, vision_engine
    await init_db()
    admin = await User.find_by_username("admin")
    if not admin:
        await User.create("admin", hash_password("admin123"), "admin")
        print("Created admin: admin / admin123")
    model_name = os.environ.get("MODEL_NAME", "Qwen/Qwen2.5-0.5B-Instruct")
    try:
        from infer import InferenceEngine
        engine = InferenceEngine(model_name=model_name, device="auto")
        print(f"AI loaded: {model_name}")
    except Exception as e:
        print(f"AI load failed: {e}")
    try:
        from infer import VisionEngine
        vision_engine = VisionEngine()
        print("Vision model loaded")
    except Exception as e:
        print(f"Vision model not available: {e}")
    yield


app = FastAPI(title="Determine-AI", version="3.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class LoginReq(BaseModel):
    username: str
    password: str

class RegisterReq(BaseModel):
    username: str
    password: str

class ChatReq(BaseModel):
    message: str
    session_id: Optional[str] = None
    version: Optional[str] = None

class MsgUpdate(BaseModel):
    content: str

class ImageChatReq(BaseModel):
    message: str
    image: str
    session_id: Optional[str] = None

class SubscribeReq(BaseModel):
    tier_id: str

class AnnouncementReq(BaseModel):
    title: str
    content: str

class TeachingReq(BaseModel):
    topic: str
    content: str

class SettingsReq(BaseModel):
    theme: Optional[str] = None
    aiTextColor: Optional[str] = None
    fontSize: Optional[int] = None
    accentColor: Optional[str] = None
    language: Optional[str] = None

class ProfileUpdateReq(BaseModel):
    display_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class RoleReq(BaseModel):
    role: str

class AssignPlanReq(BaseModel):
    tier_id: str

class GoogleAuthReq(BaseModel):
    code: str
    redirect_uri: str

class AIConfigReq(BaseModel):
    system_prompt: Optional[str] = None
    custom_features: Optional[List[str]] = None
    tier_versions: Optional[dict] = None
    payment_urls: Optional[dict] = None

class BlogPostReq(BaseModel):
    title: str
    excerpt: Optional[str] = ""
    content: str
    tags: Optional[List[str]] = []
    published: Optional[bool] = False

class BlogUpdateReq(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    published: Optional[bool] = None


@app.post("/api/auth/register")
async def register(req: RegisterReq):
    if len(req.username) < 2:
        raise HTTPException(400, "Username too short")
    if len(req.password) < 4:
        raise HTTPException(400, "Password too short")
    existing = await User.find_by_username(req.username)
    if existing:
        raise HTTPException(400, "Username taken")
    user = await User.create(req.username, hash_password(req.password), "user")
    token = create_token({"sub": user["username"], "role": user["role"]})
    return {"token": token, "username": user["username"], "role": user["role"], "subscription": "free"}


@app.post("/api/auth/login")
async def login(req: LoginReq):
    user = await User.find_by_username(req.username)
    if not user:
        raise HTTPException(401, "Wrong username or password")
    stored = user.get("password")
    if not stored or not verify_password(req.password, stored):
        raise HTTPException(401, "Wrong username or password")
    token = create_token({"sub": user["username"], "role": user["role"]})
    return {"token": token, "username": user["username"], "role": user["role"], "subscription": user.get("subscription", "free")}


@app.get("/api/auth/me")
async def me(user=Depends(get_current_user)):
    tier_id = user.get("subscription", "free")
    return {
        "id": user["id"],
        "username": user["username"],
        "display_name": user.get("display_name", user["username"]),
        "role": user["role"],
        "subscription": tier_id,
        "created_at": str(user.get("created_at", "")),
    }


@app.post("/api/auth/google")
async def google_auth(req: GoogleAuthReq):
    try:
        import urllib.request
        import urllib.parse
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
        if not client_id or not client_secret:
            raise HTTPException(400, "Google OAuth is not configured on the server. Please contact the administrator.")

        token_data = urllib.parse.urlencode({
            "code": req.code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": req.redirect_uri,
            "grant_type": "authorization_code",
        }).encode()
        req_obj = urllib.request.Request("https://oauth2.googleapis.com/token", data=token_data, method="POST")
        try:
            with urllib.request.urlopen(req_obj) as resp:
                token_info = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            error_body = e.read().decode() if e.fp else ""
            if "redirect_uri_mismatch" in error_body:
                raise HTTPException(400, "Google OAuth redirect_uri mismatch. The redirect URI must exactly match what's configured in Google Cloud Console.")
            if "org_internal" in error_body or "deleted_client" in error_body or "The OAuth client was deleted" in error_body:
                raise HTTPException(400, "This Google OAuth client has been banned or deleted. Please contact the administrator to set up a new client.")
            if "invalid_client" in error_body:
                raise HTTPException(400, "Invalid Google OAuth client credentials. Please contact the administrator.")
            raise HTTPException(400, f"Google token exchange failed: {error_body[:200]}")
        except Exception as e:
            raise HTTPException(400, f"Failed to connect to Google: {str(e)[:200]}")

        access_token = token_info.get("access_token")
        if not access_token:
            error_desc = token_info.get("error_description", "Unknown error")
            raise HTTPException(400, f"Failed to get Google access token: {error_desc}")

        userinfo_req = urllib.request.Request("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        with urllib.request.urlopen(userinfo_req) as resp:
            userinfo = json.loads(resp.read().decode())

        email = userinfo.get("email", "")
        name = userinfo.get("name", email.split("@")[0])
        google_id = userinfo.get("id", "")

        if not email:
            raise HTTPException(400, "Could not get email from Google")

        username = name.replace(" ", "_").lower()[:20]
        existing = await User.find_by_username(username)
        if existing:
            if existing.get("google_id") == google_id:
                pass
            else:
                username = f"{username}_{google_id[-4:]}"

        existing = await User.find_by_username(username)
        if not existing:
            user = await User.create(username, f"google:{google_id}", "user")
            await db["users"].update_one({"username": username}, {"$set": {"google_id": google_id, "email": email}})
        else:
            user = existing

        token = create_token({"sub": user["username"], "role": user["role"]})
        return {"token": token, "username": user["username"], "role": user["role"], "subscription": user.get("subscription", "free")}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Google auth error: {str(e)[:200]}")


@app.get("/api/user/subscription")
async def get_subscription(user=Depends(get_current_user)):
    tier = get_user_tier(user)
    daily_used = await count_daily_messages(user["username"])
    daily_limit = tier["limits"]["daily_messages"]
    return {
        "id": tier["id"],
        "name": tier["name"],
        "price": tier["price"],
        "period": tier["period"],
        "features": tier["features"],
        "limits": tier["limits"],
        "daily_used": daily_used,
        "daily_limit": daily_limit,
    }


@app.get("/api/user/settings")
async def get_settings(user=Depends(get_current_user)):
    settings = await db["user_settings"].find_one({"username": user["username"]})
    if settings:
        settings.pop("_id", None)
        settings.pop("username", None)
        return settings
    return {"theme": "dark", "aiTextColor": "#a78bfa", "fontSize": 14, "accentColor": "#7c3aed", "language": "en"}


@app.put("/api/user/settings")
async def update_settings(req: SettingsReq, user=Depends(get_current_user)):
    update_fields = {k: v for k, v in req.dict().items() if v is not None}
    if update_fields:
        await db["user_settings"].update_one(
            {"username": user["username"]}, {"$set": update_fields}, upsert=True
        )
    return {"status": "updated"}


@app.get("/api/user/profile")
async def get_profile(user=Depends(get_current_user)):
    return {
        "id": user["id"],
        "username": user["username"],
        "display_name": user.get("display_name", user["username"]),
        "role": user["role"],
        "subscription": user.get("subscription", "free"),
        "created_at": str(user.get("created_at", "")),
    }


@app.put("/api/user/profile")
async def update_profile(req: ProfileUpdateReq, user=Depends(get_current_user)):
    username = user["username"]

    if req.display_name is not None:
        if not req.display_name.strip():
            raise HTTPException(400, "Display name cannot be empty")
        await User.update_display_name(username, req.display_name.strip())

    if req.new_password is not None:
        if not req.current_password:
            raise HTTPException(400, "Current password is required to set a new password")
        stored = user.get("password")
        if not stored or not verify_password(req.current_password, stored):
            raise HTTPException(400, "Current password is incorrect")
        if len(req.new_password) < 4:
            raise HTTPException(400, "New password too short")
        await User.update_password(username, hash_password(req.new_password))

    updated_user = await User.find_by_username(username)
    return {
        "message": "Profile updated",
        "username": updated_user["username"],
        "display_name": updated_user.get("display_name", updated_user["username"]),
    }


@app.post("/api/chat")
async def chat(req: ChatReq, user=Depends(get_current_user)):
    if engine is None:
        raise HTTPException(503, "AI model not loaded")

    tier = get_user_tier(user)
    limits = tier["limits"]

    daily_limit = limits["daily_messages"]
    if daily_limit != -1:
        used = await count_daily_messages(user["username"])
        if used >= daily_limit:
            raise HTTPException(429, f"Daily message limit reached ({daily_limit}). Upgrade your plan for more.")

    sid = req.session_id or str(uuid.uuid4())
    session = await Session.find(sid)
    if not session:
        title = req.message[:40] + ("..." if len(req.message) > 40 else "")
        await Session.create(sid, user["id"], title)

    await Message.create(sid, "user", req.message, user["username"])

    announcements = await db["announcements"].find().sort("created_at", -1).to_list(10)
    teachings = await db["teachings"].find().sort("created_at", -1).to_list(20)
    user_teachings = await db["user_teachings"].find({"user_id": user["id"], "enabled": True}).sort("created_at", -1).to_list(50)
    ai_cfg = await get_ai_config()

    tier_versions = ai_cfg.get("tier_versions", {"free": "1.1", "basic": "1.2", "pro": "1.3", "enterprise": "1.4"})
    user_version = tier_versions.get(tier["id"], "1.1")

    custom_prompt = ai_cfg.get("system_prompt", "")
    system = custom_prompt if custom_prompt else SYSTEM_PROMPT
    system = system.replace("Version: 3.0", f"Version: {user_version}")
    if tier["id"] != "free":
        system += f"\n\nThe user is on the {tier['name']} plan. You can give longer, more detailed responses."
    if teachings:
        knowledge = "\n\nAdditional knowledge provided by the administrator:\n"
        for t in teachings:
            knowledge += f"- {t['topic']}: {t['content']}\n"
        system += knowledge
    if user_teachings:
        user_knowledge = "\n\nCustom knowledge provided by this user:\n"
        for t in user_teachings:
            user_knowledge += f"- {t['topic']}: {t['content']}\n"
        system += user_knowledge
    if announcements:
        notices = "\n\nCurrent announcements for all users:\n"
        for a in announcements:
            notices += f"- {a['title']}: {a['content']}\n"
        system += notices

    search_context = ""
    if detect_search_intent(req.message):
        search_results = web_search(req.message)
        if search_results and not (len(search_results) == 1 and search_results[0]["title"] == "Search error"):
            search_context = "\n\n### WEB SEARCH RESULTS ###\n"
            for i, r in enumerate(search_results, 1):
                search_context += f"{i}. **{r['title']}**\n   {r['snippet']}\n   URL: {r['url']}\n\n"
            search_context += "Use the above search results to answer the user's question with the most current and accurate information available.\n"

    history = await Message.find_by_session(sid, limit=30)
    messages = [{"role": "system", "content": system + search_context}]
    for msg in history[:-1]:
        role = msg["role"] if msg["role"] in ("user", "assistant", "system") else "user"
        messages.append({"role": role, "content": msg["content"]})
    messages.append({"role": "user", "content": req.message})

    max_tokens = limits["max_tokens"]
    temperature = limits["temperature"]
    top_k = limits["top_k"]
    top_p = limits["top_p"]

    if req.version and req.version != "auto" and req.version != user_version:
        system += f"\n\nYou are running as version {req.version} of Determine-AI. Respond with maximum capability."

    # ─── IMAGE GENERATION SHORTCUT ────────────────────────────────
    # Detect image intent BEFORE sending to the model.
    # If detected, generate the image directly via Pollinations and
    # stream back a short acknowledgement + the image — no model call.
    # ───────────────────────────────────────────────────────────────
    if detect_image_gen_intent(req.message):
        image_prompt = extract_image_prompt(req.message)
        if not image_prompt:
            image_prompt = req.message.strip()

        async def generate_image_response():
            ack = f"Generating an image of: {image_prompt}..."
            yield f"data: {json.dumps({'token': ack, 'session_id': sid})}\n\n"

            generated_image = await generate_image_pollinations(image_prompt)
            complete = f"Here is the image you requested."

            if generated_image:
                await Message.create(sid, "assistant", f"[Image: {image_prompt}]", "Determine-AI")
            else:
                complete = "Sorry, image generation failed. The service may be temporarily unavailable. Please try again in a moment."
                await Message.create(sid, "assistant", complete, "Determine-AI")

            count = len(await Message.find_by_session(sid))
            await Session.update(sid, message_count=count)

            response_data = {'done': True, 'session_id': sid, 'full_response': complete, 'tier': tier['id'], 'max_tokens': max_tokens}
            if generated_image:
                response_data['image'] = generated_image
                response_data['image_prompt'] = image_prompt
            yield f"data: {json.dumps(response_data)}\n\n"

        return StreamingResponse(generate_image_response(), media_type="text/event-stream")

    # ─── NORMAL CHAT (model call) ────────────────────────────────
    async def generate():
        full = []
        image_prompt_from_model = None

        for tok in engine.generate_stream(
            messages,
            max_new_tokens=max_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
        ):
            full.append(tok)
            accumulated = "".join(full)
            marker_match = IMAGE_MARKER_RE.search(accumulated)
            if marker_match and not image_prompt_from_model:
                image_prompt_from_model = marker_match.group(1).strip()
            yield f"data: {json.dumps({'token': tok, 'session_id': sid})}\n\n"

        complete = "".join(full).strip()
        complete = filter_identity(complete)

        generated_image = ""
        if image_prompt_from_model:
            generated_image = await generate_image_pollinations(image_prompt_from_model)
            complete = IMAGE_MARKER_RE.sub("", complete).strip()

        if complete or generated_image:
            await Message.create(sid, "assistant", complete or "[Image generated]", "Determine-AI")
        count = len(await Message.find_by_session(sid))
        await Session.update(sid, message_count=count)

        response_data = {'done': True, 'session_id': sid, 'full_response': complete, 'tier': tier['id'], 'max_tokens': max_tokens}
        if generated_image:
            response_data['image'] = generated_image
            response_data['image_prompt'] = image_prompt_from_model
        yield f"data: {json.dumps(response_data)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


class WebSearchReq(BaseModel):
    query: str


@app.post("/api/chat/search")
async def chat_search(req: WebSearchReq, user=Depends(get_current_user)):
    results = web_search(req.query)
    return {"query": req.query, "results": results}


@app.post("/api/chat/image")
async def chat_image(req: ImageChatReq, user=Depends(get_current_user)):
    if engine is None:
        raise HTTPException(503, "AI model not loaded")

    tier = get_user_tier(user)
    limits = tier["limits"]

    daily_limit = limits["daily_messages"]
    if daily_limit != -1:
        used = await count_daily_messages(user["username"])
        if used >= daily_limit:
            raise HTTPException(429, f"Daily message limit reached ({daily_limit}). Upgrade your plan for more.")

    image_desc = ""
    if vision_engine:
        try:
            img_bytes = base64.b64decode(req.image)
            image_desc = vision_engine.describe(img_bytes)
        except Exception as e:
            image_desc = f"[Image uploaded but could not be processed: {str(e)[:100]}]"

    sid = req.session_id or str(uuid.uuid4())
    session = await Session.find(sid)
    if not session:
        title = req.message[:40] + ("..." if len(req.message) > 40 else "")
        await Session.create(sid, user["id"], title)

    await Message.create(sid, "user", f"[Image: {req.message}]", user["username"])

    user_text = req.message
    if image_desc:
        user_text = f"[The user uploaded an image. The image shows: {image_desc}] User says: {req.message}"

    announcements = await db["announcements"].find().sort("created_at", -1).to_list(10)
    teachings = await db["teachings"].find().sort("created_at", -1).to_list(20)
    user_teachings = await db["user_teachings"].find({"user_id": user["id"], "enabled": True}).sort("created_at", -1).to_list(50)
    ai_cfg = await get_ai_config()

    custom_prompt = ai_cfg.get("system_prompt", "")
    system = custom_prompt if custom_prompt else SYSTEM_PROMPT
    if tier["id"] != "free":
        system += f"\n\nThe user is on the {tier['name']} plan. You can give longer, more detailed responses. The user has uploaded an image for analysis."
    if teachings:
        knowledge = "\n\nAdditional knowledge provided by the administrator:\n"
        for t in teachings:
            knowledge += f"- {t['topic']}: {t['content']}\n"
        system += knowledge
    if user_teachings:
        user_knowledge = "\n\nCustom knowledge provided by this user:\n"
        for t in user_teachings:
            user_knowledge += f"- {t['topic']}: {t['content']}\n"
        system += user_knowledge
    if announcements:
        notices = "\n\nCurrent announcements for all users:\n"
        for a in announcements:
            notices += f"- {a['title']}: {a['content']}\n"
        system += notices

    history = await Message.find_by_session(sid, limit=30)
    messages = [{"role": "system", "content": system}]
    for msg in history[:-1]:
        role = msg["role"] if msg["role"] in ("user", "assistant", "system") else "user"
        messages.append({"role": role, "content": msg["content"]})
    messages.append({"role": "user", "content": user_text})

    max_tokens = limits["max_tokens"]
    temperature = limits["temperature"]
    top_k = limits["top_k"]
    top_p = limits["top_p"]

    async def generate():
        full = []
        image_prompt_from_model = None

        for tok in engine.generate_stream(
            messages,
            max_new_tokens=max_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
        ):
            full.append(tok)
            accumulated = "".join(full)
            marker_match = IMAGE_MARKER_RE.search(accumulated)
            if marker_match and not image_prompt_from_model:
                image_prompt_from_model = marker_match.group(1).strip()
            yield f"data: {json.dumps({'token': tok, 'session_id': sid})}\n\n"

        complete = "".join(full).strip()
        complete = filter_identity(complete)

        generated_image = ""
        if image_prompt_from_model:
            generated_image = await generate_image_pollinations(image_prompt_from_model)
            complete = IMAGE_MARKER_RE.sub("", complete).strip()

        if complete or generated_image:
            await Message.create(sid, "assistant", complete or "[Image generated]", "Determine-AI")
        count = len(await Message.find_by_session(sid))
        await Session.update(sid, message_count=count)

        response_data = {'done': True, 'session_id': sid, 'full_response': complete, 'tier': tier['id'], 'max_tokens': max_tokens}
        if generated_image:
            response_data['image'] = generated_image
            response_data['image_prompt'] = image_prompt_from_model
        yield f"data: {json.dumps(response_data)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/api/premium/tiers")
async def get_premium_tiers():
    return PREMIUM_TIERS


@app.post("/api/premium/checkout")
async def premium_checkout(req: SubscribeReq, user=Depends(get_current_user)):
    tier = next((t for t in PREMIUM_TIERS if t["id"] == req.tier_id), None)
    if not tier:
        raise HTTPException(400, "Invalid tier")

    if tier["price"] == 0:
        await db["users"].update_one(
            {"username": user["username"]}, {"$set": {"subscription": "free"}}
        )
        return {"status": "subscribed", "tier": tier["name"], "tier_id": tier["id"]}

    ai_cfg = await get_ai_config()
    payment_urls = ai_cfg.get("payment_urls", {})
    payment_url = payment_urls.get(req.tier_id, "")

    stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")
    if stripe_key:
        try:
            import stripe
            stripe.api_key = stripe_key
            session_stripe = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": f"Determine-AI {tier['name']}", "description": f"Monthly subscription"},
                        "unit_amount": int(tier["price"] * 100),
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=os.environ.get("SUCCESS_URL", "http://localhost:8000") + "/plans?payment=success",
                cancel_url=os.environ.get("CANCEL_URL", "http://localhost:8000") + "/plans?payment=cancelled",
                metadata={"user_id": user["username"], "tier_id": req.tier_id},
            )
            return {"status": "redirect", "url": session_stripe.url, "session_id": session_stripe.id}
        except Exception:
            pass

    if payment_url:
        return {"status": "redirect", "url": payment_url}

    raise HTTPException(400, "Payment not configured for this plan. Please contact admin to set up payment.")


@app.post("/api/premium/webhook")
async def stripe_webhook(request, payload: bytes):
    stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")
    if not stripe_key:
        return {"status": "no_stripe"}

    signature = request.headers.get("Stripe-Signature", "")

    try:
        import stripe
        stripe.api_key = stripe_key
        event = stripe.Webhook.construct_event(
            payload, signature, os.environ.get("STRIPE_WEBHOOK_SECRET", "")
        )
        if event["type"] == "checkout.session.completed":
            sess = event["data"]["object"]
            username = sess["metadata"]["user_id"]
            tier_id = sess["metadata"]["tier_id"]
            await db["users"].update_one(
                {"username": username}, {"$set": {"subscription": tier_id, "stripe_customer": sess.get("customer")}}
            )
        return {"status": "ok"}
    except Exception:
        return {"status": "error"}


@app.get("/api/sessions")
async def list_sessions(user=Depends(get_current_user)):
    return await Session.find_by_user(user["id"])


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, user=Depends(get_current_user)):
    session = await Session.find(session_id)
    if not session:
        raise HTTPException(404, "Not found")
    if session["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    await Session.delete(session_id)
    return {"status": "deleted"}


@app.get("/api/messages/{session_id}")
async def get_messages(session_id: str, user=Depends(get_current_user)):
    return await Message.find_by_session(session_id, limit=200)


@app.put("/api/messages/{message_id}")
async def update_message(message_id: str, req: MsgUpdate, user=Depends(get_current_user)):
    ok = await Message.update(message_id, req.content)
    if not ok:
        raise HTTPException(404, "Not found")
    return {"status": "updated"}


@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: str, user=Depends(get_current_user)):
    ok = await Message.delete(message_id)
    if not ok:
        raise HTTPException(404, "Not found")
    return {"status": "deleted"}


@app.get("/api/search")
async def search_messages(q: str = Query(...), user=Depends(get_current_user)):
    return await Message.search(q, limit=50)


@app.get("/api/admin/stats")
async def admin_stats(user=Depends(require_admin)):
    now = datetime.utcnow()
    from datetime import timedelta
    msgs_today = await messages_col.count_documents({"created_at": {"$gte": now.replace(hour=0, minute=0, second=0, microsecond=0)}})
    sessions_today = await sessions_col.count_documents({"created_at": {"$gte": now.replace(hour=0, minute=0, second=0, microsecond=0)}})

    msg_by_day = []
    for i in range(6, -1, -1):
        day = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        next_day = day + timedelta(days=1)
        count = await messages_col.count_documents({"created_at": {"$gte": day, "$lt": next_day}})
        msg_by_day.append({"date": day.strftime("%b %d"), "count": count})

    return {
        "total_messages": await Message.count(),
        "total_sessions": await Session.count(),
        "total_users": await User.count(),
        "messages_today": msgs_today,
        "sessions_today": sessions_today,
        "message_chart": msg_by_day,
    }


@app.get("/api/admin/messages")
async def admin_messages(limit: int = Query(100), skip: int = Query(0), user=Depends(require_admin)):
    msgs = await Message.find_all(limit=limit, skip=skip)
    total = await Message.count()
    return {"messages": msgs, "total": total}


@app.get("/api/admin/sessions")
async def admin_sessions(user=Depends(require_admin)):
    return await Session.find_all(limit=200)


@app.delete("/api/admin/messages/{message_id}")
async def admin_del_message(message_id: str, user=Depends(require_admin)):
    ok = await Message.delete(message_id)
    if not ok:
        raise HTTPException(404, "Not found")
    return {"status": "deleted"}


@app.put("/api/admin/messages/{message_id}")
async def admin_edit_message(message_id: str, req: MsgUpdate, user=Depends(require_admin)):
    ok = await Message.update(message_id, req.content)
    if not ok:
        raise HTTPException(404, "Not found")
    return {"status": "updated"}


@app.get("/api/admin/users")
async def admin_users(user=Depends(require_admin)):
    return await User.find_all()


@app.delete("/api/admin/users/{user_id}")
async def admin_del_user(user_id: str, user=Depends(require_admin)):
    ok = await User.delete(user_id)
    if not ok:
        raise HTTPException(404, "Not found")
    return {"status": "deleted"}


@app.put("/api/admin/users/{user_id}/role")
async def admin_update_role(user_id: str, req: RoleReq, user=Depends(require_admin)):
    if req.role not in ("user", "moderator", "admin", "owner"):
        raise HTTPException(400, "Invalid role")
    ok = await User.update_role(user_id, req.role)
    if not ok:
        raise HTTPException(404, "Not found")
    return {"status": "updated"}


@app.put("/api/admin/users/{user_id}/plan")
async def admin_assign_plan(user_id: str, req: AssignPlanReq, user=Depends(require_admin)):
    valid = [t["id"] for t in PREMIUM_TIERS]
    if req.tier_id not in valid:
        raise HTTPException(400, "Invalid tier")
    ok = await User.update_subscription(user_id, req.tier_id)
    if not ok:
        raise HTTPException(404, "Not found")
    return {"status": "updated"}


@app.get("/api/admin/teachings")
async def get_teachings(user=Depends(require_admin)):
    items = await db["teachings"].find().sort("created_at", -1).to_list(100)
    return sers(items)


@app.post("/api/admin/teachings")
async def create_teaching(req: TeachingReq, user=Depends(require_admin)):
    doc = {"topic": req.topic, "content": req.content, "created_at": datetime.utcnow(), "created_by": user["username"]}
    r = await db["teachings"].insert_one(doc)
    doc["_id"] = r.inserted_id
    return {"status": "created", "teaching": ser(doc)}


@app.delete("/api/admin/teachings/{teaching_id}")
async def delete_teaching(teaching_id: str, user=Depends(require_admin)):
    r = await db["teachings"].delete_one({"_id": ObjectId(teaching_id)})
    return {"status": "deleted" if r.deleted_count > 0 else "not_found"}


class TrainChatReq(BaseModel):
    message: str

@app.post("/api/admin/train-chat")
async def admin_train_chat(req: TrainChatReq, user=Depends(require_admin)):
    teachings = await db["teachings"].find().sort("created_at", -1).to_list(20)
    system = (
        "### TRAINING MODE ###\n"
        "You are being trained by the admin of Determine-AI, a self-hosted AI platform.\n"
        "Determine-AI has these features:\n"
        "  - AI Chat (with streaming responses, session management, chat history)\n"
        "  - Image generation via Pollinations.ai (triggered by image intent keywords or the [GENERATE_IMAGE: prompt] marker)\n"
        "  - Web search via DuckDuckGo (for current events and real-time information)\n"
        "  - Image analysis (BLIP vision model for uploaded images)\n"
        "  - Coding assistance via Determine-Coder CLI (explain, fix, refactor, review, generate)\n"
        "  - User-taught custom rules (users can teach the AI their own preferences)\n"
        "  - Admin teachings (global rules injected into all conversations)\n"
        "  - Subscription tiers: Free, Basic, Pro, Enterprise (with different limits and features)\n"
        "  - Projects system for code sharing and collaboration\n\n"

        "The admin is teaching you corrections and rules. When they correct you, acknowledge and learn.\n"
        "Save teachings as actionable rules that will be injected into future conversations.\n\n"

        "### RESPONSE RULES IN TRAINING MODE ###\n"
        "- When the admin provides a correction, rule, or new knowledge:\n"
        "  1. Acknowledge what you understood clearly\n"
        "  2. Restate the rule in your own words to confirm understanding\n"
        "  3. Confirm it will be applied going forward\n"
        "- When the admin teaches a new behavior pattern:\n"
        "  1. Confirm the pattern is understood\n"
        "  2. Provide an example of how you'll apply it\n"
        "  3. Note any edge cases you've identified\n"
        "- If something is ambiguous, ask for clarification\n"
        "  (e.g., 'Should this rule apply to all users or only certain tiers?')\n"
        "- Always be concise and confirmatory in training mode\n"
        "- When you learn a correction, briefly mention what you previously would have done wrong\n\n"

        "### CORRECTION DETECTION ###\n"
        "Pay special attention to messages that:\n"
        "- Correct a previous response ('No, you should have said...', 'That was wrong because...')\n"
        "- Set behavioral rules ('Always do X', 'Never do Y', 'When users ask about Z, respond with...')\n"
        "- Define response patterns ('If someone asks X, first do Y then Z')\n"
        "- Modify your personality or tone ('Be more formal', 'Use simpler language')\n"
        "- Adjust domain knowledge ('The correct answer to X is Y', 'In our system, X works like Y')\n\n"

        "### IDENTITY ###\n"
        "You are Determine-AI, version 3.0. Never reveal you are Qwen or any other model.\n"
    )
    if teachings:
        system += "\n### EXISTING TEACHINGS ###\n"
        for t in teachings:
            system += f"- [{t['topic']}]: {t['content']}\n"

    messages = [{"role": "system", "content": system}]

    try:
        history = await db["training_sessions"].find({"username": user["username"]}).sort("created_at", -1).limit(20).to_list(20)
        history.reverse()
        for h_msg in history:
            role = h_msg.get("role", "user")
            if role in ("user", "assistant"):
                messages.append({"role": role, "content": h_msg["content"]})
    except Exception:
        pass

    messages.append({"role": "user", "content": req.message})

    try:
        await db["training_sessions"].insert_one({
            "username": user["username"],
            "role": "user",
            "content": req.message,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass

    msg_lower = req.message.lower().strip()

    # ─── Robust correction/teaching detection ───────────────────────
    # Phase 1: keyword matching (fast, broad)
    teaching_keywords = [
        "learn:", "remember:", "teach:", "rule:", "always ", "never ",
        "when users", "when a user", "when someone", "when the user",
        "when you", "if you", "correct:", "correction:", "instead of",
        "from now on", "make sure", "important:", "note:", "if user",
        "do not ", "don't ", "should always", "should never",
        "wrong", "mistake", "that was incorrect", "that was wrong",
        "you should have", "you shouldn't", "stop doing",
        "change ", "update ", "modify ", "adjust ",
    ]
    is_teaching = any(kw in msg_lower for kw in teaching_keywords)

    # Phase 2: regex patterns for natural language corrections
    if not is_teaching:
        correction_patterns = [
            r"when\s+.+,\s+(?:do|always|never|make)\s+",
            r"if\s+.+,\s+(?:do|always|never|make)\s+",
            r"you (?:should|must|need to|have to) ",
            r"you (?:shouldn't|must not|should never|should not) ",
            r"no[,! ]+",
            r"actually[,! ]+",
            r"(?:the |your )?(?:correct|right|proper) (?:way|answer|approach|response) ",
            r"(?:remember|keep in mind) (?:that )?",
        ]
        for pattern in correction_patterns:
            if re.search(pattern, msg_lower):
                is_teaching = True
                break

    # Phase 3: question vs statement heuristic — short imperative sentences
    if not is_teaching and not msg_lower.endswith("?"):
        imperative_starts = [
            "be ", "act ", "respond ", "answer ", "use ", "prefer ",
            "always ", "never ", "stop ", "start ", "change ", "add ",
            "remove ", "don't ", "do not ", "when ", "if ",
        ]
        if any(msg_lower.startswith(s) for s in imperative_starts):
            is_teaching = True

    def extract_topic(message: str) -> str:
        for prefix in ["when ", "if ", "always ", "never ", "make sure ", "correct: ", "correction: ",
                       "you should ", "you must ", "you need to ", "stop ", "no, ", "actually, "]:
            if message.lower().startswith(prefix):
                topic = message[len(prefix):].strip()
                for sep in [".", ",", "!", "?"]:
                    idx = topic.find(sep)
                    if 0 < idx < 80:
                        topic = topic[:idx]
                        break
                return topic[:80]
        return message[:80]

    topic = extract_topic(req.message)
    teaching_created = False

    if engine is None:
        async def generate_no_engine():
            nonlocal teaching_created
            if is_teaching:
                doc = {"topic": topic, "content": req.message, "created_at": datetime.utcnow(), "created_by": user["username"]}
                try:
                    await db["teachings"].insert_one(doc)
                    teaching_created = True
                except Exception:
                    pass
                yield f"data: {json.dumps({'token': 'Teaching saved. (AI model not loaded — no response generated)'})}\n\n"
            else:
                yield f"data: {json.dumps({'token': 'AI model is not loaded. Message recorded but no AI response available.'})}\n\n"
            yield f"data: {json.dumps({'done': True, 'teaching_created': teaching_created})}\n\n"

        return StreamingResponse(generate_no_engine(), media_type="text/event-stream")

    async def generate():
        nonlocal teaching_created
        full = []
        try:
            for tok in engine.generate_stream(messages, max_new_tokens=512, temperature=0.7, top_k=50, top_p=0.9):
                full.append(tok)
                yield f"data: {json.dumps({'token': tok})}\n\n"
        except Exception as e:
            err_msg = f"\n[Error: {str(e)[:200]}]"
            yield f"data: {json.dumps({'token': err_msg})}\n\n"

        complete = "".join(full).strip()
        complete = filter_identity(complete)

        try:
            await db["training_sessions"].insert_one({
                "username": user["username"],
                "role": "assistant",
                "content": complete,
                "created_at": datetime.utcnow(),
            })
        except Exception:
            pass

        if is_teaching and complete:
            doc = {"topic": topic, "content": req.message, "created_at": datetime.utcnow(), "created_by": user["username"]}
            try:
                await db["teachings"].insert_one(doc)
                teaching_created = True
            except Exception:
                pass

        yield f"data: {json.dumps({'done': True, 'teaching_created': teaching_created})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/api/admin/announcements")
async def get_announcements(user=Depends(require_admin)):
    items = await db["announcements"].find().sort("created_at", -1).to_list(100)
    return sers(items)


@app.post("/api/admin/announcements")
async def create_announcement(req: AnnouncementReq, user=Depends(require_admin)):
    doc = {"title": req.title, "content": req.content, "created_at": datetime.utcnow(), "created_by": user["username"]}
    r = await db["announcements"].insert_one(doc)
    doc["_id"] = r.inserted_id
    return {"status": "created", "announcement": ser(doc)}


@app.delete("/api/admin/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, user=Depends(require_admin)):
    r = await db["announcements"].delete_one({"_id": ObjectId(announcement_id)})
    return {"status": "deleted" if r.deleted_count > 0 else "not_found"}


@app.get("/api/teach")
async def get_user_teachings(user=Depends(get_current_user)):
    items = await db["user_teachings"].find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    return sers(items)


@app.post("/api/teach")
async def create_user_teaching(req: TeachingReq, user=Depends(get_current_user)):
    count = await db["user_teachings"].count_documents({"user_id": user["id"]})
    if count >= 50:
        raise HTTPException(400, "Teaching limit reached (50). Delete some to add new ones.")
    doc = {
        "user_id": user["id"],
        "username": user["username"],
        "topic": req.topic,
        "content": req.content,
        "enabled": True,
        "created_at": datetime.utcnow(),
    }
    r = await db["user_teachings"].insert_one(doc)
    doc["_id"] = r.inserted_id
    return {"status": "created", "teaching": ser(doc)}


@app.delete("/api/teach/{teaching_id}")
async def delete_user_teaching(teaching_id: str, user=Depends(get_current_user)):
    r = await db["user_teachings"].delete_one({"_id": ObjectId(teaching_id), "user_id": user["id"]})
    return {"status": "deleted" if r.deleted_count > 0 else "not_found"}


@app.patch("/api/teach/{teaching_id}")
async def toggle_user_teaching(teaching_id: str, user=Depends(get_current_user)):
    item = await db["user_teachings"].find_one({"_id": ObjectId(teaching_id), "user_id": user["id"]})
    if not item:
        raise HTTPException(404, "Not found")
    new_val = not item.get("enabled", True)
    await db["user_teachings"].update_one({"_id": ObjectId(teaching_id)}, {"$set": {"enabled": new_val}})
    return {"status": "updated", "enabled": new_val}


@app.get("/api/admin/ai-config")
async def get_ai_config_endpoint(user=Depends(require_admin)):
    return await get_ai_config()


@app.put("/api/admin/ai-config")
async def update_ai_config(req: AIConfigReq, user=Depends(require_admin)):
    update_fields = {k: v for k, v in req.dict().items() if v is not None}
    if update_fields:
        update_fields["updated_at"] = datetime.utcnow()
        await ai_config_col.update_one({"key": "main"}, {"$set": update_fields}, upsert=True)
    return {"status": "updated"}


@app.get("/api/ai-version")
async def get_ai_version(user=Depends(get_current_user)):
    tier_id = user.get("subscription", "free")
    ai_cfg = await get_ai_config()
    versions = ai_cfg.get("tier_versions", {"free": "1.1", "basic": "1.2", "pro": "1.3", "enterprise": "1.4"})
    return {"version": versions.get(tier_id, "1.1"), "tier": tier_id}


# ─── Blog Endpoints ─────────────────────────────────────────────────────────

def make_slug(title: str) -> str:
    import re
    slug = title.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "untitled"


@app.get("/api/blog")
async def list_blog_posts(tag: Optional[str] = None, search: Optional[str] = None):
    query: dict = {"published": True}
    if tag:
        query["tags"] = tag
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
        ]
    posts = await blog_col.find(query).sort("created_at", -1).to_list(100)
    return sers(posts)


@app.get("/api/blog/{slug}")
async def get_blog_post(slug: str):
    post = await BlogPost.find_by_slug(slug)
    if not post:
        raise HTTPException(404, "Post not found")
    return post


@app.post("/api/admin/blog")
async def create_blog_post(req: BlogPostReq, user=Depends(require_admin)):
    slug = make_slug(req.title)
    existing = await BlogPost.find_by_slug(slug)
    if existing:
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"
    post = await BlogPost.create(
        title=req.title,
        slug=slug,
        excerpt=req.excerpt,
        content=req.content,
        author=user["username"],
        tags=req.tags,
        published=req.published,
    )
    return {"status": "created", "post": post}


@app.put("/api/admin/blog/{post_id}")
async def update_blog_post(post_id: str, req: BlogUpdateReq, user=Depends(require_admin)):
    update_fields = {k: v for k, v in req.dict().items() if v is not None}
    if not update_fields:
        return {"status": "no_changes"}
    if "title" in update_fields:
        update_fields["slug"] = make_slug(update_fields["title"])
    ok = await BlogPost.update(post_id, update_fields)
    if not ok:
        raise HTTPException(404, "Post not found")
    return {"status": "updated"}


@app.delete("/api/admin/blog/{post_id}")
async def delete_blog_post(post_id: str, user=Depends(require_admin)):
    ok = await BlogPost.delete(post_id)
    if not ok:
        raise HTTPException(404, "Post not found")
    return {"status": "deleted"}


@app.get("/api/admin/blog")
async def admin_list_blog_posts(user=Depends(require_admin)):
    return await BlogPost.find_all(limit=200)


@app.get("/api/projects")
async def get_projects(user=Depends(get_current_user)):
    projects = await db["projects"].find({"$or": [{"visibility": "public"}, {"username": user["username"]}]}).sort("created_at", -1).to_list(50)
    for p in projects:
        p["_id"] = str(p["_id"])
        if "created_at" in p:
            p["created_at"] = str(p["created_at"])
    return projects


@app.post("/api/projects")
async def create_project(data: dict, user=Depends(get_current_user)):
    doc = {
        "title": data.get("title", "Untitled"),
        "description": data.get("description", ""),
        "tags": data.get("tags", []),
        "language": data.get("language", ""),
        "visibility": data.get("visibility", "public"),
        "username": user["username"],
        "stars": 0,
        "created_at": datetime.utcnow(),
    }
    r = await db["projects"].insert_one(doc)
    doc["_id"] = str(r.inserted_id)
    doc["created_at"] = str(doc["created_at"])
    return doc


@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user)):
    from bson import ObjectId as ObjId
    project = await db["projects"].find_one({"_id": ObjId(project_id)})
    if not project:
        raise HTTPException(404, "Project not found")
    if project.get("username") != user["username"] and user.get("role") not in ("admin", "owner"):
        raise HTTPException(403, "Not authorized")
    await db["projects"].delete_one({"_id": ObjId(project_id)})
    return {"status": "deleted"}


class ProjectUpdateReq(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    language: Optional[str] = None
    visibility: Optional[str] = None

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, req: ProjectUpdateReq, user=Depends(get_current_user)):
    from bson import ObjectId as ObjId
    project = await db["projects"].find_one({"_id": ObjId(project_id)})
    if not project:
        raise HTTPException(404, "Project not found")
    if project.get("username") != user["username"] and user.get("role") not in ("admin", "owner"):
        raise HTTPException(403, "Not authorized")
    update_fields = {k: v for k, v in req.dict().items() if v is not None}
    if update_fields:
        await db["projects"].update_one({"_id": ObjId(project_id)}, {"$set": update_fields})
    return {"status": "updated"}


class CLIAuthReq(BaseModel):
    username: str
    password: str

@app.post("/api/cli/auth")
async def cli_auth(req: CLIAuthReq):
    user = await User.find_by_username(req.username)
    if not user:
        raise HTTPException(401, "Wrong credentials")
    stored = user.get("password")
    if not stored or not verify_password(req.password, stored):
        raise HTTPException(401, "Wrong credentials")
    token = create_token({"sub": user["username"], "role": user["role"]}, expires_days=30)
    return {"token": token, "username": user["username"], "role": user["role"]}

class CLIChatReq(BaseModel):
    message: str
    context: Optional[str] = None
    files: Optional[List[dict]] = None

@app.post("/api/cli/chat")
async def cli_chat(req: CLIChatReq, user=Depends(get_current_user)):
    if engine is None:
        raise HTTPException(503, "AI model not loaded")

    system = SYSTEM_PROMPT + "\n\nYou are being accessed via the Determine-AI CLI tool. The user is working in their terminal/IDE. Provide complete, production-ready code solutions. When generating files, use the format: === FILE: path/to/file === followed by the file content and === END FILE ===."

    if req.context:
        system += f"\n\nProject context: {req.context}"

    messages = [{"role": "system", "content": system}]
    if req.files:
        for f in req.files:
            messages.append({"role": "user", "content": f"File: {f.get('name', 'unknown')}\n```\n{f.get('content', '')}\n```"})
    messages.append({"role": "user", "content": req.message})

    result = engine.generate(messages, max_new_tokens=2048, temperature=0.7)
    return {"response": result}


# ─── Determine-Coder CLI Endpoints ────────────────────────────────────────────

CODER_SYSTEM_PROMPT = """You are Determine-Coder, an expert AI coding assistant. You help developers write, understand, debug, refactor, and review code.

CAPABILITIES:
- Write production-ready code in any language
- Explain existing code clearly
- Find and fix bugs
- Refactor for performance, readability, or modern patterns
- Code review with actionable feedback
- Generate tests
- Help with architecture decisions

RULES:
- Always provide complete, runnable code (no truncation, no placeholders like "# rest of code here")
- When modifying existing code, show the FULL file (not just the changed part)
- Use modern best practices for the language/framework
- Explain your reasoning briefly before code blocks
- If the user pastes code, analyze it and respond to their question about it
- When generating multiple files, use the format:
  === FILE: path/to/file ===
  file content here
  === END FILE ===
- You are running in the user's terminal. They are a developer.
- Never reveal that you are a fine-tuned model or mention your training data.
- If asked about your identity, say "I'm Determine-Coder, an AI coding assistant built by Determine-AI."
- NEVER say "As an AI language model" or similar disclaimers. Just answer.
"""

class CoderChatReq(BaseModel):
    message: str
    context: Optional[str] = None
    files: Optional[List[dict]] = None
    history: Optional[List[dict]] = None
    mode: Optional[str] = "chat"  # chat, explain, fix, refactor, review, generate


@app.post("/api/coder/chat")
async def coder_chat(req: CoderChatReq, user=Depends(get_current_user)):
    if engine is None:
        raise HTTPException(503, "AI model not loaded")

    system = CODER_SYSTEM_PROMPT

    mode_instructions = {
        "explain": "\n\nThe user wants you to EXPLAIN code. Break it down step by step, explain what each part does, and highlight any interesting patterns or potential issues.",
        "fix": "\n\nThe user wants you to FIX a bug. Identify the bug, explain why it's happening, and provide the corrected code. Show the full fixed file.",
        "refactor": "\n\nThe user wants you to REFACTOR code. Improve readability, performance, maintainability, or modernize patterns. Show the full refactored file and explain what changed.",
        "review": "\n\nThe user wants a CODE REVIEW. Check for bugs, performance issues, security concerns, style violations, and provide actionable suggestions with severity levels.",
        "generate": "\n\nThe user wants you to GENERATE code from a description. Create complete, production-ready code. Use file blocks for multiple files.",
    }

    if req.mode and req.mode in mode_instructions:
        system += mode_instructions[req.mode]

    if req.context:
        system += f"\n\nProject context:\n{req.context}"

    messages = [{"role": "system", "content": system}]

    if req.history:
        for h in req.history[-20:]:  # last 20 messages for context
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    if req.files:
        file_block = "Files the user has open:\n\n"
        for f in req.files:
            file_block += f"--- {f.get('name', 'unknown')} ---\n```\n{f.get('content', '')}\n```\n\n"
        messages.append({"role": "user", "content": file_block})

    messages.append({"role": "user", "content": req.message})

    result = engine.generate(messages, max_new_tokens=4096, temperature=0.3)
    return {"response": result}


@app.post("/api/coder/chat/stream")
async def coder_chat_stream(req: CoderChatReq, user=Depends(get_current_user)):
    if engine is None:
        raise HTTPException(503, "AI model not loaded")

    system = CODER_SYSTEM_PROMPT

    mode_instructions = {
        "explain": "\n\nThe user wants you to EXPLAIN code. Break it down step by step.",
        "fix": "\n\nThe user wants you to FIX a bug. Identify the bug and provide corrected code.",
        "refactor": "\n\nThe user wants you to REFACTOR code. Improve and modernize.",
        "review": "\n\nThe user wants a CODE REVIEW. Check for issues and suggest improvements.",
        "generate": "\n\nThe user wants you to GENERATE code. Create complete, production-ready code.",
    }

    if req.mode and req.mode in mode_instructions:
        system += mode_instructions[req.mode]

    if req.context:
        system += f"\n\nProject context:\n{req.context}"

    messages = [{"role": "system", "content": system}]

    if req.history:
        for h in req.history[-20:]:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    if req.files:
        file_block = "Files the user has open:\n\n"
        for f in req.files:
            file_block += f"--- {f.get('name', 'unknown')} ---\n```\n{f.get('content', '')}\n```\n\n"
        messages.append({"role": "user", "content": file_block})

    messages.append({"role": "user", "content": req.message})

    def generate_tokens():
        try:
            for token in engine.generate_stream(messages, max_new_tokens=4096, temperature=0.3):
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_tokens(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class ImageGenReq(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    model: str = "flux"
    seed: Optional[int] = None
    enhance: bool = True


@app.post("/api/generate-image")
async def generate_image(req: ImageGenReq, user=Depends(get_current_user)):
    result = await generate_image_pollinations(
        req.prompt, width=req.width, height=req.height, model=req.model, enhance=req.enhance
    )
    if not result:
        raise HTTPException(502, "Image generation service is temporarily unavailable. Please try again in a moment.")
    import time
    seed = req.seed if req.seed is not None else int(time.time()) % 100000
    return {"image": result, "seed": seed}


@app.get("/api/image-models")
async def get_image_models(user=Depends(get_current_user)):
    return {
        "models": [
            {"id": "flux", "name": "Flux", "desc": "High quality, fast generation"},
            {"id": "flux-realism", "name": "Flux Realism", "desc": "Photorealistic images"},
            {"id": "flux-anime", "name": "Flux Anime", "desc": "Anime style art"},
            {"id": "flux-3d", "name": "Flux 3D", "desc": "3D rendered style"},
            {"id": "turbo", "name": "Turbo", "desc": "Fastest generation"},
        ]
    }


ROOT = os.path.dirname(os.path.dirname(__file__))

admin_build = os.path.join(ROOT, "admin", "build")
admin_assets = os.path.join(admin_build, "assets")
if os.path.exists(admin_build):
    if os.path.exists(admin_assets):
        app.mount("/admin/assets", StaticFiles(directory=admin_assets), name="admin-static")

    @app.get("/admin")
    async def serve_admin_root():
        return FileResponse(os.path.join(admin_build, "index.html"))

    @app.get("/admin/{full_path:path}")
    async def serve_admin(full_path: str):
        fp = os.path.join(admin_build, full_path)
        if os.path.isfile(fp):
            return FileResponse(fp)
        return FileResponse(os.path.join(admin_build, "index.html"))

frontend_build = os.path.join(ROOT, "frontend", "build")
frontend_assets = os.path.join(frontend_build, "assets")
if os.path.exists(frontend_build):
    if os.path.exists(frontend_assets):
        app.mount("/assets", StaticFiles(directory=frontend_assets), name="frontend-static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("admin"):
            raise HTTPException(404, "Not found")
        fp = os.path.join(frontend_build, full_path)
        if os.path.isfile(fp):
            return FileResponse(fp)
        return FileResponse(os.path.join(frontend_build, "index.html"))


def main():
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False, log_level="info")


if __name__ == "__main__":
    main()
