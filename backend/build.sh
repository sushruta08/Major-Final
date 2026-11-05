#!/usr/bin/env bash
# ============================================================
# Render build script — runs inside the backend/ directory
# 1. Creates all DB tables
# 2. Seeds demo data (skips if admin user already exists)
# ============================================================
set -e

echo "==> Installing dependencies..."
pip install -r requirements.txt

echo "==> Creating database tables..."
python - <<'PYEOF'
import sys
sys.path.insert(0, '.')
from app.db.base import engine, Base
from app.db.models import User, Project, Repository, Pipeline, Scan, Vulnerability
from app.db.models import Notification, AuditLog, Report
Base.metadata.create_all(bind=engine)
print("Tables ready.")
PYEOF

echo "==> Seeding demo data..."
python - <<'PYEOF'
import sys, os, uuid, random
sys.path.insert(0, '.')
from datetime import datetime, timedelta
from app.db.base import SessionLocal, engine, Base
from app.db.models.user import User
from app.db.models.project import Project, Repository, Pipeline, Scan, Vulnerability
from app.core.security import hash_password

db = SessionLocal()

# Skip if already seeded
if db.query(User).filter(User.email == "admin@secureci.dev").first():
    print("Already seeded — skipping.")
    db.close()
    sys.exit(0)

# ── Users ──────────────────────────────────────────────────
users_data = [
    {"email": "admin@secureci.dev",  "username": "admin",     "full_name": "Alex Admin",     "role": "admin",            "password": "admin123"},
    {"email": "dev@secureci.dev",    "username": "john_dev",  "full_name": "John Developer",  "role": "developer",        "password": "admin123"},
    {"email": "sec@secureci.dev",    "username": "sarah_sec", "full_name": "Sarah Security",  "role": "security_engineer","password": "admin123"},
    {"email": "pm@secureci.dev",     "username": "mike_pm",   "full_name": "Mike Manager",    "role": "project_manager",  "password": "admin123"},
]
created_users = []
for u in users_data:
    user = User(
        email=u["email"], username=u["username"], full_name=u["full_name"],
        role=u["role"], hashed_password=hash_password(u["password"]),
        is_superuser=(u["role"] == "admin"),
    )
    db.add(user)
    db.flush()
    created_users.append(user)
    print(f"  + User: {u['username']}")
db.commit()

admin = db.query(User).filter(User.email == "admin@secureci.dev").first()

# ── Projects ───────────────────────────────────────────────
projects_data = [
    {"name": "E-Commerce Platform", "description": "Main storefront and API services",   "score": 72, "grade": "B"},
    {"name": "Payment Gateway",     "description": "Secure payment processing service",  "score": 88, "grade": "A"},
    {"name": "Analytics Dashboard", "description": "Business intelligence platform",     "score": 61, "grade": "C"},
]
created_projects = []
for p in projects_data:
    proj = Project(name=p["name"], description=p["description"],
                   owner_id=admin.id, security_score=p["score"], grade=p["grade"])
    db.add(proj)
    db.flush()
    created_projects.append(proj)
    print(f"  + Project: {p['name']}")
db.commit()

# ── Repositories ───────────────────────────────────────────
repos_data = [
    {"name": "ecommerce-frontend", "url": "https://github.com/org/ecommerce-frontend", "project": 0, "score": 75,  "grade": "B",  "vulns": 12},
    {"name": "ecommerce-api",      "url": "https://github.com/org/ecommerce-api",      "project": 0, "score": 82,  "grade": "A",  "vulns": 8},
    {"name": "payment-service",    "url": "https://github.com/org/payment-service",    "project": 1, "score": 94,  "grade": "A+", "vulns": 3},
    {"name": "analytics-core",     "url": "https://github.com/org/analytics-core",     "project": 2, "score": 61,  "grade": "C",  "vulns": 9},
]
created_repos = []
for r in repos_data:
    repo = Repository(
        project_id=created_projects[r["project"]].id, name=r["name"], url=r["url"],
        provider="github", default_branch="main", is_private=True,
        scan_count=random.randint(10, 40), vulnerability_count=r["vulns"],
        security_score=r["score"], grade=r["grade"],
    )
    db.add(repo)
    db.flush()
    created_repos.append(repo)
    print(f"  + Repository: {r['name']}")
