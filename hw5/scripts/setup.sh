#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

info() { printf '\033[1;34m[setup]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[setup]\033[0m %s\n' "$1"; }
error() { printf '\033[1;31m[setup]\033[0m %s\n' "$1" >&2; }

assert_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "Missing dependency: $1"
    exit 1
  fi
}

info "Checking required tooling"
assert_command node
assert_command npm
assert_command npx

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if (( NODE_MAJOR < 18 )); then
  error "Node.js 18 or newer is required. Detected $(node -v)."
  exit 1
fi

if [[ ! -f .env.example ]]; then
  error ".env.example not found. Please add it before running this script."
  exit 1
fi

if [[ ! -f .env.local ]]; then
  info "Creating .env.local from .env.example"
  cp .env.example .env.local
  warn "Update .env.local with real credentials before running the app."
else
  info ".env.local already exists; leaving untouched."
fi

info "Installing npm dependencies"
npm install

info "Generating Prisma client"
npx prisma generate

if grep -q "USER:PASSWORD@HOST" .env.local; then
  warn "Database URL still contains placeholder values. Skipping prisma db push."
else
  info "Pushing Prisma schema to the database"
  npx prisma db push
fi

info "Setup complete. You can now run 'npm run dev' to start the development server."
