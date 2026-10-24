# 🛡️ SecureCI — Security Automation Framework in CI/CD Pipelines

<div align="center">

![SecureCI Banner](https://img.shields.io/badge/SecureCI-Enterprise%20DevSecOps-0ea5e9?style=for-the-badge&logo=shield&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**B.Tech Final Year Major Project — Enterprise DevSecOps Platform**

*Automatically scans every code commit for security vulnerabilities before it reaches production.*

[Live Demo](#demo-login) · [Architecture](docs/ARCHITECTURE.md) · [API Docs](#api-documentation) · [Quick Start](#quick-start)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [Security Scanners](#security-scanners)
- [API Documentation](#api-documentation)
- [Demo Login](#demo-login)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [Architecture](#architecture)

---

## Overview

**SecureCI** is a production-ready Security Automation Framework that integrates directly into CI/CD pipelines to automatically scan source code, container images, and dependencies for vulnerabilities on every commit.

It provides a centralized **enterprise security dashboard** comparable to:
- Microsoft Defender for DevOps
- Snyk Security Platform
- GitHub Advanced Security
- GitLab Ultimate Security Dashboard

### Problem Statement
Modern software teams push code hundreds of times per day. Manual security reviews cannot keep pace. Vulnerabilities like SQL injection, hardcoded secrets, and outdated dependencies slip through to production, costing companies millions in breaches.

### Solution
SecureCI plugs into your GitHub/GitLab push events and runs a **multi-scanner security pipeline** automatically — catching critical issues before deployment.

---

## Features

### 🔒 Security Scanning
| Scanner | Type | Language |
|---------|------|----------|
| **Bandit** | Python SAST | Python |
| **Semgrep** | Multi-language SAST | 20+ languages |
| **Trivy** | Container + FS scan | Docker, k8s |
| **Safety** | Dependency CVEs | Python packages |
| **pip-audit** | Dependency audit | Python packages |
| **Gitleaks** | Secret detection | All file types |
| **Dockerfile Scan** | Config analysis | Dockerfile |

### 📊 Dashboard & Analytics
- Real-time security score (0–100) with letter grades (A+ to F)
- Vulnerability trend charts — 6-month historical view
- Risk distribution pie charts by severity
- Scanner performance breakdown
- Pipeline success/failure rate tracking
- Top vulnerable repositories leaderboard

### 🚀 CI/CD Pipeline
- Animated 7-stage visual pipeline (Commit → Deploy)
- Auto-trigger on `git push` via GitHub webhook
- Deploy blocking on critical/high findings
- Per-stage timing and findings count
- Real-time stage status updates

### 🤖 AI Security Assistant
- Explains CVEs and CWEs in plain language
- Suggests code-level fixes with examples
- OWASP Top 10 guidance
- Secure code generation
- Markdown rendering with syntax-highlighted code blocks

### 📋 Compliance
- OWASP Top 10 2021 mapping
- CWE (Common Weakness Enumeration)
- CVE (Common Vulnerabilities & Exposures)
- MITRE ATT&CK framework
- NIST guidelines

### 🔔 Notifications
- Slack webhook integration
- Discord webhook
- Email (SMTP)
- Telegram bot
- In-app notification center

### 📄 Reports
- Executive Summary (management-level)
- Developer Report (code-level detail)
- Compliance Report (OWASP/NIST)
- PDF, CSV, JSON formats

---

## Tech Stack

### Frontend
```
React 18 + TypeScript     → Component framework
Vite 5                    → Build tool (lightning fast HMR)
Tailwind CSS 3            → Utility-first styling
Framer Motion 11          → Smooth animations
React Router 6            → Client-side routing
TanStack Query 5          → Server state & caching
Zustand 4                 → Client state management
Recharts 2                → Interactive charts
Lucide React              → Icon system
React Hot Toast           → Toast notifications
Socket.IO Client          → Real-time WebSocket updates
React Markdown            → AI assistant markdown rendering
```

### Backend
```
FastAPI 0.109             → Async Python API framework
SQLAlchemy 2.0            → ORM with type safety
PostgreSQL 15             → Primary database
Redis 7                   → Cache + Celery broker
Celery 5.3                → Distributed task queue
Python-Jose               → JWT token handling
Passlib + bcrypt          → Password hashing
Pydantic v2               → Request/response validation
Uvicorn                   → ASGI server
```

### Security Engine
```
Bandit 1.7                → Python static analysis
Semgrep 1.59              → Multi-language SAST
Trivy 0.49                → Container vulnerability scan
Safety 3.0                → Python dependency CVE check
Gitleaks 8.18             → Git secret detection
```

### Infrastructure
```
Docker + Docker Compose   → Containerized deployment
Nginx                     → Reverse proxy + SSL
GitHub Actions            → CI/CD workflow
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker + Docker Compose (recommended)
- Git

### Option 1: One-command setup (recommended)

```bash
git clone https://github.com/yourusername/secureci.git
cd secureci

# Run setup script
bash scripts/setup.sh
```

### Option 2: Manual setup

**1. Clone and configure**
```bash
git clone https://github.com/yourusername/secureci.git
cd secureci
cp .env.example .env
# Edit .env with your configuration
```

**2. Start infrastructure**
```bash
docker compose up -d postgres redis
```

**3. Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations / seed
python ../scripts/seed_db.py

uvicorn app.main:app --reload --port 8000
```

**4. Frontend**
```bash
cd frontend
npm install
npm run dev
```

**5. Open the app**
```
Frontend:  http://localhost:3000
API Docs:  http://localhost:8000/api/docs
```

### Option 3: Full Docker

```bash
docker compose up --build
```
All services start automatically. App at `http://localhost:80`

---

## Project Structure

```
secureci/
├── 📁 frontend/                  # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx               # Router
│   │   ├── components/
│   │   │   ├── ui/               # Button, Card, Badge, Input, Modal…
│   │   │   ├── layout/           # Sidebar, Topbar, AppLayout
│   │   │   ├── dashboard/        # MetricCard, SecurityScore, PipelineVisual
│   │   │   └── charts/           # VulnerabilityTrend, RiskPie, ScanBar
│   │   ├── pages/                # 18 pages (Dashboard, Scans, AI, etc.)
│   │   ├── store/                # Zustand: authStore, uiStore
│   │   ├── hooks/                # useScans, useDashboard
│   │   ├── services/             # Axios API client
│   │   ├── types/                # TypeScript interfaces
│   │   └── utils/                # mockData, formatters, cn()
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── 📁 backend/                   # FastAPI Python API
│   ├── app/
│   │   ├── main.py               # App entry point
│   │   ├── core/
│   │   │   ├── config.py         # Settings from .env
│   │   │   └── security.py       # JWT + bcrypt
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py           # Register, Login, /me
│   │   │   ├── scans.py          # Scan management
│   │   │   └── dashboard.py      # Metrics API
│   │   ├── db/
│   │   │   ├── base.py           # SQLAlchemy setup
│   │   │   └── models/           # ORM models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # ReportService, NotificationService
│   │   └── workers/              # Celery tasks
│   └── requirements.txt
│
├── 📁 security-engine/           # Python scanning engine
│   ├── scanners/
│   │   ├── bandit_scanner.py
│   │   ├── semgrep_scanner.py
│   │   ├── trivy_scanner.py
│   │   ├── safety_scanner.py
│   │   └── gitleaks_scanner.py
│   ├── parsers/
│   │   └── result_parser.py      # Normalize all scanner output
│   ├── risk_engine/
│   │   └── risk_calculator.py    # Score, grade, risk level
│   └── pipeline_runner.py        # Orchestrates full pipeline
│
├── 📁 docker/                    # Dockerfiles + Nginx config
├── 📁 database/                  # SQL schema + migrations
├── 📁 docs/                      # Architecture, API docs
├── 📁 tests/                     # Unit + integration tests
├── 📁 scripts/                   # setup.sh, seed_db.py
├── 📁 .github/workflows/         # CI/CD GitHub Actions
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Modules

### 1. Authentication & RBAC
- JWT-based authentication (HS256, 24-hour expiry)
- bcrypt password hashing
- 4 roles: Admin, Developer, Security Engineer, Project Manager
- Role-based UI rendering
- Audit logging for all actions

### 2. Dashboard
- Overall security score (0–100) with animated ring
- Letter grade (A+ to F) based on finding severity
- Real-time pipeline status
- Vulnerability trend charts (6-month history)
- Risk distribution pie chart
- Scanner performance stats
- Recent pipeline activity

### 3. Repository Management
- Connect GitHub/GitLab repositories
- Private repo support
- Branch selection
- Security score per repository
- Vulnerability count and grade display
- Last commit information

### 4. CI/CD Pipeline
- Animated 7-stage pipeline visualization
- Per-stage status: Pending / Running / Completed / Failed / Skipped
- Stage-level finding counts
- Pipeline trigger history
- Duration tracking

### 5. Security Scans
- Per-scanner result cards
- Severity-filtered vulnerability table
- CVE/CWE cross-reference
- OWASP category mapping
- False positive marking
- Fix recommendation display

### 6. Risk Engine
Scoring formula:
```
score = 100 - min(critical×25, 60) - min(high×15, 40) - min(medium×7, 25) - min(low×3, 10)

Grade:  A+ (≥95)  A (≥85)  B (≥75)  C (≥60)  D (≥50)  F (<50)
```

### 7. Reports
- Executive Summary — high-level for management
- Developer Report — code-location detail
- Compliance Report — OWASP/NIST mapping
- PDF / CSV / JSON export

### 8. Compliance
- OWASP Top 10 2021 assessment
- CWE mapping per vulnerability
- CVE database cross-reference
- Pass/Fail/N-A status per category

### 9. AI Security Assistant
- Conversational security advisor
- Explains CVEs and CWEs
- Code-level fix suggestions
- Secure coding pattern generation
- OWASP Top 10 guidance
- Markdown + syntax highlighting

### 10. Analytics
- 6-month vulnerability trend
- Scanner findings breakdown chart
- Top vulnerable repositories
- Average fix-time tracking
- Weekly scan activity

### 11. Settings
- Scanner enable/disable toggles
- Pipeline configuration (auto-trigger, deploy blocking)
- Notification channel setup
- API key management
- Theme switching

---

## API Documentation

Interactive Swagger docs at: `http://localhost:8000/api/docs`

### Core Endpoints

```
POST   /api/v1/auth/register          → Create account
POST   /api/v1/auth/login             → Get JWT token
GET    /api/v1/auth/me                → Current user profile

GET    /api/v1/scans/                 → List scans
GET    /api/v1/scans/{id}             → Scan detail
GET    /api/v1/scans/{id}/vulnerabilities → Findings
POST   /api/v1/scans/trigger          → Start pipeline

GET    /api/v1/dashboard/metrics      → Aggregated metrics
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Demo Login

The app runs fully in **demo mode** without a backend — all data is pre-loaded.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@secureci.dev | admin123 |
| Developer | dev@secureci.dev | admin123 |
| Security Engineer | sec@secureci.dev | admin123 |
| Project Manager | pm@secureci.dev | admin123 |

---

## Docker Deployment

```bash
# Development
docker compose up --build

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Services
docker compose ps

# Logs
docker compose logs -f backend
docker compose logs -f celery-worker
```

**Exposed ports:**
- `80` → Nginx (main entry)
- `3000` → Frontend (direct)
- `8000` → Backend API (direct)
- `5432` → PostgreSQL
- `6379` → Redis

---

## Testing

### Backend tests
```bash
cd backend
pytest tests/ -v --tb=short

# With coverage
pytest tests/ --cov=app --cov-report=html
```

### Security engine tests
```bash
cd tests/backend
pytest test_risk_engine.py test_scanners.py -v
```

### Frontend tests
```bash
cd frontend
npm run test
```

### Integration tests
```bash
pytest tests/integration/ -v
```

---

## Architecture

See full [Architecture Document](docs/ARCHITECTURE.md) including:
- System architecture diagram
- Data flow — security scan pipeline
- Authentication flow
- RBAC permission matrix
- Database ER diagram
- Technology decision rationale

---

## GitHub Actions Pipeline

The `.github/workflows/security-pipeline.yml` workflow runs on every push:

1. **Static Analysis** — Bandit + Semgrep on Python source
2. **Secrets Detection** — Gitleaks on full git history
3. **Dependency Scan** — Safety + pip-audit on requirements.txt
4. **Container Scan** — Trivy on built Docker images
5. **Frontend Tests** — Vitest unit tests + production build
6. **Backend Tests** — Pytest with PostgreSQL service
7. **Security Report** — Aggregated findings summary
8. **Deploy** — Triggered only on `main` after all checks pass

---

## Security Features Implemented

- ✅ JWT authentication with expiry
- ✅ bcrypt password hashing (cost factor 12)
- ✅ HTTPS-ready (Nginx TLS termination)
- ✅ Rate limiting (60 req/min API, 10 req/min auth)
- ✅ Security headers (CSP, X-Frame-Options, HSTS)
- ✅ SQL injection prevention (SQLAlchemy parameterized queries)
- ✅ Input validation (Pydantic v2)
- ✅ CORS configuration
- ✅ Audit logging (every user action recorded)
- ✅ Non-root Docker containers
- ✅ Secrets via environment variables only

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**B.Tech Final Year Major Project**
*Security Automation Framework in CI/CD Pipelines*

Built with ❤️ using React, FastAPI, and Python

</div>