db.commit()

# ── Pipelines + Scans + Vulnerabilities ────────────────────
vuln_samples = [
    {"title": "SQL Injection in login",      "severity": "critical", "scanner": "bandit",  "file_path": "app/auth.py",          "line_number": 45,  "cve_id": "CVE-2024-1001", "owasp_category": "A03:2021", "cvss_score": 9.8},
    {"title": "Hardcoded AWS secret key",    "severity": "critical", "scanner": "gitleaks","file_path": "config/aws.py",         "line_number": 12,  "owasp_category": "A02:2021","cvss_score": 9.1},
    {"title": "Django version vulnerable",   "severity": "high",     "scanner": "safety",  "cve_id": "CVE-2023-41164",           "cvss_score": 7.5},
    {"title": "Path traversal in upload",    "severity": "high",     "scanner": "semgrep", "file_path": "app/upload.py",         "line_number": 88,  "cwe_id": "CWE-22",         "owasp_category": "A01:2021","cvss_score": 8.6},
    {"title": "Missing security headers",    "severity": "medium",   "scanner": "semgrep", "file_path": "middleware.py",         "line_number": 15,  "owasp_category": "A05:2021","cvss_score": 5.3},
    {"title": "Vulnerable container image",  "severity": "high",     "scanner": "trivy",   "file_path": "Dockerfile",            "cve_id": "CVE-2024-0567","cvss_score": 7.8},
    {"title": "Weak password hashing",       "severity": "high",     "scanner": "bandit",  "file_path": "app/models.py",         "line_number": 32,  "cwe_id": "CWE-327",        "owasp_category": "A02:2021"},
    {"title": "XSS in user profile",         "severity": "medium",   "scanner": "semgrep", "file_path": "templates/profile.html","line_number": 22,  "cwe_id": "CWE-79",         "owasp_category": "A03:2021"},
]

for i, repo in enumerate(created_repos[:2]):
    pipeline = Pipeline(
        repository_id=repo.id, trigger="push", branch="main",
        commit_sha=f"a{i}b{i}c{i}d{i}e{i}f{i}0000000",
        commit_message=f"feat: latest changes for {repo.name}",
        status="completed",
        started_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
        completed_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 60)),
        duration=random.randint(300, 900), triggered_by="john_dev",
    )
    db.add(pipeline)
    db.flush()
    for scanner in ["bandit", "gitleaks", "safety", "semgrep", "trivy"]:
        scan = Scan(
            pipeline_id=pipeline.id, repository_id=repo.id, scanner_type=scanner,
            status="completed",
            started_at=pipeline.started_at, completed_at=pipeline.completed_at,
            duration=random.randint(30, 180),
            critical=random.randint(0, 2), high=random.randint(0, 4),
            medium=random.randint(0, 5),   low=random.randint(0, 6),
            score=random.uniform(60, 95),
        )
        scan.total_findings = scan.critical + scan.high + scan.medium + scan.low
        db.add(scan)
        db.flush()
        for v in random.sample(vuln_samples, min(3, len(vuln_samples))):
            vuln = Vulnerability(
                scan_id=scan.id, title=v["title"],
                description=f"Security issue detected by {scanner}: {v['title']}",
                severity=v["severity"], scanner=scanner,
                file_path=v.get("file_path"), line_number=v.get("line_number"),
                cve_id=v.get("cve_id"), cwe_id=v.get("cwe_id"),
                owasp_category=v.get("owasp_category"), cvss_score=v.get("cvss_score"),
                status=random.choice(["open", "open", "open", "fixed"]),
            )
            db.add(vuln)
    print(f"  + Pipeline + Scans: {repo.name}")

db.commit()
db.close()
print("Demo data seeded successfully.")
PYEOF

echo "==> Build complete."
