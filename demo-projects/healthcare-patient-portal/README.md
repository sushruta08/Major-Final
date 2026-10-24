# Healthcare Patient Portal

A web portal for managing patient records and clinical data.

## Stack
- Python / Flask
- SQLite (dev), PostgreSQL (prod)
- JWT authentication

## Setup

```bash
pip install -r requirements.txt
python app.py
```

## Endpoints
- `GET /patient/search?name=<name>` — Search patients
- `POST /login` — Authenticate users
- `GET /admin/report?type=<type>` — Generate admin reports
- `GET /patient/file?file=<filename>` — Download patient documents

## Notes
- Requires Python 3.8+
- See `config.py` for configuration options
