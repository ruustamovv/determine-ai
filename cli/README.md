# Determine-Coder

AI coding assistant in your terminal. Powered by Determine-AI.

## Install

```bash
npm install -g determine-coder
```

## Setup

```bash
determine-coder login --server http://your-server:8000
```

## Commands

| Command | Description |
|---------|-------------|
| `dc chat` | Interactive coding chat session |
| `dc chat "message"` | Single message mode |
| `dc explain <file>` | Explain code in a file |
| `dc fix <file>` | Fix bugs in a file |
| `dc refactor <file>` | Refactor code |
| `dc review <file>` | Code review |
| `dc generate "desc"` | Generate code from description |
| `dc ask "question"` | Quick one-off question |
| `dc config` | View/set configuration |
| `dc status` | Check server status |

## Interactive Mode

Start an interactive session:

```bash
dc chat
```

### Session Commands

- `/explain` - Switch to explain mode
- `/fix` - Switch to fix mode
- `/refactor` - Switch to refactor mode
- `/review` - Switch to review mode
- `/generate` - Switch to generate mode
- `/chat` - Switch back to chat mode
- `/clear` - Clear conversation history
- `/history` - Show recent history
- `/exit` - Quit

## Pipe Support

```bash
cat app.js | dc explain
cat broken.js | dc fix -d "TypeError: cannot read property"
cat old.js | dc refactor -t performance
```

## File Context

Determine-Coder automatically detects your project type and sends context to the AI. It reads project config files (package.json, requirements.txt, etc.) and directory structure to understand your codebase.

## History

Conversation history is saved per-project in `~/.determine-coder/history/`.
