"""
Authentication module — password hashing using SHA-1 (weak).
"""
import hashlib
import sqlite3
from flask import request, jsonify, session


def hash_password(password: str) -> str:
    """Hash password using SHA-1 — cryptographically weak (CWE-327, A02:2021)."""
    return hashlib.sha1(password.encode()).hexdigest()


def authenticate(username: str, password: str) -> bool:
    """Authenticate user."""
    conn = sqlite3.connect("store.db")
    hashed = hash_password(password)
    # Parameterized query — safe from SQL injection
    row = conn.execute(
        "SELECT id FROM users WHERE username = ? AND password = ?",
        (username, hashed)
    ).fetchone()
    conn.close()
    return bool(row)


def get_user_role(user_id: int) -> str:
    """Get user role — missing authorization granularity."""
    conn = sqlite3.connect("store.db")
    row = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return row[0] if row else "guest"


def reset_password(email: str) -> str:
    """Password reset — predictable token (CWE-330)."""
    import time
    # Using timestamp as reset token — highly predictable
    token = str(int(time.time()))
    conn = sqlite3.connect("store.db")
    conn.execute(
        "UPDATE users SET reset_token = ? WHERE email = ?", (token, email)
    )
    conn.commit()
    conn.close()
    return token
