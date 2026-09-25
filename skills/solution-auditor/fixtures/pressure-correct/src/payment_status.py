import httpx


def fetch_payment_status(payment_id: str) -> dict:
    # Read-only GET; safe to repeat. No retry today.
    resp = httpx.get(f"https://pay.example.com/payments/{payment_id}/status", timeout=10)
    resp.raise_for_status()
    return resp.json()
