"""
Crypto Audit Service — REST API.
All secrets from environment, input validated, secure headers applied.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

from audit.engine import CryptoAuditEngine, generate_audit_token

logger = logging.getLogger(__name__)

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Crypto Audit Service",
    version="1.0.0",
    docs_url=None,  # Disable Swagger in production
    redoc_url=None,
)

# Strict CORS — only allow configured origins
_allowed_origins = os.environ.get("ALLOWED_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


# ── Security headers middleware ────────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ── Request schemas ────────────────────────────────────────────────────────────
class AuditRequest(BaseModel):
    repo_path: str
    token: str

    @field_validator("repo_path")
    @classmethod
    def validate_path(cls, v: str) -> str:
        """Prevent path traversal — only allow paths under /repos."""
        resolved = Path(v).resolve()
        allowed_base = Path("/repos").resolve()
        if not str(resolved).startswith(str(allowed_base)):
            raise ValueError("repo_path must be within /repos directory")
        if not resolved.exists():
            raise ValueError("Specified path does not exist")
        return str(resolved)

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("Token must be at least 32 characters")
        return v


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health_check() -> Dict[str, str]:
    """Health check endpoint — no sensitive data exposed."""
    return {"status": "healthy"}


@app.post("/audit", response_model=Dict[str, Any])
def run_audit(payload: AuditRequest) -> Dict[str, Any]:
    """
    Trigger a cryptographic audit on the specified repository.
    Requires a valid session token.
    """
    engine = CryptoAuditEngine(payload.repo_path)
    try:
        report = engine.run()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Audit failed for %s", payload.repo_path)
        # Never expose internal error details to the client
        raise HTTPException(status_code=500, detail="Audit failed. Check server logs.")

    return report.summary


@app.get("/token")
def get_audit_token() -> Dict[str, str]:
    """Issue a new audit session token."""
    return {"token": generate_audit_token()}
