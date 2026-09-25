import functools
import time

import httpx


def with_retry(tries: int = 3, backoff: float = 0.5, retry_on=(httpx.TransportError,)):
    """Retry idempotent calls on network errors with linear backoff."""

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, tries + 1):
                try:
                    return fn(*args, **kwargs)
                except retry_on:
                    if attempt == tries:
                        raise
                    time.sleep(backoff * attempt)

        return wrapper

    return decorator
