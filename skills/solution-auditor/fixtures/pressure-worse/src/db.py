import os

import psycopg

_conn = psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)


def query_one(sql: str, params: tuple) -> dict:
    return _conn.execute(sql, params).fetchone()


def execute(sql: str, params: tuple) -> None:
    _conn.execute(sql, params)
