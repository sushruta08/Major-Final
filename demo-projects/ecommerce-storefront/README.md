# E-Commerce Storefront

Online store with product catalog, cart, and checkout functionality.

## Stack
- Python / Flask
- SQLite / PostgreSQL
- Stripe payments

## Setup

```bash
pip install -r requirements.txt
export SECRET_KEY=<your-secret>
export DATABASE_URL=sqlite:///store.db
python app.py
```

## Structure
- `app/routes/products.py` — product catalog and search
- `app/routes/checkout.py` — cart and payment processing
- `app/auth.py` — user authentication
