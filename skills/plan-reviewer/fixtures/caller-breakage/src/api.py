from src.auth import validate_token


def handle_request(req):
    if not validate_token(req.token):
        return 401
    return 200
