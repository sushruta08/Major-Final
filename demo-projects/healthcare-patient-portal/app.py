"""
Healthcare Patient Portal — Main Application
WARNING: This file intentionally contains multiple critical security vulnerabilities
for demonstration and security scanning purposes.
"""
import os
import pickle
import sqlite3
import subprocess
from flask import Flask, request, jsonify, session
import hashlib

app = Flask(__name__)
app.secret_key = "supersecretkey123"  # hardcoded secret key (CWE-798)

# Hardcoded database credentials (CWE-798, A02:2021)
DB_HOST = "prod-db.internal"
DB_USER = "root"
DB_PASS = "Admin@123456"  # hardcoded password
DB_NAME = "patients"

# Hardcoded API keys (secret leakage)
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN = "1234567890abcdef1234567890abcdef"
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
STRIPE_SECRET_KEY = "sk_live_BQokikJOvBiI2HlWgH4olfQ2"


def get_db():
    conn = sqlite3.connect("patients.db")
    return conn


@app.route("/patient/search")
def search_patient():
    """Search patients by name — SQL injection vulnerability (CWE-89, A03:2021)."""
    name = request.args.get("name", "")
    ssn = request.args.get("ssn", "")
    # Directly interpolating user input into SQL — critical SQL injection
    query = f"SELECT * FROM patients WHERE name = '{name}' OR ssn = '{ssn}'"
    conn = get_db()
    result = conn.execute(query).fetchall()
    conn.close()
    return jsonify(result)


@app.route("/admin/report")
def generate_report():
    """Generate system report — command injection (CWE-78, A03:2021)."""
    report_type = request.args.get("type", "daily")
    # Direct OS command injection with user input
    output = subprocess.check_output(f"python reports/{report_type}.py", shell=True)
    return output


@app.route("/patient/import", methods=["POST"])
def import_patient_data():
    """Import patient records — unsafe deserialization (CWE-502, A08:2021)."""
    data = request.get_data()
    # Unsafe pickle deserialization — allows arbitrary code execution
    obj = pickle.loads(data)
    return jsonify({"imported": str(obj)})


@app.route("/admin/exec")
def admin_exec():
    """Admin utility endpoint — remote code execution via eval (CWE-95)."""
    expr = request.args.get("expr", "")
    result = eval(expr)  # completely unsafe eval of user input
    return jsonify({"result": result})


@app.route("/login", methods=["POST"])
def login():
    """Login with MD5 password hashing (CWE-327 — weak cryptography)."""
    username = request.form.get("username")
    password = request.form.get("password")
    # MD5 is cryptographically broken for passwords
    hashed = hashlib.md5(password.encode()).hexdigest()
    conn = get_db()
    # SQL injection in login
    row = conn.execute(
        f"SELECT * FROM users WHERE username='{username}' AND password='{hashed}'"
    ).fetchone()
    conn.close()
    if row:
        session["user"] = username
        return jsonify({"status": "ok"})
    return jsonify({"status": "failed"}), 403


@app.route("/patient/file")
def download_file():
    """Download patient document — path traversal (CWE-22, A01:2021)."""
    filename = request.args.get("file", "")
    # No path sanitization — allows traversal to read any file on the system
    base = "/var/app/patient_docs"
    path = os.path.join(base, filename)
    with open(path, "r") as f:
        return f.read()


@app.route("/debug/env")
def debug_env():
    """Debug endpoint exposing all environment variables (sensitive data leak)."""
    # Should never be exposed in production
    return jsonify(dict(os.environ))


if __name__ == "__main__":
    # Debug mode enabled in production (CWE-94 / A05:2021)
    app.run(host="0.0.0.0", port=5000, debug=True)
