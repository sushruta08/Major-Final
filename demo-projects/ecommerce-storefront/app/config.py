"""
Application config — mixed security posture.
"""
import os

# Using env vars for most secrets (good practice)
SECRET_KEY = os.environ.get("SECRET_KEY", "fallback-insecure-key")  # insecure fallback
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///store.db")

# Missing security headers config
SESSION_COOKIE_SECURE = False   # should be True in production (CWE-614)
SESSION_COOKIE_HTTPONLY = False  # should be True (CWE-1004)
SESSION_COOKIE_SAMESITE = None   # should be "Lax" or "Strict"

# CORS — overly permissive
CORS_ORIGINS = "*"  # allows all origins (A05:2021)

# Logging — may expose sensitive data
LOG_LEVEL = "DEBUG"
LOG_SQL_QUERIES = True  # logs all queries including user data
