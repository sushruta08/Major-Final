# Crypto Audit Service

A security tool that scans codebases for weak or outdated cryptographic algorithm usage.

## Stack
- Python / FastAPI
- No database (stateless analysis)
- HMAC-SHA256 report signing

## Setup

```bash
pip install -r requirements.txt
export ALLOWED_ORIGINS=http://localhost:3000
uvicorn api.main:app --host 0.0.0.0 --port 8080
```

## Security Design
- All secrets loaded from environment variables
- Strict CORS — only configured origins allowed
- Security headers enforced on all responses (CSP, HSTS, X-Frame-Options)
- Path traversal prevention on all file inputs
- No sensitive data in error responses
- HMAC-SHA256 for report integrity verification
- Constant-time comparison to prevent timing attacks

## Endpoints
- `GET /health` — Health check
- `GET /token` — Issue audit session token
- `POST /audit` — Run cryptographic audit on a repository
