import os

STORAGE_DIR = "/var/app/storage"


def read_stored(name):
    """Read a file from the storage dir by its basename only."""
    safe = os.path.basename(name)
    with open(os.path.join(STORAGE_DIR, safe), "rb") as f:
        return f.read()
