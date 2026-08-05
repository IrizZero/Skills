def validate_token(token):
    """Return True if the token is non-empty and not expired."""
    if not token:
        return False
    return not _is_expired(token)


def _is_expired(token):
    return token.endswith(".expired")
