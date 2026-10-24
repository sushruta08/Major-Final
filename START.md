# 🚀 Quick Start — SecureCI

## Prerequisites
- Python 3.11+
- Node.js 20+

---

## Step 1 — Install backend dependencies
```bash
cd backend
pip install fastapi==0.115.0 uvicorn==0.32.0 sqlalchemy psycopg2-binary python-jose passlib bcrypt python-multipart pydantic-settings starlette==0.38.6
```

## Step 2 — Start backend (Terminal 1)
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
> Database tables + SQLite file created automatically on first run.

## Step 3 — Seed demo data (Terminal 2, run once)
```bash
cd backend
python -c "
from app.db.base import engine, Base
from app.db.models import User, Project, Repository, Pipeline, Scan, Vulnerability, Notification, AuditLog, Report
from app.core.security import hash_password
from sqlalchemy.orm import sessionmaker
import uuid

Base.metadata.create_all(bind=engine)
db = sessionmaker(bind=engine)()

users = [
  ('admin@secureci.dev','admin','Alex Admin','admin',True),
  ('dev@secureci.dev','john_dev','John Developer','developer',False),
  ('sec@secureci.dev','sarah_sec','Sarah Security','security_engineer',False),
  ('pm@secureci.dev','mike_pm','Mike Manager','project_manager',False),
]
for email,username,full_name,role,sup in users:
  if not db.query(User).filter(User.email==email).first():
    db.add(User(email=email,username=username,full_name=full_name,role=role,hashed_password=hash_password('admin123'),is_superuser=sup))
db.commit()

proj = Project(name='E-Commerce Platform',description='Main app',owner_id=db.query(User).filter(User.email=='admin@secureci.dev').first().id,security_score=72.0,grade='B')
db.add(proj); db.flush()
repo = Repository(project_id=proj.id,name='ecommerce-api',url='https://github.com/org/ecommerce-api',provider='github',default_branch='main',is_private=True,security_score=72.0,grade='B')
db.add(repo)
db.commit()
print('Seeded! Login: admin@secureci.dev / admin123')
"
```

## Step 4 — Install frontend & start (Terminal 3)
```bash
cd frontend
npm install
npm run dev
```

---

## Access
| Service | URL |
|---------|-----|
| **App** | http://localhost:3000 |
| **API Swagger Docs** | http://localhost:8000/api/docs |
| **Health Check** | http://localhost:8000/health |

## Demo Accounts (password: `admin123`)
| Role | Email |
|------|-------|
| Admin | admin@secureci.dev |
| Developer | dev@secureci.dev |
| Security Engineer | sec@secureci.dev |
| Project Manager | pm@secureci.dev |

---

## Trigger Your First Security Scan
1. Login → Go to **Repositories** → Click **Connect Repository**
2. Select a project, enter any GitHub URL, click **Connect**
3. Go to **Pipelines** → Click **Trigger Pipeline** → Select repo → **Start Pipeline**
4. Watch real-time results in **Scans** and **Dashboard**

## Docker (Full Stack)
```bash
docker compose up --build
```
