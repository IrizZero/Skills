from src.files import read_stored


def download(request):
    return read_stored(request.query["name"])
