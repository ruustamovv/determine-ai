# Determine-Coder CLI Installation

## Quick Install
npm install -g determine-coder

## From Source
git clone <repo-url>
cd determine-ai/cli
npm install
npm link

## Setup
determine-coder login --server http://your-server:8000

## Verify
determine-coder status

## Usage
dc chat                    # Interactive mode
dc ask "How to sort?"      # Quick question
dc explain src/app.py      # Explain a file
dc fix src/utils.js        # Fix bugs
dc refactor src/old.js     # Refactor code
dc review src/main.py      # Code review
dc generate "REST API"     # Generate code

## Configuration
determine-coder config --server http://your-server:8000

## Uninstall
npm uninstall -g determine-coder
