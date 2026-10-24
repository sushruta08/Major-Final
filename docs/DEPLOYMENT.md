# SecureCI — Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

---

## Development Deployment

### Option 1: Full Docker (Recommended)

```bash
# Clone repo
git clone https://github.com/yourusername/secureci.git
cd secureci

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start all services
docker compose up --build

# App is available at:
# Frontend:  http://localhost:3000
# API:       http://localhost:8000/api/docs
# Nginx:     http://localhost:80
```

### Option 2: Local Development

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env

# Start DB and Redis in Docker
docker compose up -d postgres redis

# Seed database
python ../scripts/seed_db.py

# Run API
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

**Terminal 3 — Celery Worker (optional):**
```bash
cd backend
source venv/bin/activate
celery -A app.workers.celery_app worker --loglevel=info
```

---

## Production Deployment

### Environment Setup

```bash
# Production .env
SECRET_KEY=<64-character-random-string>
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:pass@db-host:5432/secureci
REDIS_URL=redis://:password@redis-host:6379/0
ALLOWED_ORIGINS=["https://yourdomain.com"]
```

Generate a secure key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Docker Production Stack

```bash
# Build and deploy
docker compose -f docker-compose.yml up -d --build

# Run database migrations
docker compose exec backend python scripts/seed_db.py

# Check all services are healthy
docker compose ps

# View logs
docker compose logs -f backend
```

### Nginx SSL Configuration

Add to `docker/nginx/nginx.conf`:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ...
}
```

Mount certificates:
```bash
mkdir -p docker/nginx/certs
cp /path/to/fullchain.pem docker/nginx/certs/
cp /path/to/privkey.pem docker/nginx/certs/
```

---

## Database Migrations

```bash
# Apply all migrations
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "add new table"

# Rollback one step
alembic downgrade -1
```

---

## Health Monitoring

```bash
# Check API health
curl http://localhost:8000/health

# Check all container health
docker compose ps

# Database connection test
docker compose exec postgres pg_isready -U secureci
```

---

## Backup & Recovery

```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U secureci secureci > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20240315.sql | docker compose exec -T postgres psql -U secureci secureci
```

---

## Service Ports

| Service   | Internal Port | External Port | Notes              |
|-----------|--------------|---------------|--------------------|
| Nginx     | 80, 443      | 80, 443       | Main entry point   |
| Frontend  | 3000         | 3000          | React dev server   |
| Backend   | 8000         | 8000          | FastAPI + Uvicorn  |
| PostgreSQL| 5432         | 5432          | Primary DB         |
| Redis     | 6379         | 6379          | Cache + Queue      |
