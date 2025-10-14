#!/bin/bash
set -e

echo "📦 Installing npm dependencies..."
npm install

echo "🤖 Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code

echo "✅ Post-create setup completed!"
