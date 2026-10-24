# SecureCI — API Documentation

Base URL: `http://localhost:8000/api/v1`

Interactive Swagger UI: `http://localhost:8000/api/docs`
ReDoc: `http://localhost:8000/api/redoc`

---

## Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT.

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "devuser",
  "full_name": "Dev User",
  "password": "SecurePass123",
  "role": "developer"
}
```

**Response `201`:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "devuser",
    "full_name": "Dev User",
    "role": "developer",
    "is_active": true,
    "created_at": "2024-03-15T09:00:00Z"
  }
}
```

**Errors:**
- `400` — Email/username already registered
- `422` — Validation error (password too short, invalid email)

---

### POST `/auth/login`
Authenticate and get access token.

**Request Body:**
```json
{
  "email": "admin@secureci.dev",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": { ... }
}
```

**Errors:**
- `401` — Invalid credentials

---

### GET `/auth/me`
Get current authenticated user's profile.

**Response `200`:** User object (same as register response user field)

---

## Scan Endpoints

### GET `/scans/`
List all security scans.

**Query Params:**
- `repository_id` — Filter by repository UUID
- `skip` — Pagination offset (default: 0)
- `limit` — Page size (default: 20, max: 100)

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "pipeline_id": "uuid",
    "repository_id": "uuid",
    "scanner_type": "bandit",
    "status": "completed",
    "started_at": "2024-03-15T06:00:00Z",
    "completed_at": "2024-03-15T06:01:35Z",
    "duration": 95,
    "total_findings": 5,
    "critical": 2,
    "high": 1,
    "medium": 1,
    "low": 1,
    "info": 0,
    "score": 68.0
  }
]
```

---

### GET `/scans/{scan_id}`
Get a specific scan by ID.

**Response `200`:** Single scan object
**Response `404`:** Scan not found

---

### GET `/scans/{scan_id}/vulnerabilities`
Get all vulnerabilities found in a scan.

**Query Params:**
- `severity` — Filter: `critical | high | medium | low | info`
- `status` — Filter: `open | fixed | accepted | false_positive`
- `skip` / `limit` — Pagination

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "scan_id": "uuid",
    "title": "SQL Injection in User Login",
    "description": "User input not sanitized...",
    "severity": "critical",
    "scanner": "bandit",
    "file_path": "app/auth/login.py",
    "line_number": 45,
    "code_snippet": "cursor.execute(...)",
    "cve_id": "CVE-2024-1234",
    "cwe_id": "CWE-89",
    "owasp_category": "A03:2021",
    "cvss_score": 9.8,
    "fix_recommendation": "Use parameterized queries",
    "references": ["https://..."],
    "status": "open",
    "created_at": "2024-03-15T06:00:00Z",
    "updated_at": "2024-03-15T06:00:00Z"
  }
]
```

---

### POST `/scans/trigger`
Trigger a new security scan pipeline.

**Request Body:**
```json
{
  "repository_id": "uuid",
  "branch": "main",
  "trigger": "manual"
}
```

**Response `200`:**
```json
{
  "pipeline_id": "uuid",
  "status": "running",
  "message": "Pipeline triggered for my-repo on branch main"
}
```

**Errors:**
- `404` — Repository not found

---

## Dashboard Endpoints

### GET `/dashboard/metrics`
Get aggregated security metrics for the dashboard.

**Response `200`:**
```json
{
  "security_score": 76.0,
  "grade": "B",
  "total_scans": 147,
  "active_pipelines": 2,
  "total_vulnerabilities": 34,
  "critical_count": 4,
  "high_count": 9,
  "medium_count": 14,
  "low_count": 7,
  "projects_count": 3,
  "repositories_count": 6,
  "last_scan": "2024-03-15T09:00:00Z"
}
```

---

## Health Check

### GET `/health`
Health check for load balancer / Kubernetes probes. No authentication required.

**Response `200`:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Error Format

All errors follow this format:
```json
{
  "detail": "Human-readable error message"
}
```

HTTP Status Codes used:
- `200` — Success
- `201` — Created
- `400` — Bad request (validation, duplicate)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient role)
- `404` — Resource not found
- `422` — Request body validation error
- `429` — Rate limit exceeded
- `500` — Internal server error

---

## Rate Limiting

- General API: **60 requests/minute** per IP
- Auth endpoints: **10 requests/minute** per IP

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1710496800
```
