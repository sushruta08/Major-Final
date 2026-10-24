#!/bin/bash
# ============================================================
# SecureCI — Development Environment Setup Script
# Usage: bash scripts/setup.sh
# ============================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() { echo -e "${CYAN}[SecureCI]${NC} $1"; }
ok()  { echo -e "${GREEN}  ✓ $1${NC}"; }
warn(){ echo -e "${YELLOW}  ! $1${NC}"; }
err() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   SecureCI — Security Automation Framework   ║${NC}"
echo -e "${CYAN}║         Development Setup Script             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
log "Checking prerequisites..."

command -v python3 >/dev/null 2>&1 || err "Python 3.11+ is required"
command -v node >/dev/null 2>&1 || err "Node.js 20+ is required"
command -v docker >/dev/null 2>&1 || warn "Docker not found — container features disabled"
command -v git >/dev/null 2>&1 || err "Git is required"

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
NODE_VERSION=$(node --version)
ok "Python $PYTHON_VERSION"
ok "Node $NODE_VERSION"

# Copy environment file
log "Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  ok "Created .env from .env.example"
  warn "Please update .env with your configuration before running"
else
  ok ".env already exists"
fi

# Backend setup
log "Installing backend dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate || source venv/Scripts/activate 2>/dev/null || true
pip install -r requirements.txt -q
ok "Backend dependencies installed"
cd ..

# Frontend setup
log "Installing frontend dependencies..."
cd frontend
npm install --silent
ok "Frontend dependencies installed"
cd ..

# Security engine
log "Installing security engine dependencies..."
cd security-engine
pip install bandit semgrep -q 2>/dev/null || warn "Some scanners may need manual installation"
ok "Security engine ready"
cd ..

# Database
if command -v docker >/dev/null 2>&1; then
  log "Starting database services with Docker..."
  docker compose up -d postgres redis
  sleep 3
  ok "PostgreSQL and Redis started"
else
  warn "Docker not available. Start PostgreSQL and Redis manually."
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Setup Complete! 🎉                   ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Start the app:                              ║${NC}"
echo -e "${GREEN}║  → Frontend:  cd frontend && npm run dev     ║${NC}"
echo -e "${GREEN}║  → Backend:   cd backend && uvicorn app.main ║${NC}"
echo -e "${GREEN}║  → Full stack: docker compose up             ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║  URLs:                                       ║${NC}"
echo -e "${GREEN}║  → App:     http://localhost:3000            ║${NC}"
echo -e "${GREEN}║  → API:     http://localhost:8000/api/docs   ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║  Demo login: admin@secureci.dev / admin123   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
