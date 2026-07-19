#!/usr/bin/env node

const { Command } = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const CONFIG_DIR = path.join(os.homedir(), '.determine-coder');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const HISTORY_DIR = path.join(CONFIG_DIR, 'history');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getProjectHash() {
  const cwd = process.cwd();
  let hash = 0;
  for (let i = 0; i < cwd.length; i++) {
    hash = ((hash << 5) - hash + cwd.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function loadHistory() {
  const hash = getProjectHash();
  const histFile = path.join(HISTORY_DIR, `${hash}.json`);
  try {
    if (fs.existsSync(histFile)) {
      return JSON.parse(fs.readFileSync(histFile, 'utf8'));
    }
  } catch {}
  return [];
}

function saveHistory(history) {
  if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });
  const hash = getProjectHash();
  const histFile = path.join(HISTORY_DIR, `${hash}.json`);
  fs.writeFileSync(histFile, JSON.stringify(history.slice(-100), null, 2));
}

function clearHistory() {
  const hash = getProjectHash();
  const histFile = path.join(HISTORY_DIR, `${hash}.json`);
  if (fs.existsSync(histFile)) fs.unlinkSync(histFile);
}

function getHeaders() {
  const config = loadConfig();
  const headers = { 'Content-Type': 'application/json' };
  if (config.token) headers['Authorization'] = `Bearer ${config.token}`;
  return headers;
}

function getServer() {
  return loadConfig().server || 'http://localhost:8000';
}

function getProjectContext() {
  const cwd = process.cwd();
  const context = { files: [], root: cwd, language: 'unknown' };

  const indicators = {
    'package.json': 'javascript/typescript',
    'tsconfig.json': 'typescript',
    'requirements.txt': 'python',
    'pyproject.toml': 'python',
    'Cargo.toml': 'rust',
    'go.mod': 'go',
    'pom.xml': 'java',
    'build.gradle': 'java/kotlin',
    'Gemfile': 'ruby',
    'composer.json': 'php',
    'vite.config.js': 'javascript',
    'vite.config.ts': 'typescript',
    'next.config.js': 'javascript',
    'next.config.ts': 'typescript',
    'angular.json': 'typescript',
    'svelte.config.js': 'javascript',
    'docker-compose.yml': 'docker',
    'Dockerfile': 'docker',
    'README.md': null,
    '.env': null,
  };

  for (const [file, lang] of Object.entries(indicators)) {
    const fp = path.join(cwd, file);
    if (fs.existsSync(fp)) {
      try {
        const content = fs.readFileSync(fp, 'utf8').slice(0, 3000);
        context.files.push({ name: file, content });
        if (lang && context.language === 'unknown') context.language = lang;
      } catch {}
    }
  }

  try {
    const items = fs.readdirSync(cwd, { withFileTypes: true });
    const ignored = ['node_modules', '__pycache__', '.git', 'dist', 'build', '.next', 'target', 'vendor', '.determine-coder'];
    context.structure = items
      .filter(i => !i.name.startsWith('.') && !ignored.includes(i.name))
      .map(i => i.isDirectory() ? `${i.name}/` : i.name)
      .slice(0, 50);
  } catch {}

  return context;
}

function readFileForContext(filePath) {
  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return null;
    const content = fs.readFileSync(resolved, 'utf8');
    if (content.length > 50000) {
      return { name: path.basename(resolved), content: content.slice(0, 50000), truncated: true };
    }
    return { name: path.basename(resolved), content, truncated: false };
  } catch {
    return null;
  }
}

