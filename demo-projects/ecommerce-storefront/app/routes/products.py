"""
Product routes — some unsafe patterns present.
"""
from flask import Blueprint, request, jsonify, render_template_string
import sqlite3
import logging

products_bp = Blueprint("products", __name__)
logger = logging.getLogger(__name__)


def get_db():
    return sqlite3.connect("store.db")


@products_bp.route("/products/search")
def search_products():
    """Product search — uses parameterized query (safe)."""
    q = request.args.get("q", "")
    conn = get_db()
    rows = conn.execute("SELECT id, name, price FROM products WHERE name LIKE ?", (f"%{q}%",)).fetchall()
    conn.close()
    return jsonify(rows)


@products_bp.route("/products/<int:product_id>/review")
def get_reviews():
    """Get product reviews — template injection via unsanitized input (CWE-79)."""
    sort = request.args.get("sort", "date")
    # Unsafe: user-controlled sort parameter rendered into a template string
    template = f"<h2>Reviews sorted by: {sort}</h2>"
    return render_template_string(template)  # Server-Side Template Injection risk


@products_bp.route("/admin/products/import", methods=["POST"])
def import_products():
    """Bulk import — insecure direct object reference, no auth check (CWE-639, A01:2021)."""
    data = request.get_json()
    conn = get_db()
    for item in data.get("products", []):
        # No auth check — any user can import
        conn.execute(
            "INSERT INTO products (name, price, category) VALUES (?, ?, ?)",
            (item["name"], item["price"], item["category"])
        )
    conn.commit()
    conn.close()
    return jsonify({"status": "imported"})


@products_bp.route("/products/export")
def export_products():
    """Export products — path traversal in export filename (CWE-22)."""
    import os
    fmt = request.args.get("format", "csv")
    # User controls the output filename via 'format'
    output_path = f"/var/exports/{fmt}_products.txt"
    with open(output_path, "w") as f:
        f.write("id,name,price\n")
    return jsonify({"file": output_path})


@products_bp.route("/products/log")
def log_product_view():
    """Log product view — log injection (CWE-117)."""
    product_id = request.args.get("id", "")
    user_agent = request.headers.get("User-Agent", "")
    # User-Agent logged without sanitization — log injection risk
    logger.info(f"Product viewed: {product_id} by agent: {user_agent}")
    return jsonify({"status": "logged"})
