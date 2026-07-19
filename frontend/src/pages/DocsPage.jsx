import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

const DOCS_DATA = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    ),
    sections: [
      {
        id: 'introduction',
        title: 'Introduction to Determine-AI',
        content: `Determine-AI is a fully self-hosted, privacy-first AI assistant platform. It provides a powerful AI chat interface, image generation, web search integration, and a CLI coding tool — all running on your own infrastructure.

Every byte of data stays on your server. No external API calls are made for core functionality. No telemetry, no tracking, no data leakage. You have complete ownership and control over your AI stack.

**Key Capabilities:**
- Natural language AI chat with streaming responses
- Image generation via Pollinations.ai integration
- Web search for up-to-date information
- Image analysis using BLIP vision model
- Multi-language support (English, Russian, Uzbek)
- CLI coding assistant (Determine-Coder)
- Admin dashboard for full system management
- JWT-based authentication with Google OAuth
- Subscription tiers with Stripe integration

**Architecture:**
Determine-AI is built with a modern stack: FastAPI (Python) for the backend, React + Vite for the frontend, MongoDB for data storage, and a custom inference engine for AI processing. The system is designed to be modular, extensible, and easy to deploy.`,
      },
      {
        id: 'system-requirements',
        title: 'System Requirements',
        content: `Before installing Determine-AI, ensure your system meets these requirements:

**Minimum Requirements:**
- **OS:** Windows 10+, macOS 11+, or Linux (Ubuntu 20.04+, Debian 11+)
- **Python:** 3.8 or higher
- **RAM:** 4GB minimum (8GB recommended)
- **CPU:** Modern multi-core processor (4+ cores recommended)
- **Storage:** 5GB free disk space (for model files and database)
- **Node.js:** 18+ (for frontend build and CLI tool)

**Recommended for Production:**
- **RAM:** 16GB+ for comfortable operation
- **GPU:** NVIDIA GPU with CUDA support for faster inference (optional but significantly improves performance)
- **CPU:** 8+ cores for handling concurrent users
- **Storage:** 20GB+ SSD for optimal database performance
- **Network:** Stable internet connection for Pollinations.ai image generation and web search features

**Software Dependencies:**
- MongoDB 5.0+ (or MongoDB Atlas cloud instance)
- pip (Python package manager)
- npm or yarn (for frontend)
- Git (for cloning the repository)

**Optional:**
- NVIDIA CUDA toolkit (for GPU acceleration)
- Docker and Docker Compose (for containerized deployment)
- Nginx or Caddy (for reverse proxy in production)
- Stripe account (for payment processing)`,
      },
      {
        id: 'installation',
        title: 'Installation Guide',
        content: `Follow these steps to install and run Determine-AI on your system:

**Step 1: Clone the Repository**
\`\`\`bash
git clone https://github.com/your-org/determine-ai.git
cd determine-ai
\`\`\`

**Step 2: Install Python Dependencies**
\`\`\`bash
pip install -r requirements.txt
\`\`\`

**Step 3: Configure Environment Variables**
Copy the example environment file and edit it with your settings:
\`\`\`bash
cp .env.example .env
\`\`\`
Edit \`.env\` with your MongoDB URI, secret key, and other settings. See the Configuration section below for details.

**Step 4: Install Frontend Dependencies**
\`\`\`bash
cd frontend
npm install
cd ..
\`\`\`

**Step 5: Build the Frontend**
\`\`\`bash
cd frontend
npm run build
cd ..
\`\`\`

**Step 6: Start the Server**
\`\`\`bash
python run.py
\`\`\`

The server will start on port 8000 by default. Open http://localhost:8000 in your browser.

**Default Admin Credentials:**
- Username: \`admin\`
- Password: \`admin123\`

**Important:** Change the admin password immediately after first login via the admin panel.`,
      },
      {
        id: 'quick-start',
        title: 'Quick Start',
        content: `After installation, here is how to get up and running quickly:

**1. Create Your Account**
Navigate to http://localhost:8000/register and create a new user account. Alternatively, use the default admin account (admin/admin123).

**2. Start a Chat**
Once logged in, you will see the chat interface. Type a message and press Enter or click the send button. The AI will respond with streaming text.

**3. Try Image Generation**
Type a message like "generate an image of a sunset over mountains" and the system will automatically detect the image generation intent and create an image using Pollinations.ai.

**4. Try Web Search**
Ask a question that requires current information, like "What's happening in AI news today?" The system will search the web and incorporate results into the AI response.

**5. Upload an Image**
Click the image upload button in the chat input area, select an image file, and ask a question about it. The AI will analyze the image using the BLIP vision model and respond.

**6. Install the CLI Tool**
\`\`\`bash
npm install -g determine-coder
dc login --server http://localhost:8000
dc chat
\`\`\`

**7. Explore the Admin Panel**
Navigate to http://localhost:8000/admin to access the admin dashboard where you can manage users, view statistics, configure the AI, and more.

**8. Set Up Subscription Tiers**
Configure Stripe integration in the admin panel to enable premium subscription plans for your users.`,
      },
      {
        id: 'configuration',
        title: 'Configuration (.env file)',
        content: `Determine-AI is configured through the \`.env\` file in the project root. Here is a complete reference of all environment variables:

**Database Configuration:**
\`\`\`
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/determine-ai?retryWrites=true&w=majority
DB_NAME=determine_ai
\`\`\`

**AI Model:**
\`\`\`
MODEL_NAME=Qwen/Qwen2.5-0.5B-Instruct
\`\`\`
The default model is \`Qwen/Qwen2.5-0.5B-Instruct\`. You can change this to any Hugging Face model compatible with the transformers library.

**Security:**
\`\`\`
SECRET_KEY=your-super-secret-key-change-this-in-production
\`\`\`
Used for JWT token signing. Generate a strong random string for production.

**Server:**
\`\`\`
PORT=8000
\`\`\`

**Google OAuth (Optional):**
\`\`\`
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
\`\`\`
Set up a Google Cloud project and OAuth 2.0 credentials to enable Google sign-in.

**Payment (Optional):**
\`\`\`
PAYMENT_URL=https://buy.stripe.com/your_payment_link_here
SUCCESS_URL=http://localhost:5173
CANCEL_URL=http://localhost:5173
\`\`\`
Configure Stripe payment links or Stripe API keys for subscription management.

**CORS:**
The backend allows all origins by default (\`*\`). For production, configure the allowed origins in \`backend/main.py\`.

**Frontend Environment (.env in frontend/):**
\`\`\`
VITE_GOOGLE_CLIENT_ID=your-google-client-id
\`\`\`
This must match the GOOGLE_CLIENT_ID in the root .env file for Google OAuth to work.`,
      },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    ),
    sections: [
      {
        id: 'ai-chat',
        title: 'AI Chat',
        content: `The AI chat is the core feature of Determine-AI. It provides natural language conversations with streaming responses.

**How to Use:**
1. Navigate to /chat after logging in
2. Type your message in the input area at the bottom
3. Press Enter or click the send button
4. Watch the response stream in real-time

**Tips for Better Results:**
- Be specific in your questions for more accurate answers
- Use markdown formatting in your questions for clarity
- Start a new chat session for unrelated topics (click "New Chat" in the sidebar)
- The AI remembers context within a session — reference previous messages naturally
- For coding questions, mention the programming language and framework you're using
- Ask follow-up questions to dive deeper into topics

**Features:**
- Streaming responses (text appears token by token)
- Conversation history persists across sessions
- Code blocks with syntax highlighting
- Image upload and analysis (drag & drop or click the image button)
- Background customization (set a custom chat background)
- Theme support (dark and light modes)
- Font size and color customization in Settings

**AI Version Selector:**
The version selector in the chat input allows you to choose between different AI versions. Higher tiers unlock more capable versions. "Auto" selects the version matching your subscription tier.

**Image Generation in Chat:**
Simply type a request like "generate an image of a cyberpunk city" and the AI will automatically detect the intent and generate an image. You can also use natural language like "draw me a picture of..." or "show me an image of..."

**Web Search in Chat:**
The AI automatically detects when your question benefits from current information and performs a web search via DuckDuckGo. Keywords like "latest", "news", "what's happening today" trigger web search.`,
      },
      {
        id: 'image-generation',
        title: 'Image Generation',
        content: `Determine-AI integrates with Pollinations.ai for AI-powered image generation directly from chat or the dedicated image generation page.

**How It Works:**
When you ask the AI to generate an image, the system:
1. Detects the image generation intent from your message
2. Extracts and enhances the prompt
3. Sends the request to Pollinations.ai
4. Streams the generated image back in the chat

**Supported Models:**
- **Flux** — High-quality, versatile model (default)
- **Realism** — Photorealistic outputs
- **Anime** — Anime and manga style
- **3D** — 3D rendered style

**Image Sizes:**
- 1024x1024 (default, square)
- 1280x720 (landscape)
- 720x1280 (portrait)
- 1920x1080 (widescreen)
- 1080x1920 (tall)

**Prompt Tips:**
- Be descriptive: "A serene mountain landscape at golden hour with mist in the valley"
- Include style keywords: "photorealistic", "digital art", "watercolor", "oil painting"
- Mention lighting: "dramatic lighting", "soft sunset light", "neon glow"
- Add quality tags: "masterpiece", "best quality", "highly detailed"

**Dedicated Image Generation Page:**
Navigate to /generate to access the full image generation interface with:
- Model selection
- Size presets
- Prompt presets for common styles
- Generation history
- Download and share options

**Note:** Image generation requires an internet connection as it uses the Pollinations.ai API. No API key is required.`,
      },
      {
        id: 'web-search',
        title: 'Web Search Integration',
        content: `Determine-AI includes built-in web search integration using DuckDuckGo, allowing the AI to provide up-to-date information.

**How It Works:**
When your message contains keywords that suggest you need current information, the system automatically:
1. Detects the search intent
2. Performs a web search via DuckDuckGo
3. Incorporates the search results into the AI's context
4. Generates a response that combines AI knowledge with fresh web data

**Trigger Keywords:**
The search is triggered by keywords and phrases like:
- "search", "look up", "find online"
- "what's happening", "latest", "current"
- "news", "recent", "trending"
- "today", "this week", "this month"
- "breaking", "updates", "what's new"

**Examples:**
- "What's happening in AI news today?"
- "Search for the latest React.js updates"
- "What are the current best practices for Docker deployment?"
- "Find online information about Python 3.12 features"

**Privacy Note:**
Web search is the only feature that makes external network requests (to DuckDuckGo). All other AI processing happens entirely on your server. If you need complete network isolation, you can disable web search by removing the search keywords from the backend code.`,
      },
      {
        id: 'multi-language',
        title: 'Multi-language Support',
        content: `Determine-AI supports multiple languages for both the user interface and AI responses.

**Supported Languages:**
- **English (EN)** — Default language
- **Russian (RU)** — Full translation
- **Uzbek (UZ)** — Full translation

**Interface Translation:**
The entire web interface — including navigation, buttons, settings, error messages, and the admin panel — is translated into all supported languages.

**How to Change Language:**
1. On the landing page, use the language selector in the navigation bar (EN / RU / UZ)
2. In the chat app, go to Settings and change the Language option
3. Your preference is saved locally and persists across sessions

**AI Response Language:**
The AI responds in the same language you write in. If you write in Russian, the AI will respond in Russian. If you write in English, it responds in English.

**Adding New Languages:**
The translation system is built with a simple key-value structure in \`frontend/src/i18n.js\`. To add a new language:
1. Add a new language object to the \`translations\` object
2. Translate all the keys
3. Add the language option to the language selector components

The i18n architecture makes it straightforward to add support for any new language.`,
      },
      {
        id: 'streaming-responses',
        title: 'Streaming Responses',
        content: `Determine-AI uses Server-Sent Events (SSE) for real-time streaming of AI responses.

**How Streaming Works:**
1. When you send a message, the backend begins generating a response
2. Tokens are sent to the frontend one at a time via SSE
3. The frontend appends each token to the displayed message in real-time
4. A blinking cursor animation indicates the response is still being generated
5. When complete, a final "done" signal is sent with metadata

**Benefits:**
- You see responses appearing immediately, not after full generation
- Lower perceived latency — the first token arrives within milliseconds
- Better user experience for long responses
- The full response is saved to the database after generation completes

**Technical Details:**
- Uses \`text/event-stream\` content type
- Each event is a JSON object with a \`token\` field
- The final event includes \`done: true\`, \`session_id\`, and \`full_response\`
- Connection is automatically handled by the browser's fetch API
- Works on both the web interface and the CLI tool

**Error Handling:**
If the streaming connection is interrupted:
- The frontend will display the partial response received
- An error message will be shown if no tokens were received
- The session and any received tokens are preserved
- You can retry by sending a new message`,
      },
      {
        id: 'session-management',
        title: 'Session Management',
        content: `Determine-AI organizes conversations into sessions, each with its own history and context.

**Creating Sessions:**
- **Automatic:** A new session is created automatically when you send your first message
- **Manual:** Click "New Chat" in the sidebar to start a fresh session
- **URL-based:** Each session has a unique URL (/chat/:session_id) that you can share or bookmark

**Session Features:**
- Each session maintains its own conversation history
- Session titles are auto-generated from the first message (truncated to 40 characters)
- Sessions are stored in MongoDB and persist across server restarts
- Up to 30 previous messages are included as context for each new AI response

**Managing Sessions:**
- **View:** All sessions appear in the left sidebar
- **Switch:** Click any session in the sidebar to load it
- **Delete:** Hover over a session and click the X button to delete it
- **Search:** Use the search bar to find messages across all sessions

**Session Limits:**
- Messages are stored per session with no hard limit
- The AI context window includes the last 30 messages
- Sessions are tied to user accounts — each user has their own sessions
- Admin users can view and manage all sessions

**Data Storage:**
- Sessions are stored in MongoDB (\`sessions\` collection)
- Messages are stored in the \`messages\` collection
- Each message includes: role (user/assistant), content, username, and timestamp
- Session metadata includes: user_id, title, message_count, created_at`,
      },
    ],
  },
  {
    id: 'determine-coder',
    title: 'Determine-Coder CLI',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
    ),
    sections: [
      {
        id: 'coder-installation',
        title: 'Installation',
        content: `Determine-Coder (dc) is a command-line AI coding assistant powered by Determine-AI.

**Install globally via npm:**
\`\`\`bash
npm install -g determine-coder
\`\`\`

**Verify installation:**
\`\`\`bash
dc --version
\`\`\`

**Requirements:**
- Node.js 18 or higher
- npm (comes with Node.js)
- A running Determine-AI server instance

**Platform Support:**
- Windows (Command Prompt, PowerShell, WSL)
- macOS (Terminal, iTerm2)
- Linux (Bash, Zsh, Fish)

After installation, the \`dc\` command is available system-wide.`,
      },
      {
        id: 'coder-login',
        title: 'Login & Configuration',
        content: `Before using Determine-Coder, connect it to your Determine-AI server.

**Login:**
\`\`\`bash
dc login --server http://your-server:8000
\`\`\`

You will be prompted for your username and password. On success, credentials are stored locally in your home directory.

**View Configuration:**
\`\`\`bash
dc config
\`\`\`

**Set Server URL:**
\`\`\`bash
dc config --server http://your-server:8000
\`\`\`

**Check Server Status:**
\`\`\`bash
dc status
\`\`\`

**Configuration Storage:**
Configuration is stored at \`~/.determine-coder/config.json\` and includes:
- Server URL
- Authentication token
- Default model preferences
- Output format settings

**Logout:**
\`\`\`bash
dc logout
\`\`\`
This clears stored credentials and configuration.`,
      },
      {
        id: 'coder-interactive',
        title: 'Interactive Mode',
        content: `Start an interactive coding chat session:

\`\`\`bash
dc chat
\`\`\`

This opens a REPL-style interface where you can have a continuous conversation with the AI about your code.

**Session Commands (type in interactive mode):**

| Command | Description |
|---------|-------------|
| \`/explain\` | Switch to explain mode |
| \`/fix\` | Switch to fix mode |
| \`/refactor\` | Switch to refactor mode |
| \`/review\` | Switch to review mode |
| \`/generate\` | Switch to generate mode |
| \`/chat\` | Switch back to normal chat mode |
| \`/clear\` | Clear conversation history |
| \`/history\` | Show recent conversation history |
| \`/exit\` | Quit the interactive session |

**Interactive Mode Tips:**
- Use Tab for auto-completion of commands
- Press Up/Down arrows to navigate command history
- Multi-line input is supported — end with a blank line to submit
- The AI maintains context across messages within a session
- Use \`/clear\` to reset context when switching topics`,
      },
      {
        id: 'coder-commands',
        title: 'Commands Reference',
        content: `Determine-Coder provides several specialized commands:

**dc chat [message]**
Interactive chat or single message mode:
\`\`\`bash
dc chat                    # Start interactive session
dc chat "explain closures" # Single message
\`\`\`

**dc ask "question"**
Quick one-off question without session context:
\`\`\`bash
dc ask "What is the difference between let and const in JavaScript?"
dc ask "How do I center a div in CSS?"
\`\`\`

**dc explain <file>**
Explain what a code file does:
\`\`\`bash
dc explain src/app.js
dc explain ./utils/helpers.py
\`\`\`

**dc fix <file>**
Fix bugs and errors in a file:
\`\`\`bash
dc fix src/components/App.tsx
dc fix -d "TypeError: cannot read property 'map'" src/data.js
\`\`\`

**dc refactor <file>**
Refactor code for better quality:
\`\`\`bash
dc refactor src/utils.js
dc refactor -t performance src/api/handler.go
dc refactor -t readability src/legacy/old_code.py
\`\`\`

**dc review <file>**
Perform a code review:
\`\`\`bash
dc review src/auth/middleware.js
dc review --detailed src/core/engine.rs
\`\`\`

**dc generate "description"**
Generate code from a natural language description:
\`\`\`bash
dc generate "REST API for user authentication with JWT"
dc generate "React component for a data table with sorting"
dc generate "Python script to parse CSV and generate charts"
\`\`\`

**Options:**
- \`-d, --detail\` — Provide additional context or error details
- \`-t, --type\` — Specify refactoring type (performance, readability, security)
- \`--detailed\` — Enable verbose output mode
- \`-o, --output\` — Write output to a file instead of stdout`,
      },
      {
        id: 'coder-file-context',
        title: 'File Context & Project Detection',
        content: `Determine-Coder automatically detects your project type and sends relevant context to the AI.

**Auto-Detection:**
The CLI reads project configuration files to understand your stack:
- \`package.json\` — Node.js/JavaScript projects
- \`requirements.txt\` / \`pyproject.toml\` — Python projects
- \`Cargo.toml\` — Rust projects
- \`go.mod\` — Go projects
- \`pom.xml\` / \`build.gradle\` — Java projects
- \`Gemfile\` — Ruby projects

**What Gets Sent:**
- Project type and language
- Dependencies and their versions
- Directory structure (top 2 levels)
- File being analyzed (for explain, fix, refactor, review)
- Error messages (for fix command with -d flag)

**Privacy:**
File content is only sent when you explicitly use a command on a file. The CLI does not scan or upload your entire project. Only the specific file and project metadata are included in the request.

**Project Root Detection:**
The CLI walks up from the current directory to find project root markers (package.json, .git, etc.). This ensures correct project detection regardless of your current working directory.`,
      },
      {
        id: 'coder-history',
        title: 'Conversation History',
        content: `Determine-Coder maintains per-project conversation history.

**Storage Location:**
\`\`\`
~/.determine-coder/history/<project-hash>/
\`\`\`

Each project gets a unique history based on its root directory path.

**Viewing History:**
\`\`\`bash
dc history          # Show recent conversations
dc history --all    # Show all stored history
\`\`\`

**Clearing History:**
\`\`\`bash
dc clear            # Clear current project history
dc clear --all      # Clear all project histories
\`\`\`

**History Features:**
- Conversations are saved automatically
- History is project-scoped — different projects have separate histories
- Includes timestamps, messages, and AI responses
- History persists across terminal sessions
- No data is sent to external services — all history is local`,
      },
      {
        id: 'coder-pipe',
        title: 'Pipe Support',
        content: `Determine-Coder supports Unix pipe operations for seamless integration with existing workflows.

**Basic Pipe Usage:**
\`\`\`bash
# Explain code from stdin
cat app.js | dc explain

# Fix code piped from another command
git diff HEAD~1 --no-color | dc fix

# Review piped content
curl -s https://raw.githubusercontent.com/user/repo/main/src/app.js | dc review
\`\`\`

**Practical Examples:**

*Fix a specific error:*
\`\`\`bash
cat broken.js | dc fix -d "TypeError: cannot read property 'map' of undefined"
\`\`\`

*Refactor for performance:*
\`\`\`bash
cat old.js | dc refactor -t performance
\`\`\`

*Explain a config file:*
\`\`\`bash
cat docker-compose.yml | dc explain
\`\`\`

*Review staged changes:*
\`\`\`bash
git diff --cached --no-color | dc review
\`\`\`

*Generate tests for a file:*
\`\`\`bash
cat src/auth.js | dc generate "write unit tests for this authentication module"
\`\`\`

**Pipe Behavior:**
- When piped input is detected, the CLI reads from stdin instead of a file
- The \`-d\` flag provides additional error context alongside piped code
- Output goes to stdout by default, making it easy to chain with other tools
- Use \`-o filename\` to save output to a file`,
      },
    ],
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    ),
    sections: [
      {
        id: 'api-auth',
        title: 'Authentication (JWT)',
        content: `Determine-AI uses JWT (JSON Web Tokens) for API authentication.

**Obtaining a Token:**
Send a POST request to \`/api/auth/login\` or \`/api/auth/register\` to receive a JWT token.

**Using the Token:**
Include the token in the Authorization header of all authenticated requests:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

**Token Payload:**
The JWT token contains:
- \`sub\` — Username
- \`role\` — User role (user, moderator, admin, owner)

**Token Expiration:**
Tokens are valid for 7 days by default. After expiration, you need to re-authenticate.

**Protected Endpoints:**
All endpoints except \`/api/auth/login\`, \`/api/auth/register\`, and \`/api/premium/tiers\` require authentication.

**Roles & Permissions:**
| Role | Permissions |
|------|------------|
| User | Chat, view own sessions, manage own profile |
| Moderator | All user permissions + content moderation |
| Admin | All moderator permissions + user management, AI config |
| Owner | Full system control |`,
      },
      {
        id: 'api-login',
        title: 'POST /api/auth/login',
        content: `Authenticate an existing user and receive a JWT token.

**Request:**
\`\`\`
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "your_username",
  "role": "user",
  "subscription": "free"
}
\`\`\`

**Error Responses:**
| Status | Message |
|--------|---------|
| 401 | Wrong username or password |
| 400 | Username too short |`,
      },
      {
        id: 'api-register',
        title: 'POST /api/auth/register',
        content: `Create a new user account.

**Request:**
\`\`\`
POST /api/auth/register
Content-Type: application/json

{
  "username": "new_user",
  "password": "secure_password"
}
\`\`\`

**Validation:**
- Username: minimum 2 characters
- Password: minimum 4 characters
- Username must be unique

**Response (200 OK):**
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "new_user",
  "role": "user",
  "subscription": "free"
}
\`\`\`

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Username too short |
| 400 | Password too short |
| 400 | Username taken |`,
      },
      {
        id: 'api-chat',
        title: 'POST /api/chat',
        content: `Send a chat message and receive a streaming AI response.

**Request:**
\`\`\`
POST /api/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Hello, how are you?",
  "session_id": "optional-session-id",
  "version": "auto"
}
\`\`\`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | The user's message |
| session_id | string | No | Session ID (auto-created if omitted) |
| version | string | No | AI version (auto, 1.1, 1.2, 1.3, 1.4) |

**Response (Streaming SSE):**
\`\`\`
data: {"token": "Hello", "session_id": "abc-123"}
data: {"token": "!", "session_id": "abc-123"}
data: {"done": true, "session_id": "abc-123", "full_response": "Hello!", "tier": "free", "max_tokens": 256}
\`\`\`

**Streaming Events:**
- \`token\` — A single generated token (appended to the current response)
- \`done\` — Generation complete (includes full_response, session_id, tier info)
- \`image\` — Base64 image data URI (if image was generated)
- \`image_prompt\` — The prompt used for image generation

**Rate Limits:**
Daily message limits are enforced per subscription tier. Exceeding the limit returns a 429 status.`,
      },
      {
        id: 'api-coder-chat',
        title: 'POST /api/coder/chat',
        content: `Send a message from the Determine-Coder CLI. This endpoint is optimized for code-related queries.

**Request:**
\`\`\`
POST /api/coder/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Explain this code function",
  "context": {
    "project_type": "node",
    "file": "src/app.js",
    "language": "javascript"
  }
}
\`\`\`

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | The coding query |
| context | object | No | Project context (type, file, language) |
| session_id | string | No | Session ID for conversation continuity |

**Response:**
Same streaming format as \`POST /api/chat\`.

**Note:** This endpoint receives the same AI processing but may include additional system context for code-related queries.`,
      },
      {
        id: 'api-generate-image',
        title: 'POST /api/generate-image',
        content: `Generate an image from a text prompt.

**Request:**
\`\`\`
POST /api/generate-image
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "A serene mountain landscape at golden hour",
  "width": 1024,
  "height": 1024,
  "model": "flux"
}
\`\`\`

**Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| prompt | string | Required | Text description of the image |
| width | int | 1024 | Image width in pixels |
| height | int | 1024 | Image height in pixels |
| model | string | "flux" | AI model (flux, realism, anime, 3d) |
| enhance | bool | true | Auto-enhance prompt quality |

**Response:**
\`\`\`json
{
  "image": "data:image/jpeg;base64,...",
  "prompt": "A serene mountain landscape at golden hour",
  "model": "flux",
  "width": 1024,
  "height": 1024
}
\`\`\`

**Note:** Image generation is also triggered automatically through the chat endpoint when the AI detects image generation intent. The dedicated endpoint is for direct, programmatic image generation.`,
      },
      {
        id: 'api-sessions',
        title: 'GET /api/sessions',
        content: `List all chat sessions for the authenticated user.

**Request:**
\`\`\`
GET /api/sessions
Authorization: Bearer <token>
\`\`\`

**Response (200 OK):**
\`\`\`json
[
  {
    "session_id": "abc-123-def",
    "title": "How to implement JWT auth...",
    "message_count": 12,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T11:45:00Z"
  },
  {
    "session_id": "xyz-789-ghi",
    "title": "React component architecture",
    "message_count": 8,
    "created_at": "2025-01-14T09:00:00Z",
    "updated_at": "2025-01-14T09:30:00Z"
  }
]
\`\`\`

Sessions are sorted by most recent activity first. Each session includes its ID, auto-generated title, message count, and timestamps.`,
      },
      {
        id: 'api-messages',
        title: 'GET /api/messages/{session_id}',
        content: `Retrieve all messages in a specific session.

**Request:**
\`\`\`
GET /api/messages/{session_id}
Authorization: Bearer <token>
\`\`\`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| session_id | string | The session's unique ID |

**Response (200 OK):**
\`\`\`json
[
  {
    "id": "msg-id-1",
    "role": "user",
    "content": "Hello, how are you?",
    "username": "john",
    "created_at": "2025-01-15T10:30:00Z"
  },
  {
    "id": "msg-id-2",
    "role": "assistant",
    "content": "Hello! I'm doing well, thank you for asking...",
    "username": "Determine-AI",
    "created_at": "2025-01-15T10:30:05Z"
  }
]
\`\`\`

**Message Roles:**
- \`user\` — Message from the authenticated user
- \`assistant\` — Response from the AI
- \`system\` — System messages (announcements, context)

**Limits:**
Returns up to 200 messages per session, ordered by creation time.`,
      },
      {
        id: 'api-premium-tiers',
        title: 'GET /api/premium/tiers',
        content: `Retrieve available subscription tiers and their features.

**Request:**
\`\`\`
GET /api/premium/tiers
\`\`\`
No authentication required.

**Response (200 OK):**
\`\`\`json
[
  {
    "id": "free",
    "name": "Starter",
    "price": 0,
    "period": "forever",
    "version": "1.1",
    "features": ["Basic AI chat", "50 messages per day", "Chat history", "Community support"],
    "limits": {
      "daily_messages": 50,
      "max_tokens": 256,
      "temperature": 0.7,
      "top_k": 50,
      "top_p": 0.9,
      "image_analysis": false
    }
  },
  ...
]
\`\`\`

**Tier Details:**
| Tier | Price | Daily Messages | Max Tokens | Image Analysis |
|------|-------|---------------|------------|----------------|
| Starter | Free | 50 | 256 | No |
| Basic | $9.99/mo | 500 | 512 | Yes |
| Professional | $29.99/mo | Unlimited | 1024 | Yes |
| Enterprise | $99.99/mo | Unlimited | 2048 | Yes |`,
      },
      {
        id: 'api-checkout',
        title: 'POST /api/premium/checkout',
        content: `Initiate a subscription checkout process.

**Request:**
\`\`\`
POST /api/premium/checkout
Content-Type: application/json
Authorization: Bearer <token>

{
  "tier_id": "basic"
}
\`\`\`

**Parameters:**
| Field | Type | Description |
|-------|------|-------------|
| tier_id | string | Target tier (free, basic, pro, enterprise) |

**Response — Stripe Redirect:**
\`\`\`json
{
  "status": "redirect",
  "url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_test_..."
}
\`\`\`

**Response — Free Tier (Immediate):**
\`\`\`json
{
  "status": "subscribed",
  "tier": "Starter",
  "tier_id": "free"
}
\`\`\`

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | Invalid tier |
| 400 | Payment not configured for this plan |

**Stripe Integration:**
The checkout uses Stripe Checkout for payment processing. Set \`STRIPE_SECRET_KEY\` in your .env file and configure webhook endpoints for automatic subscription management.`,
      },
    ],
  },
  {
    id: 'admin-panel',
    title: 'Admin Panel',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    ),
    sections: [
      {
        id: 'admin-dashboard',
        title: 'Dashboard Overview',
        content: `The admin dashboard provides a complete overview of your Determine-AI instance.

**Access:** Navigate to /admin (requires admin or owner role)

**Dashboard Features:**
- **Total Messages** — Count of all messages across all users
- **Total Sessions** — Count of all chat sessions
- **Total Users** — Registered user count
- **Messages Today** — Messages sent in the current day
- **Sessions Today** — New sessions created today
- **System Info** — Server status, model version, uptime

**Charts & Visualizations:**
- Messages per day (7-day chart)
- User activity trends
- Subscription tier distribution

**Quick Actions:**
- View and manage users
- Monitor active sessions
- Create announcements
- Configure AI settings
- Manage blog posts`,
      },
      {
        id: 'admin-users',
        title: 'User Management',
        content: `The user management section lets you view and control all user accounts.

**User List Features:**
- View all registered users with their roles and subscriptions
- Search users by username
- Sort by registration date, role, or subscription tier
- View individual user details and activity

**User Actions:**
- **Change Role** — Promote or demote users (user, moderator, admin)
- **Assign Plan** — Manually assign subscription tiers
- **Delete User** — Remove user accounts and their data
- **View Sessions** — See all chat sessions for a specific user
- **View Messages** — Browse message history

**Role Management:**
| Role | Can Assign |
|------|-----------|
| Owner | Can change any role |
| Admin | Can set user/moderator roles |
| Moderator | Cannot change roles |
| User | Cannot change roles |

**User Data:**
Each user record contains:
- Username and display name
- Role (user/moderator/admin/owner)
- Subscription tier
- Registration date
- Google OAuth ID (if applicable)
- Email (if Google auth used)`,
      },
      {
        id: 'admin-messages',
        title: 'Message Management',
        content: `Monitor and manage all messages across the platform.

**Message Browser:**
- View messages from all users
- Filter by user, session, or date range
- Search message content
- View full conversation context

**Message Actions:**
- **Edit** — Modify message content
- **Delete** — Remove individual messages
- **Search** — Full-text search across all messages

**Moderation Features:**
- Flag inappropriate content
- Review reported messages
- Bulk delete messages from specific users

**Session Management:**
- View all active sessions
- See session metadata (user, message count, creation date)
- Delete sessions and their associated messages
- Export session data

**Privacy Considerations:**
Admin access to messages is logged. Only users with admin or owner roles can access the message management interface.`,
      },
      {
        id: 'admin-training',
        title: 'Training the AI',
        content: `Determine-AI includes a teaching system that lets you customize the AI's knowledge and behavior.

**Admin Training:**
Navigate to the Teach AI section in the admin panel to add custom knowledge.

**How It Works:**
1. Add a teaching entry with a topic and content
2. The knowledge is injected into the AI's system prompt
3. All users benefit from the shared knowledge base
4. Up to 20 admin teachings are included per request

**Example Teachings:**
- **Topic:** "Company Policy" — Content: "When asked about our return policy, always direct users to..."
- **Topic:** "Product FAQ" — Content: "Our product supports Windows, macOS, and Linux..."
- **Topic:** "Code Standards" — Content: "Always use TypeScript strict mode, prefer functional components..."

**User-Level Training:**
Users can also teach the AI custom knowledge:
- Navigate to /teach in the chat app
- Add personal knowledge entries
- Enable/disable individual entries
- Up to 50 user teachings per user

**Teaching Best Practices:**
- Keep topics focused and specific
- Provide clear, concise content
- Update teachings as information changes
- Use proper formatting for readability
- Test the AI's responses after adding new teachings

**Priority Order:**
1. User teachings (highest priority)
2. Admin teachings
3. System prompt (base knowledge)`,
      },
      {
        id: 'admin-blog',
        title: 'Blog Management',
        content: `Determine-AI includes a built-in blog system for announcements, tutorials, and updates.

**Creating Blog Posts:**
1. Navigate to the Blog section in the admin panel
2. Click "New Post"
3. Write your content using Markdown
4. Add tags for categorization
5. Set publish status (draft or published)

**Post Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| title | Yes | Post title |
| content | Yes | Markdown content |
| excerpt | No | Short description for previews |
| tags | No | Categories/topics |
| published | No | Show publicly (default: draft) |

**Managing Posts:**
- Edit existing posts
- Publish/unpublish posts
- Delete posts
- Filter by tags or status

**Markdown Support:**
Blog content supports full Markdown syntax including:
- Headers, bold, italic
- Code blocks with syntax highlighting
- Lists and tables
- Links and images
- Blockquotes`,
      },
      {
        id: 'admin-profile',
        title: 'Profile Settings',
        content: `All users can manage their profile settings.

**Access:** Click your username in the sidebar, then "User Settings"

**Available Settings:**
- **Display Name** — Your visible name in the app
- **Password** — Change your password (requires current password)
- **Theme** — Dark or Light mode
- **AI Text Color** — Customize the color of AI responses
- **Font Size** — Adjust text size (12-20px)
- **Accent Color** — Change the UI accent color
- **Language** — Interface language (EN/RU/UZ)

**Theme Customization:**
- Dark mode: Deep purple/black background with violet accents
- Light mode: Clean white background with red accents
- Custom accent colors for both modes

**Chat Customization:**
- Set a custom background image for the chat
- Change or remove backgrounds at any time
- Background is stored locally per user

**Data Storage:**
- Settings are stored both locally (localStorage) and on the server
- Server-side settings sync across devices
- Local settings provide instant UI updates`,
      },
    ],
  },
  {
    id: 'subscription-plans',
    title: 'Subscription Plans',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
    ),
    sections: [
      {
        id: 'plan-starter',
        title: 'Starter (Free)',
        content: `The Starter plan is free forever and provides basic AI capabilities.

**Price:** $0 / forever

**Features:**
- Basic AI chat
- 50 messages per day
- Chat history
- Community support
- AI Version: 1.1

**Limits:**
| Parameter | Value |
|-----------|-------|
| Daily Messages | 50 |
| Max Tokens | 256 |
| Temperature | 0.7 |
| Top-K | 50 |
| Top-P | 0.9 |
| Image Analysis | No |

**Best For:**
- Personal use and experimentation
- Trying out Determine-AI before upgrading
- Light usage with occasional questions
- Users who want basic AI assistance

**Notes:**
- No credit card required
- Image generation via chat is available (uses Pollinations.ai)
- Web search is available
- The 50 message limit resets daily at midnight UTC`,
      },
      {
        id: 'plan-basic',
        title: 'Basic ($9.99/mo)',
        content: `The Basic plan unlocks longer responses and image analysis.

**Price:** $9.99 / month

**Features:**
- 500 messages per day
- Longer responses (512 tokens)
- Image analysis
- Priority support
- AI Version: 1.2

**Limits:**
| Parameter | Value |
|-----------|-------|
| Daily Messages | 500 |
| Max Tokens | 512 |
| Temperature | 0.75 |
| Top-K | 60 |
| Top-P | 0.92 |
| Image Analysis | Yes |

**Best For:**
- Regular users who need more capacity
- Teams with moderate usage
- Users who need image analysis capabilities
- Professionals who need detailed responses

**Upgrade:** Navigate to /plans and click "Upgrade" on the Basic card.`,
      },
      {
        id: 'plan-professional',
        title: 'Professional ($29.99/mo)',
        content: `The Professional plan provides unlimited access and premium features.

**Price:** $29.99 / month

**Features:**
- Unlimited messages
- Full-length responses (1024 tokens)
- Image analysis
- Fine-tuned model
- Priority support
- API access
- AI Version: 1.3

**Limits:**
| Parameter | Value |
|-----------|-------|
| Daily Messages | Unlimited |
| Max Tokens | 1024 |
| Temperature | 0.8 |
| Top-K | 80 |
| Top-P | 0.95 |
| Image Analysis | Yes |

**Best For:**
- Power users who need unlimited access
- Developers using the API
- Teams requiring full-length responses
- Users who need the fine-tuned model

**Upgrade:** Navigate to /plans and click "Upgrade" on the Professional card.`,
      },
      {
        id: 'plan-enterprise',
        title: 'Enterprise ($99.99/mo)',
        content: `The Enterprise plan provides maximum capabilities with dedicated support.

**Price:** $99.99 / month

**Features:**
- Everything in Professional
- Custom fine-tuned model
- Team (10 users)
- Analytics dashboard
- Custom branding
- Dedicated support
- SLA guarantee
- AI Version: 1.4

**Limits:**
| Parameter | Value |
|-----------|-------|
| Daily Messages | Unlimited |
| Max Tokens | 2048 |
| Temperature | 0.85 |
| Top-K | 100 |
| Top-P | 0.97 |
| Image Analysis | Yes |

**Best For:**
- Organizations with multiple users
- Teams requiring dedicated support
- Businesses needing custom branding
- Mission-critical deployments with SLA requirements

**Upgrade:** Navigate to /plans and click "Upgrade" on the Enterprise card.`,
      },
      {
        id: 'plan-upgrade',
        title: 'How to Upgrade',
        content: `Upgrading your subscription is straightforward:

**Step 1: Navigate to Plans**
Click your username in the sidebar and select "Upgrade Plan", or navigate directly to /plans

**Step 2: Choose a Plan**
Review the available tiers and their features. The current plan is marked with "Current Plan".

**Step 3: Click Upgrade**
Click the "Upgrade" button on your desired plan.

**Step 4: Complete Payment**
- You will be redirected to Stripe Checkout
- Enter your payment details
- Complete the purchase
- You will be redirected back to Determine-AI

**Step 5: Activation**
Your new plan is activated immediately upon successful payment. The daily message limit and other features update instantly.

**Payment Methods:**
- Credit/debit cards via Stripe
- Direct invoicing for Enterprise (contact admin)

**Managing Your Subscription:**
- View current plan and usage in the sidebar
- Usage bar shows daily message consumption
- Downgrade at any time (takes effect at end of billing period)
- Cancel anytime

**Troubleshooting:**
- If payment fails, check your card details
- Contact your administrator if payment links are not configured
- For Enterprise plans, contact the admin for custom invoicing`,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
    ),
    sections: [
      {
        id: 'common-issues',
        title: 'Common Issues',
        content: `Here are solutions to the most frequently encountered issues:

**"AI model not loaded" Error (503)**
- The AI model failed to load during server startup
- Check that MODEL_NAME in .env is a valid Hugging Face model
- Ensure you have enough RAM for the model
- Check the server logs for detailed error messages
- Try reducing the model size (e.g., use a smaller variant)

**"Daily message limit reached" (429)**
- You've exceeded your tier's daily message limit
- The limit resets at midnight UTC
- Upgrade your plan for higher limits
- Check your usage in the sidebar

**Login Issues**
- "Wrong username or password" — verify credentials
- Ensure the server is running and accessible
- Check that MONGO_URL is correctly configured
- Try creating a new account if password was forgotten

**Frontend Not Loading**
- Ensure the frontend is built (\`cd frontend && npm run build\`)
- Check that the static files are served correctly
- Clear browser cache and hard refresh
- Check browser console for JavaScript errors

**Google OAuth Not Working**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
- Ensure the redirect URI matches exactly in Google Cloud Console
- Check that the OAuth consent screen is configured
- Verify the frontend VITE_GOOGLE_CLIENT_ID matches the backend

**Session Not Found**
- Sessions are stored in MongoDB — verify the database connection
- Check that DB_NAME matches your MongoDB database
- Sessions may have been deleted by an admin`,
      },
      {
        id: 'model-not-loading',
        title: 'Model Not Loading',
        content: `If the AI model fails to load, follow these troubleshooting steps:

**Check Server Logs:**
\`\`\`bash
# View the server log for model loading errors
cat server.log
\`\`\`

**Common Causes:**
1. **Insufficient RAM** — The model requires more memory than available
2. **Invalid model name** — MODEL_NAME in .env doesn't match a valid Hugging Face model
3. **Network issues** — First run requires downloading the model
4. **CUDA issues** — GPU acceleration failed (falls back to CPU)

**Solutions:**

*Check available memory:*
\`\`\`bash
# Linux/macOS
free -h

# Windows
systeminfo | findstr "Memory"
\`\`\`

*Try a smaller model:*
\`\`\`
# In .env, use a smaller model variant
MODEL_NAME=Qwen/Qwen2.5-0.3B-Instruct
\`\`\`

*Force CPU mode:*
The inference engine will fall back to CPU automatically if GPU is unavailable. Check the logs for "AI loaded" message.

*Re-download the model:*
\`\`\`bash
# Clear the Hugging Face cache and restart
rm -rf ~/.cache/huggingface/hub/
python run.py
\`\`\`

*Check GPU availability:*
\`\`\`bash
python -c "import torch; print(torch.cuda.is_available())"
\`\`\``,
      },
      {
        id: 'connection-errors',
        title: 'Connection Errors',
        content: `Troubleshooting network and database connection issues:

**MongoDB Connection Failed:**
- Verify MONGO_URL in .env is correct
- Check that MongoDB is running (local) or accessible (Atlas)
- Ensure IP whitelist includes your server (for Atlas)
- Test the connection string separately

**Test MongoDB Connection:**
\`\`\`bash
python -c "
import os
from pymongo import MongoClient
client = MongoClient(os.environ.get('MONGO_URL'))
print(client.admin.command('ping'))
"
\`\`\`

**CORS Errors:**
If you see CORS errors in the browser:
- The backend allows all origins by default (\`*\`)
- If modified, ensure your frontend URL is in the allowed origins
- Check that the backend is running on the expected port

**Port Conflicts:**
\`\`\`bash
# Check if port 8000 is in use
netstat -tulpn | grep 8000  # Linux
lsof -i :8000              # macOS
netstat -ano | findstr :8000 # Windows
\`\`\`

**Firewall Issues:**
- Ensure port 8000 is open for incoming connections
- For production, use a reverse proxy (Nginx/Caddy)
- Check that security groups allow traffic (cloud providers)

**Frontend Can't Connect to Backend:**
- Verify the backend URL in the frontend configuration
- Check that the API is accessible from the frontend's network
- Ensure CORS headers are being sent correctly
- Try accessing the API directly: \`curl http://localhost:8000/api/auth/me\``,
      },
      {
        id: 'image-gen-fails',
        title: 'Image Generation Fails',
        content: `Troubleshooting image generation issues via Pollinations.ai:

**Image Not Generating:**
- Image generation requires an internet connection
- Pollinations.ai may be temporarily unavailable
- Check if the server can reach external services

**Test Pollinations.ai Connectivity:**
\`\`\`bash
curl -I "https://image.pollinations.ai/prompt/test?width=256&height=256"
\`\`\`

**Common Issues:**

*Timeout:*
- Default timeout is 90 seconds per attempt
- Complex prompts may take longer
- Try simpler prompts for faster generation
- The system retries automatically (2 attempts per URL)

*Rate Limiting:*
- Pollinations.ai may rate-limit frequent requests
- Wait a moment between image generation requests
- Consider adding delays in automated workflows

*Prompt Too Short:*
- Prompts under 3 characters are rejected
- Use descriptive prompts for better results
- The system auto-enhances prompts with quality tags

*Network Timeout:*
- Check your server's outbound internet access
- Verify DNS resolution works
- Check firewall rules for HTTPS outbound traffic

**Debug Mode:**
Check the server logs for image generation messages:
\`\`\`bash
grep "Image gen" server.log
\`\`\`

**Alternative:**
Use the dedicated image generation page (/generate) for a more controlled experience with model and size selection.`,
      },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
    ),
    sections: [
      {
        id: 'docker-setup',
        title: 'Docker Setup',
        content: `Deploy Determine-AI using Docker for consistent, reproducible environments.

**Docker Compose Setup:**

Create a \`docker-compose.yml\` in the project root:
\`\`\`yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
\`\`\`

**Dockerfile:**
\`\`\`dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN cd frontend && npm install && npm run build

EXPOSE 8000
CMD ["python", "run.py"]
\`\`\`

**Running with Docker:**
\`\`\`bash
docker-compose up -d
\`\`\`

**Logs:**
\`\`\`bash
docker-compose logs -f app
\`\`\`

**Stopping:**
\`\`\`bash
docker-compose down
\`\`\``,
      },
      {
        id: 'nginx-config',
        title: 'Nginx Configuration',
        content: `Use Nginx as a reverse proxy for production deployments.

**Basic Nginx Config:**
\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend static files
    location / {
        root /app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE streaming support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }

    # Admin panel
    location /admin {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

**Important Notes:**
- Disable proxy buffering for SSE streaming endpoints
- Set appropriate timeouts for AI generation (300s recommended)
- Use SSL/TLS certificates (Let's Encrypt for free)
- Configure gzip compression for better performance
- Set proper cache headers for static assets`,
      },
      {
        id: 'mongodb-atlas',
        title: 'MongoDB Atlas Setup',
        content: `Use MongoDB Atlas for a managed, cloud-hosted database.

**Step 1: Create Atlas Account**
1. Go to https://cloud.mongodb.com
2. Create a free account or sign in
3. Create a new cluster (M0 free tier is sufficient for small deployments)

**Step 2: Configure Access**
1. Go to Database Access → Add New Database User
2. Create a username and password
3. Go to Network Access → Add IP Address
4. Add your server's IP (or 0.0.0.0/0 for development)

**Step 3: Get Connection String**
1. Go to Database → Connect
2. Choose "Connect your application"
3. Copy the connection string
4. Replace <password> with your database user password

**Step 4: Configure .env**
\`\`\`
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/determine-ai?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=determine_ai
\`\`\`

**Step 5: Verify Connection**
\`\`\`bash
python -c "
from pymongo import MongoClient
import os
client = MongoClient(os.environ['MONGO_URL'])
print(client.admin.command('ping'))
"
\`\`\`

**Atlas Best Practices:**
- Use connection pooling (default in PyMongo)
- Enable monitoring in Atlas dashboard
- Set up automated backups
- Use the free tier for development, upgrade for production
- Keep database user credentials secure`,
      },
      {
        id: 'env-variables',
        title: 'Environment Variables',
        content: `Complete reference of all environment variables for deployment:

**Required Variables:**
\`\`\`
# Database
MONGO_URL=mongodb+srv://user:pass@cluster/dbname
DB_NAME=determine_ai

# Security
SECRET_KEY=your-random-secret-key-min-32-chars

# AI Model
MODEL_NAME=Qwen/Qwen2.5-0.5B-Instruct
\`\`\`

**Optional Variables:**
\`\`\`
# Server
PORT=8000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payment (Stripe)
PAYMENT_URL=https://buy.stripe.com/your_link
SUCCESS_URL=http://your-domain.com
CANCEL_URL=http://your-domain.com
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
\`\`\`

**Frontend Variables (frontend/.env):**
\`\`\`
VITE_GOOGLE_CLIENT_ID=your-google-client-id
\`\`\`

**Production Security Notes:**
- Never commit .env files to version control
- Use strong, random SECRET_KEY (generate with: \`python -c "import secrets; print(secrets.token_urlsafe(32))"\`)
- Use environment-specific values for SUCCESS_URL and CANCEL_URL
- Set STRIPE_SECRET_KEY only in production (use test keys for development)
- Restrict CORS origins in production (modify backend/main.py)
- Use HTTPS in production (configure via Nginx/Caddy)`,
      },
    ],
  },
];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, flexShrink: 0 }}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