async function streamResponse(endpoint, body, spinner) {
  const headers = getHeaders();
  const server = getServer();

  const response = await fetch(`${server}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream')) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    if (spinner) spinner.stop();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              process.stdout.write(parsed.token);
              fullResponse += parsed.token;
            }
            if (parsed.error) {
              process.stdout.write(chalk.red(`\nError: ${parsed.error}\n`));
            }
          } catch {}
        }
      }
    }

    process.stdout.write('\n');
    return fullResponse;
  } else {
    const data = await response.json();
    if (spinner) spinner.stop();
    return data.response || data.detail || JSON.stringify(data);
  }
}

async function streamNonInteractive(endpoint, body) {
  const headers = getHeaders();
  const server = getServer();

  const response = await fetch(`${server}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

const program = new Command();

program
  .name('determine-coder')
  .alias('dc')
  .description('Determine-Coder - AI coding assistant in your terminal')
  .version('1.0.0');

program
  .command('login')
  .description('Login to your Determine-AI server')
  .option('-s, --server <url>', 'Server URL', 'http://localhost:8000')
  .action(async (opts) => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'username', message: 'Username:' },
      { type: 'password', name: 'password', message: 'Password:', mask: '*' },
    ]);

    const spinner = ora('Logging in...').start();
    try {
      const data = await fetch(`${opts.server}/api/cli/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      }).then(r => r.json());

      if (data.token) {
        saveConfig({ server: opts.server, token: data.token, username: data.username });
        spinner.succeed(chalk.green(`Logged in as ${data.username}`));
      } else {
        spinner.fail(chalk.red(data.detail || 'Login failed'));
      }
    } catch (e) {
      spinner.fail(chalk.red(`Connection failed: ${e.message}`));
    }
  });

program
  .command('chat')
  .description('Start an interactive coding chat session')
  .argument('[message]', 'Send a single message and exit')
  .option('--no-history', 'Disable conversation history')
  .action(async (message, opts) => {
    const config = loadConfig();
    if (!config.token) {
      console.log(chalk.yellow('Not logged in. Run: determine-coder login'));
      return;
    }

    const ctx = getProjectContext();
    const contextStr = `Project: ${ctx.root}\nLanguage: ${ctx.language}\nFiles: ${ctx.files.map(f => f.name).join(', ')}\nStructure:\n${(ctx.structure || []).map(s => `  ${s}`).join('\n')}`;

    // Single message mode
    if (message || process.stdin.isTTY === false) {
      let input = message;
      if (!input && !process.stdin.isTTY) {
        input = fs.readFileSync(0, 'utf8').trim();
      }
      if (!input) {
        console.log(chalk.yellow('No message provided'));
        return;
      }

      const spinner = ora('Thinking...').start();
      try {
        const history = opts.history ? loadHistory() : [];
        const response = await streamNonInteractive('/api/coder/chat', {
          message: input,
          context: contextStr,
          history,
          mode: 'chat',
        });
        spinner.stop();
        console.log(chalk.hex('#a78bfa')(response));

        if (opts.history) {
          history.push({ role: 'user', content: input });
          history.push({ role: 'assistant', content: response });
          saveHistory(history);
        }
      } catch (e) {
        spinner.fail(chalk.red(e.message));
      }
      return;
    }

    // Interactive mode
    console.log(chalk.hex('#7c3aed')('\n  Determine-Coder v1.0'));
    console.log(chalk.dim(`  Project: ${ctx.root} (${ctx.language})`));
    console.log(chalk.dim('  Commands: /explain, /fix, /refactor, /review, /generate, /clear, /history, /exit\n'));

    const history = loadHistory();
    let currentMode = 'chat';

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.hex('#a78bfa')('you > '),
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) { rl.prompt(); return; }

      // Commands
      if (input === '/exit' || input === '/quit') {
        console.log(chalk.dim('\nGoodbye!'));
        rl.close();
        return;
      }

      if (input === '/clear') {
        clearHistory();
        console.log(chalk.dim('History cleared.\n'));
        rl.prompt();
        return;
      }

      if (input === '/history') {
        const h = loadHistory();
        if (h.length === 0) {
          console.log(chalk.dim('No history for this project.\n'));
        } else {
          console.log(chalk.dim(`\n${h.length} messages in history:\n`));
          for (const msg of h.slice(-10)) {
            const role = msg.role === 'user' ? chalk.hex('#a78bfa')('you') : chalk.green('ai');
            const preview = msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '');
            console.log(`  ${role}: ${preview}`);
          }
          console.log();
        }
        rl.prompt();
        return;
      }

      if (input.startsWith('/explain')) {
        currentMode = 'explain';
        const arg = input.slice(8).trim();
        if (arg) {
          await handleInput(arg, currentMode, history, contextStr, opts.history);
        } else {
          console.log(chalk.dim('Mode set to explain. Paste or describe code to explain.'));
        }
        rl.prompt();
        return;
      }

      if (input.startsWith('/fix')) {
        currentMode = 'fix';
        const arg = input.slice(4).trim();
        if (arg) {
          await handleInput(arg, currentMode, history, contextStr, opts.history);
        } else {
          console.log(chalk.dim('Mode set to fix. Paste buggy code or describe the issue.'));
        }
        rl.prompt();
        return;
      }

      if (input.startsWith('/refactor')) {
        currentMode = 'refactor';
        const arg = input.slice(9).trim();
        if (arg) {
          await handleInput(arg, currentMode, history, contextStr, opts.history);
        } else {
          console.log(chalk.dim('Mode set to refactor. Paste code to improve.'));
        }
        rl.prompt();
        return;
      }

      if (input.startsWith('/review')) {
        currentMode = 'review';
        const arg = input.slice(7).trim();
        if (arg) {
          await handleInput(arg, currentMode, history, contextStr, opts.history);
        } else {
          console.log(chalk.dim('Mode set to review. Paste code for review.'));
        }
        rl.prompt();
        return;
      }

      if (input.startsWith('/generate')) {
        currentMode = 'generate';
        const arg = input.slice(9).trim();
        if (arg) {
          await handleInput(arg, currentMode, history, contextStr, opts.history);
        } else {
          console.log(chalk.dim('Mode set to generate. Describe what to build.'));
        }
        rl.prompt();
        return;
      }

      if (input === '/chat') {
        currentMode = 'chat';
        console.log(chalk.dim('Mode set to chat.\n'));
        rl.prompt();
        return;
      }

      await handleInput(input, currentMode, history, contextStr, opts.history);
      currentMode = 'chat';
      rl.prompt();
    });

    rl.on('close', () => {
      console.log(chalk.dim('Goodbye!'));
      process.exit(0);
    });
  });

async function handleInput(input, mode, history, contextStr, saveHist) {
  // Check if input looks like a file path and try to read it
  let files = [];
  const trimmed = input.trim();
  if (!trimmed.includes('\n') && trimmed.length < 200) {
    const maybeFile = readFileForContext(trimmed);
    if (maybeFile) {
      files.push(maybeFile);
      console.log(chalk.dim(`  (attached: ${trimmed})\n`));
    }
  }

  const spinner = ora('Thinking...').start();
  try {
    const response = await streamResponse('/api/coder/chat/stream', {
      message: input,
      context: contextStr,
      history: history.slice(-20),
      files: files.length > 0 ? files : undefined,
      mode,
    }, spinner);

    if (saveHist) {
      history.push({ role: 'user', content: input });
      history.push({ role: 'assistant', content: response });
      saveHistory(history);
    }

    // Handle file generation output
    const fileRegex = /=== FILE: (.+?) ===([\s\S]*?)=== END FILE ===/g;
    let match;
    let filesCreated = 0;

    while ((match = fileRegex.exec(response)) !== null) {
      const filePath = path.join(process.cwd(), match[1].trim());
      const content = match[2].trim();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content);
      console.log(chalk.green(`  Created: ${match[1].trim()}`));
      filesCreated++;
    }

    if (filesCreated > 0) {
      console.log(chalk.green(`\n  ${filesCreated} file(s) created`));
    }
  } catch (e) {
    spinner.fail(chalk.red(e.message));
  }
}

program
  .command('ask <question>')
  .description('Quick one-off question')
  .action(async (question) => {
    const config = loadConfig();
    if (!config.token) {
      console.log(chalk.yellow('Not logged in. Run: determine-coder login'));
      return;
    }

    const ctx = getProjectContext();
    const contextStr = `Project: ${ctx.root}\nLanguage: ${ctx.language}`;

    const spinner = ora('Thinking...').start();
    try {
      const response = await streamNonInteractive('/api/coder/chat', {
        message: question,
        context: contextStr,
        mode: 'chat',
      });
      spinner.stop();
      console.log(chalk.hex('#a78bfa')(response));
    } catch (e) {
      spinner.fail(chalk.red(e.message));
    }
  });

program
  .command('explain [file]')
  .description('Explain a file or code')
  .action(async (file) => {
    const config = loadConfig();
    if (!config.token) {
      console.log(chalk.yellow('Not logged in. Run: determine-coder login'));
      return;
    }

    const ctx = getProjectContext();
    const contextStr = `Project: ${ctx.root}\nLanguage: ${ctx.language}`;

    let message = 'Explain this code';
    let files = [];

    if (file) {
      const f = readFileForContext(file);
      if (f) {
        files.push(f);
        message = `Explain this code in detail:\n\n${f.content}`;
      } else {
        console.log(chalk.red(`File not found: ${file}`));
        return;
      }
    } else if (!process.stdin.isTTY) {
      const stdin = fs.readFileSync(0, 'utf8').trim();
      message = `Explain this code:\n\n${stdin}`;
    }

    const spinner = ora('Analyzing...').start();
    try {
      const response = await streamResponse('/api/coder/chat/stream', {
        message,
        context: contextStr,
        files,
        mode: 'explain',
      }, spinner);
    } catch (e) {
      spinner.fail(chalk.red(e.message));
    }
  });

program
  .command('fix [file]')
  .description('Fix bugs in a file or code')
  .option('-d, --describe <issue>', 'Describe the bug')
  .action(async (file, opts) => {
    const config = loadConfig();
    if (!config.token) {
      console.log(chalk.yellow('Not logged in. Run: determine-coder login'));
      return;
    }

    const ctx = getProjectContext();
    const contextStr = `Project: ${ctx.root}\nLanguage: ${ctx.language}`;

    let message = opts.describe || 'Fix bugs in this code';
    let files = [];

    if (file) {
      const f = readFileForContext(file);
      if (f) {
        files.push(f);
        message = `Fix the bugs in this code${opts.describe ? ': ' + opts.describe : ''}:\n\n${f.content}`;
      } else {
        console.log(chalk.red(`File not found: ${file}`));
        return;
      }
    } else if (!process.stdin.isTTY) {
      const stdin = fs.readFileSync(0, 'utf8').trim();
      message = `Fix bugs in this code:\n\n${stdin}`;
    }

    const spinner = ora('Finding bugs...').start();
    try {
      const response = await streamResponse('/api/coder/chat/stream', {
        message,
        context: contextStr,
        files,
        mode: 'fix',
      }, spinner);
    } catch (e) {
      spinner.fail(chalk.red(e.message));
    }
  });

program
  .command('refactor [file]')
  .description('Refactor a file or code')
  .option('-t, --target <goal>', 'Refactoring goal (readability, performance, modernize)')
  .action(async (file, opts) => {
    const config = loadConfig();
    if (!config.token) {
      console.log(chalk.yellow('Not logged in. Run: determine-coder login'));
      return;
    }

    const ctx = getProjectContext();
    const contextStr = `Project: ${ctx.root}\nLanguage: ${ctx.language}`;

    let message = `Refactor this code${opts.target ? ' for ' + opts.target : ''}`;
    let files = [];

    if (file) {
      const f = readFileForContext(file);
      if (f) {
        files.push(f);
        message = `Refactor this code${opts.target ? ' for ' + opts.target : ''}:\n\n${f.content}`;
      } else {
        console.log(chalk.red(`File not found: ${file}`));
        return;
      }
    } else if (!process.stdin.isTTY) {
      const stdin = fs.readFileSync(0, 'utf8').trim();
      message = `Refactor this code:\n\n${stdin}`;
    }

    const spinner = ora('Refactoring...').start();
    try {
      const response = await streamResponse('/api/coder/chat/stream', {
        message,
        context: contextStr,
        files,
        mode: 'refactor',
      }, spinner);
    } catch (e) {
      spinner.fail(chalk.red(e.message));
    }
  });

program
  .command('review [file]')
  .description('Code review a file or code')
  .action(async (file) => {
    const config = loadConfig();
    if (!config.token) {
      console.log(chalk.yellow('Not logged in. Run: determine-coder login'));
      return;
    }

    const ctx = getProjectContext();
    const contextStr = `Project: ${ctx.root}\nLanguage: ${ctx.language}`;

    let message = 'Perform a thorough code review';
    let files = [];

    if (file) {
      const f = readFileForContext(file);
      if (f) {
        files.push(f);
        message = `Review this code thoroughly:\n\n${f.content}`;
      } else {
        console.log(chalk.red(`File not found: ${file}`));
        return;
      }
    } else if (!process.stdin.isTTY) {
      const stdin = fs.readFileSync(0, 'utf8').trim();
      message = `Review this code:\n\n${stdin}`;
    }

    const spinner = ora('Reviewing code...').start();
    try {
      const response = await streamResponse('/api/coder/chat/stream', {
        message,
        context: contextStr,
        files,
        mode: 'review',
      }, spinner);
    } catch (e) {
      spinner.fail(chalk.red(e.message));
    }
  });

program
  .command('generate <description>')
  .description('Generate code from a description')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(async (description, opts) => {
    const config = loadConfig();
    if (!config.token) {
      console.log(chalk.yellow('Not logged in. Run: determine-coder login'));
      return;
    }

    const ctx = getProjectContext();
    const contextStr = `Project: ${ctx.root}\nLanguage: ${ctx.language}\nExisting files: ${ctx.structure?.join(', ') || 'N/A'}`;

    const prompt = `Generate complete, production-ready code for: ${description}\n\nProvide the code in clearly labeled file blocks using this format:\n=== FILE: path/to/file ===\nfile content\n=== END FILE ===`;

    const spinner = ora('Generating code...').start();
    try {
      const response = await streamResponse('/api/coder/chat/stream', {
        message: prompt,
        context: contextStr,
        mode: 'generate',
      }, spinner);

      // Parse generated files
      const fileRegex = /=== FILE: (.+?) ===([\s\S]*?)=== END FILE ===/g;
      let match;
      let filesGenerated = 0;

      while ((match = fileRegex.exec(response)) !== null) {
        const filePath = path.join(opts.output, match[1].trim());
        const content = match[2].trim();
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content);
        console.log(chalk.green(`  Created: ${match[1].trim()}`));
        filesGenerated++;
      }

      if (filesGenerated > 0) {
        console.log(chalk.green(`\n  Generated ${filesGenerated} file(s)`));
      }
    } catch (e) {
      spinner.fail(chalk.red(e.message));
    }
  });

program
  .command('config')
  .description('View or update configuration')
  .option('-s, --server <url>', 'Set server URL')
  .action((opts) => {
    const config = loadConfig();
    if (opts.server) {
      config.server = opts.server;
      saveConfig(config);
      console.log(chalk.green(`Server set to: ${opts.server}`));
    } else {
      console.log(chalk.dim('Determine-Coder Configuration:'));
      console.log(`  Server:  ${config.server || 'http://localhost:8000'}`);
      console.log(`  User:    ${config.username || 'Not logged in'}`);
      console.log(`  Token:   ${config.token ? '***' + config.token.slice(-4) : 'None'}`);
    }
  });

program
  .command('status')
  .description('Check server status')
  .action(async () => {
    const server = getServer();
    const spinner = ora(`Checking ${server}...`).start();
    try {
      const r = await fetch(`${server}/api/premium/tiers`);
      if (r.ok) {
        spinner.succeed(chalk.green(`Server is running at ${server}`));
      } else {
        spinner.fail(chalk.red(`Server returned ${r.status}`));
      }
    } catch (e) {
      spinner.fail(chalk.red(`Cannot connect to ${server}`));
    }
  });

program.parse();
