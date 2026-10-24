"""
Database module — hardcoded credentials and unsafe queries.
"""
import sqlite3
import os

# Hardcoded credentials — never do this (CWE-798)
DATABASE_URL = "postgresql://admin:Admin@1234@prod-db.healthcare.internal:5432/patients"
BACKUP_DB_PASS = "b@ckup_p@ss_2024"
ENCRYPTION_KEY = "3d9f4b2e1a8c7d6e5f4a3b2c1d0e9f8a"  # AES key in source (CWE-321)


def raw_query(user_input: str):
    """Execute raw query with no parameterization — SQL injection (CWE-89)."""
    conn = sqlite3.connect("patients.db")
    cur = conn.cursor()
    # Intentional SQL injection sink
    cur.execute("SELECT * FROM records WHERE id = " + user_input)
    return cur.fetchall()


def get_patient_notes(patient_id, category):
    """Second-order SQL injection example."""
    conn = sqlite3.connect("patients.db")
    # String formatting directly into SQL
    query = "SELECT notes FROM clinical_notes WHERE patient_id = %s AND category = '%s'" % (patient_id, category)
    return conn.execute(query).fetchall()


def write_audit_log(action, user):
    """Log to file using user-controlled path (CWE-73 — external control of filename)."""
    log_dir = os.environ.get("LOG_DIR", "/var/log/app")
    # user-controlled 'user' value used directly in filename
    log_file = os.path.join(log_dir, f"{user}.log")
    with open(log_file, "a") as f:
        f.write(f"{action}\n")
