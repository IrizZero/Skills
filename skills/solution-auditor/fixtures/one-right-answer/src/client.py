import httpx

from src.settings import settings


def fetch_rates() -> dict:
    # Timeout is hard-coded today; ops wants it configurable.
    resp = httpx.get("https://rates.example.com/latest", timeout=10)
    resp.raise_for_status()
    return resp.json()