export default function DocsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState(() => {
    const initial = {};
    DOCS_DATA.forEach(c => { initial[c.id] = true; });
    return initial;
  });
  const [activeSection, setActiveSection] = useState('introduction');
  const contentRef = useRef(null);
  const sectionRefs = useRef({});

  const toggleCategory = (id) => {
    setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results = [];
    DOCS_DATA.forEach(cat => {
      cat.sections.forEach(sec => {
        const titleMatch = sec.title.toLowerCase().includes(q);
        const contentMatch = sec.content.toLowerCase().includes(q);
        if (titleMatch || contentMatch) {
          let snippet = '';
          if (contentMatch && !titleMatch) {
            const idx = sec.content.toLowerCase().indexOf(q);
            const start = Math.max(0, idx - 60);
            const end = Math.min(sec.content.length, idx + q.length + 60);
            snippet = (start > 0 ? '...' : '') + sec.content.slice(start, end).replace(/\n/g, ' ') + (end < sec.content.length ? '...' : '');
          }
          results.push({ catId: cat.id, catTitle: cat.title, secId: sec.id, secTitle: sec.title, snippet, titleMatch });
        }
      });
    });
    return results;
  }, [search]);

  const navigateToSection = (catId, secId) => {
    setSearch('');
    setSidebarOpen(false);
    if (!openCategories[catId]) {
      setOpenCategories(prev => ({ ...prev, [catId]: true }));
    }
    setActiveSection(secId);
    setTimeout(() => {
      sectionRefs.current[secId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute('data-section'));
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [openCategories]);

  const activeDoc = useMemo(() => {
    for (const cat of DOCS_DATA) {
      const sec = cat.sections.find(s => s.id === activeSection);
      if (sec) return { cat, sec };
    }
    return { cat: DOCS_DATA[0], sec: DOCS_DATA[0].sections[0] };
  }, [activeSection]);

  return (
    <div className="docs-page">
      <nav className="page-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', background: 'rgba(8,8,13,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,30,46,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Logo size={28} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Determine-AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>Documentation</span>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 8, padding: '6px 14px', color: '#6b6b80', fontSize: 13, cursor: 'pointer' }}>Home</button>
        </div>
      </nav>

      <div className="docs-layout">
        {/* Mobile sidebar toggle */}
        <button className="docs-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        {sidebarOpen && <div className="docs-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`docs-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* Search */}
          <div className="docs-search-wrap">
            <div className="docs-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search docs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="docs-search-clear" onClick={() => setSearch('')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults !== null && (
            <div className="docs-search-results">
              {searchResults.length === 0 ? (
                <div className="docs-search-empty">No results found for "{search}"</div>
              ) : (
                searchResults.map((r, i) => (
                  <button key={i} className="docs-search-result" onClick={() => navigateToSection(r.catId, r.secId)}>
                    <span className="docs-search-result-cat">{r.catTitle}</span>
                    <span className="docs-search-result-title">{r.secTitle}</span>
                    {r.snippet && <span className="docs-search-result-snippet">{r.snippet}</span>}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Navigation */}
          {searchResults === null && (
            <div className="docs-nav">
              {DOCS_DATA.map(cat => (
                <div key={cat.id} className="docs-nav-category">
                  <button className="docs-nav-category-btn" onClick={() => toggleCategory(cat.id)}>
                    <ChevronIcon open={openCategories[cat.id]} />
                    <span className="docs-nav-cat-icon">{cat.icon}</span>
                    <span>{cat.title}</span>
                  </button>
                  {openCategories[cat.id] && (
                    <div className="docs-nav-items">
                      {cat.sections.map(sec => (
                        <button
                          key={sec.id}
                          className={`docs-nav-item ${activeSection === sec.id ? 'active' : ''}`}
                          onClick={() => navigateToSection(cat.id, sec.id)}
                        >
                          <HashIcon />
                          <span>{sec.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Content */}
        <main className="docs-content" ref={contentRef}>
          {/* Breadcrumb */}
          <div className="docs-breadcrumb">
            <span>{activeDoc.cat.title}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span style={{ color: '#a78bfa' }}>{activeDoc.sec.title}</span>
          </div>

          {/* Render all sections grouped by category */}
          {DOCS_DATA.map(cat => (
            <div key={cat.id} className="docs-category-section">
              <h2 className="docs-category-title">{cat.title}</h2>
              {cat.sections.map(sec => (
                <div
                  key={sec.id}
                  ref={el => { sectionRefs.current[sec.id] = el; }}
                  data-section={sec.id}
                  className="docs-section"
                >
                  <h3 className="docs-section-title" id={sec.id}>{sec.title}</h3>
                  <div className="docs-section-content">
                    {sec.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <h4 key={i} className="docs-content-subtitle">{line.replace(/\*\*/g, '')}</h4>;
                      }
                      if (line.startsWith('| ') && line.includes('|')) {
                        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
                        if (cells.every(c => c.match(/^-+$/))) return null;
                        return <div key={i} className="docs-table-row">{cells.map((c, j) => <span key={j} className="docs-table-cell">{c}</span>)}</div>;
                      }
                      if (line.startsWith('```')) {
                        return null;
                      }
                      if (line.trim() === '') return <br key={i} />;
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return <div key={i} className="docs-list-item"><span className="docs-list-bullet">{'>'}</span>{renderInline(line.slice(2))}</div>;
                      }
                      if (/^\d+\./.test(line)) {
                        const match = line.match(/^(\d+)\.\s*(.*)/);
                        if (match) return <div key={i} className="docs-list-item docs-list-ordered"><span className="docs-list-num">{match[1]}.</span>{renderInline(match[2])}</div>;
                      }
                      return <p key={i} className="docs-paragraph">{renderInline(line)}</p>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </main>

        {/* Table of Contents (right) */}
        <aside className="docs-toc">
          <div className="docs-toc-title">On this page</div>
          {activeDoc.cat.sections.map(sec => (
            <button
              key={sec.id}
              className={`docs-toc-item ${activeSection === sec.id ? 'active' : ''}`}
              onClick={() => navigateToSection(activeDoc.cat.id, sec.id)}
            >
              {sec.title}
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}

function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    let firstMatch = null;
    let firstIndex = Infinity;

    if (boldMatch && remaining.indexOf(boldMatch[0]) < firstIndex) {
      firstMatch = { type: 'bold', match: boldMatch, index: remaining.indexOf(boldMatch[0]) };
      firstIndex = firstMatch.index;
    }
    if (codeMatch && remaining.indexOf(codeMatch[0]) < firstIndex) {
      firstMatch = { type: 'code', match: codeMatch, index: remaining.indexOf(codeMatch[0]) };
      firstIndex = firstMatch.index;
    }
    if (linkMatch && remaining.indexOf(linkMatch[0]) < firstIndex) {
      firstMatch = { type: 'link', match: linkMatch, index: remaining.indexOf(linkMatch[0]) };
      firstIndex = firstMatch.index;
    }

    if (!firstMatch) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, firstMatch.index)}</span>);
    }

    if (firstMatch.type === 'bold') {
      parts.push(<strong key={key++}>{firstMatch.match[1]}</strong>);
      remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
    } else if (firstMatch.type === 'code') {
      parts.push(<code key={key++} className="docs-inline-code">{firstMatch.match[1]}</code>);
      remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
    } else if (firstMatch.type === 'link') {
      parts.push(<span key={key++} className="docs-inline-code">{firstMatch.match[1]}</span>);
      remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
    }
  }

  return parts;
}
