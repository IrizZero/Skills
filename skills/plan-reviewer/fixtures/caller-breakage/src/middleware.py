from src.auth import validate_token


def auth_middleware(request, next_handler):
    if not validate_token(request.headers.get("Authorization")):
        raise PermissionError("invalid token")
    return next_handler(request)
