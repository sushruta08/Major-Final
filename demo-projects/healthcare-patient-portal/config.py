"""
Application configuration — hardcoded secrets (intentionally insecure for demo).
"""

# JWT secret — hardcoded (CWE-798)
JWT_SECRET = "jwt-secret-do-not-share-2024"
JWT_ALGORITHM = "HS256"

# Third-party credentials
SENDGRID_API_KEY = "SG.xxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyy"
GITHUB_OAUTH_SECRET = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GOOGLE_CLIENT_SECRET = "GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Database
MYSQL_ROOT_PASSWORD = "rootpassword123"
REDIS_PASSWORD = "redispass456"

# Debug flags — should be False in production
DEBUG = True
TESTING = True
PROPAGATE_EXCEPTIONS = True  # exposes stack traces to users
