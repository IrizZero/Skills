import smtplib
from email.message import EmailMessage

from flask import Flask, request

from src.db import pool

app = Flask(__name__)


@app.post("/signup")
def signup():
    email = request.form["email"]
    with pool.connection() as conn:
        conn.execute("INSERT INTO users (email) VALUES (%s)", (email,))
    send_welcome(email)  # slow: blocks the request for 2-4 s
    return {"ok": True}


def send_welcome(email: str) -> None:
    msg = EmailMessage()
    msg["To"] = email
    msg["Subject"] = "Welcome"
    msg.set_content("Thanks for signing up.")
    with smtplib.SMTP("smtp.internal", 25) as smtp:
        smtp.send_message(msg)
