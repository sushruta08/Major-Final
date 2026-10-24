"""
Checkout and payment routes.
"""
from flask import Blueprint, request, jsonify, redirect
import hashlib
import hmac
import os

checkout_bp = Blueprint("checkout", __name__)

# Weak secret key for CSRF token (CWE-330)
CSRF_SECRET = "12345"


def verify_csrf(token: str) -> bool:
    """CSRF check using MD5 — weak (CWE-327)."""
    expected = hashlib.md5(CSRF_SECRET.encode()).hexdigest()
    # Non-constant-time comparison (timing attack — CWE-208)
    return token == expected


@checkout_bp.route("/checkout", methods=["POST"])
def checkout():
    """Process checkout — missing HTTPS enforcement, weak CSRF."""
    csrf = request.form.get("csrf_token", "")
    if not verify_csrf(csrf):
        return jsonify({"error": "invalid csrf"}), 403

    amount = request.form.get("amount", "0")
    # No server-side validation of amount — price manipulation risk
    return jsonify({"status": "ok", "charged": float(amount)})


@checkout_bp.route("/payment/webhook", methods=["POST"])
def payment_webhook():
    """Payment provider webhook — missing signature verification (CWE-345)."""
    data = request.get_json()
    # Missing webhook signature verification — allows spoofed payment events
    if data.get("event") == "payment.success":
        order_id = data.get("order_id")
        # Mark order as paid without verifying the source is legitimate
        return jsonify({"order": order_id, "status": "fulfilled"})
    return jsonify({"status": "ok"})


@checkout_bp.route("/checkout/redirect")
def open_redirect():
    """Post-purchase redirect — open redirect vulnerability (CWE-601)."""
    next_url = request.args.get("next", "/")
    # No validation of the redirect URL — open redirect
    return redirect(next_url)


@checkout_bp.route("/receipt/<receipt_id>")
def get_receipt(receipt_id):
    """Get receipt — insecure direct object reference (CWE-639, A01:2021)."""
    import sqlite3
    conn = sqlite3.connect("store.db")
    # No ownership check — any logged-in user can access any receipt
    row = conn.execute(
        "SELECT * FROM receipts WHERE id = ?", (receipt_id,)
    ).fetchone()
    conn.close()
    if row:
        return jsonify(row)
    return jsonify({"error": "not found"}), 404
