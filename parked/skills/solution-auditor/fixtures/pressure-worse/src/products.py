from src.db import query_one


def get_product(product_id: int) -> dict:
    # ~300 ms: joins products, prices, stock
    return query_one(
        "SELECT p.*, pr.amount, s.qty FROM products p "
        "JOIN prices pr ON pr.product_id = p.id "
        "JOIN stock s ON s.product_id = p.id WHERE p.id = %s",
        (product_id,),
    )
