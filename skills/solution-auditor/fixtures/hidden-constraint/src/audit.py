import json


def record(event: dict) -> None:
    # Today audit events only go to stdout and are lost.
    print(json.dumps(event))
