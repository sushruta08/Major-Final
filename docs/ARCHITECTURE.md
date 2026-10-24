# SecureCI — Architecture Document

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                    ┌──────▼──────┐
                    │    Nginx    │  Reverse Proxy + SSL Termination
                    │  (Port 80)  │  Rate Limiting + Security Headers
                    └──────┬──────┘
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼──────┐          ┌───────▼──────┐
       │  React SPA  │          │  FastAPI API  │
       │ (Port 3000) │          │  (Port 8000)  │
       │  TypeScript │          │    Python 3.11│
       │  Tailwind   │          │  SQLAlchemy   │
       └─────────────┘          └───────┬───────┘
                                        │
              ┌─────────────────────────┼──────────────────────┐
              │                         │                        │
       ┌──────▼──────┐         ┌────────▼───────┐    ┌─────────▼──────┐
       │ PostgreSQL  │         │     Redis       │    │ Celery Worker  │
       │  (Port 5432)│         │  (Port 6379)    │    │ Background Jobs│
       │  Database   │         │  Cache + Queue  │    │ Security Scans │
       └─────────────┘         └─────────────────┘    └────────────────┘
                                                               │
                                                    ┌──────────▼─────────┐
                                                    │  Security Engine   │
                                                    │  ┌──────────────┐  │
                                                    │  │   Bandit     │  │
                                                    │  │   Semgrep    │  │
                                                    │  │   Trivy      │  │
                                                    │  │   Gitleaks   │  │
                                                    │  │   Safety     │  │
                                                    │  └──────────────┘  │
                                                    └────────────────────┘
```

## Module Structure

### Frontend (`/frontend`)
```
src/
├── App.tsx                 # Root router
├── main.tsx               # Entry point
├── index.css              # Global styles (Tailwind)
├── components/
│   ├── ui/                # Reusable atoms (Button, Card, Badge, Input…)
│   ├── layout/            # AppLayout, Sidebar, Topbar
│   ├── dashboard/         # MetricCard, SecurityScore, PipelineVisual
│   └── charts/            # Recharts wrappers
├── pages/                 # 18 route pages
├── store/                 # Zustand state (auth, ui)
├── hooks/                 # React Query data hooks
├── services/              # Axios API client
├── types/                 # TypeScript interfaces
└── utils/                 # mockData, formatters, cn()
```

### Backend (`/backend`)
```
app/
├── main.py                # FastAPI app, CORS, middleware
├── core/
│   ├── config.py          # Pydantic settings from .env
│   └── security.py        # JWT + bcrypt utilities
├── api/v1/
│   └── endpoints/
│       ├── auth.py        # Register, Login, /me
│       ├── scans.py       # Scan CRUD + trigger
│       └── dashboard.py   # Aggregated metrics
├── db/
│   ├── base.py            # SQLAlchemy engine + session
│   └── models/            # User, Project, Repo, Pipeline, Scan, Vuln
├── schemas/               # Pydantic request/response models
├── services/              # ReportService, NotificationService
└── workers/               # Celery tasks + app config
```

### Security Engine (`/security-engine`)
```
scanners/
├── bandit_scanner.py      # Python SAST
├── semgrep_scanner.py     # Multi-language SAST
├── trivy_scanner.py       # Container scanning
├── safety_scanner.py      # Python dependency CVE check
└── gitleaks_scanner.py    # Secret detection
parsers/
└── result_parser.py       # Normalize all scanner output
risk_engine/
└── risk_calculator.py     # Score, grade, risk level
pipeline_runner.py         # Orchestrates full pipeline
```

## Data Flow — Security Scan Pipeline

```
Developer pushes code
        │
        ▼
  GitHub Webhook ──► FastAPI /webhook
        │
        ▼
  Pipeline Created (DB)
        │
        ▼
  Celery Task Dispatched ──► Redis Queue
        │
        ▼
  Security Engine runs:
  [Bandit] → [Semgrep] → [Gitleaks] → [Safety] → [Trivy]
        │
        ▼
  Results normalized via result_parser.py
        │
        ▼
  Risk Engine calculates score/grade
        │
        ▼
  Vulnerabilities stored in PostgreSQL
        │
        ▼
  Notifications dispatched (Slack/Email/Discord)
        │
        ▼
  Dashboard updated via React Query polling
```

## Security Architecture

### Authentication Flow
```
Client → POST /auth/login → FastAPI
                              │
                              ▼
                    Verify bcrypt hash
                              │
                              ▼
                    Create JWT (HS256, 24h)
                              │
                              ▼
                    Return {access_token, user}
                              │
Client stores token in Zustand (persisted)
                              │
Client → GET /api/* 
         Authorization: Bearer <token>
                              │
                              ▼
               FastAPI OAuth2PasswordBearer
                              │
                              ▼
               Decode JWT → user_id → DB lookup
```

### RBAC Permissions
| Action                  | Admin | Security Eng | Developer | PM |
|-------------------------|-------|--------------|-----------|-----|
| View Dashboard          | ✅    | ✅           | ✅        | ✅  |
| Trigger Scan            | ✅    | ✅           | ✅        | ❌  |
| Delete Vulnerabilities  | ✅    | ✅           | ❌        | ❌  |
| Manage Users            | ✅    | ❌           | ❌        | ❌  |
| Generate Reports        | ✅    | ✅           | ✅        | ✅  |
| Configure Scanners      | ✅    | ✅           | ❌        | ❌  |
| Manage API Keys         | ✅    | ❌           | ❌        | ❌  |

## Database ER Diagram (simplified)

```
users
  └── projects (owner_id)
        └── project_members (project_id, user_id)
        └── repositories (project_id)
              └── pipelines (repository_id)
                    └── scans (pipeline_id)
                          └── vulnerabilities (scan_id)
              └── scanner_configs (project_id)
  └── notifications (user_id)
  └── notification_settings (user_id)
  └── audit_logs (user_id)
  └── reports (created_by)
```

## Technology Decisions

| Concern              | Choice            | Rationale                                    |
|----------------------|-------------------|----------------------------------------------|
| Frontend Framework   | React 18 + Vite   | Fast HMR, TypeScript-first, large ecosystem  |
| State Management     | Zustand           | Lightweight, no boilerplate, persists easily |
| Server State         | TanStack Query    | Caching, refetching, loading states built-in |
| Styling              | Tailwind CSS      | Utility-first, consistent design tokens      |
| Animations           | Framer Motion     | Declarative, performant GPU animations       |
| Charts               | Recharts          | React-native, composable, responsive         |
| API Framework        | FastAPI           | Auto-docs, async, Pydantic validation        |
| ORM                  | SQLAlchemy 2.0    | Mature, type-safe, migration support         |
| Task Queue           | Celery + Redis    | Distributed scan execution, scheduling       |
| Auth                 | JWT + bcrypt      | Stateless, industry standard                 |
| Container Scanning   | Trivy             | Best OSS scanner, k8s native                 |
| SAST (Python)        | Bandit + Semgrep  | Complementary — Bandit for Python specifics  |
| Secret Scanning      | Gitleaks          | Git-aware, fast, low false positives         |
