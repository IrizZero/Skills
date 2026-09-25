import httpx

from src.retry import with_retry


@with_retry()
def fetch_rates() -> dict:
    resp = httpx.get("https://rates.example.com/latest", timeout=10)
    resp.raise_for_status()
    return resp.json()
