# Plan: inject the expiry clock into token validation

## Goal

Make token expiry testable by passing the current time in explicitly instead of
relying on a hidden clock.

## Affected files

- src/auth.py

## Steps

1. Rename `validate_token(token)` to `verify_token(token, now)`.
2. Update `_is_expired` to compare the token's embedded timestamp against `now`.
3. Add unit tests in `tests/test_auth.py` covering expired and live tokens.
