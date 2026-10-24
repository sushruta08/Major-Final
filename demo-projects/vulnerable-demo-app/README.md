# Vulnerable Demo App (Educational Only)

WARNING: This repository intentionally contains insecure patterns for educational and defensive testing purposes only. Do NOT run this code on any production, public-facing, or sensitive system. Run only inside an isolated VM or container.

Contents:
- `insecure_server.py` — small Flask app exposing multiple insecure endpoints (SQL injection, command injection, unsafe deserialization, unsafe eval).
- `init_db.py` — creates a tiny SQLite database used by the demo.
- `config.py` — contains hard-coded credentials and insecure settings.
- `requirements.txt` — intentionally outdated/vulnerable package versions.

How to run safely (recommended):
1. Create an isolated Python environment or use a disposable VM/container.
2. Install requirements: `python -m pip install -r requirements.txt`
3. Initialize DB: `python init_db.py`
4. Run the server: `python insecure_server.py`

Do not expose the server to the public internet.
