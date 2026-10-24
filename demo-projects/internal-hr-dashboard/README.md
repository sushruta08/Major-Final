# Internal HR Dashboard

Internal tool for managing employees, leave requests, and payroll data.

## Stack
- Python / FastAPI
- SQLAlchemy ORM
- JWT (HS256) + bcrypt

## Setup

```bash
pip install -r requirements.txt
export SECRET_KEY=$(openssl rand -hex 32)
export DATABASE_URL=sqlite:///hr.db
uvicorn app.main:app --reload
```

## Security Notes
- All passwords hashed with bcrypt
- JWT tokens expire after 8 hours
- Role-based access control on all sensitive endpoints
- All DB queries use parameterized statements via SQLAlchemy ORM
