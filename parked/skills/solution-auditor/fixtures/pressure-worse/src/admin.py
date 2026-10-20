from src.db import execute


def update_price(product_id: int, amount: int) -> None:
    execute("UPDATE prices SET amount = %s WHERE product_id = %s", (amount, product_id))
