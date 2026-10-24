# DevOps Config Toolkit

A collection of automation scripts for deployment, backup, and health monitoring.

## Scripts

- `scripts/deploy.py` — Kubernetes deployment automation
- `scripts/backup.py` — PostgreSQL backup to S3
- `scripts/health_check.py` — Service health monitoring and alerting

## Environment Variables

```bash
export DATABASE_URL=postgresql://user:pass@host:5432/db
export SECRET_KEY=<strong-random-key>
export BACKUP_BUCKET=s3://your-bucket/backups
export SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## Usage

```bash
pip install -r requirements.txt
python scripts/health_check.py
python scripts/backup.py
```
