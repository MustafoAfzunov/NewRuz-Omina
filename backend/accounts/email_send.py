"""Send email over HTTPS (Render blocks SMTP ports 587/465)."""

from __future__ import annotations

import base64
import logging
import os
from email.mime.text import MIMEText

import requests
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    pass


def delivery_method() -> str:
    if os.environ.get("RESEND_API_KEY", "").strip():
        return "resend"
    if _gmail_refresh_token():
        return "gmail_api"
    backend = getattr(settings, "EMAIL_BACKEND", "")
    if "smtp" in backend and getattr(settings, "EMAIL_HOST_USER", ""):
        return "smtp"
    if "console" in backend:
        return "console"
    return "none"


def _gmail_refresh_token() -> str:
    return (
        os.environ.get("GOOGLE_MAIL_REFRESH_TOKEN", "").strip()
        or os.environ.get("GOOGLE_OAUTH_REFRESH_TOKEN", "").strip()
    )


def _send_via_resend(*, to: str, subject: str, body: str) -> None:
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not api_key:
        raise EmailDeliveryError("RESEND_API_KEY is not set.")

    from_email = os.environ.get(
        "RESEND_FROM_EMAIL",
        getattr(settings, "DEFAULT_FROM_EMAIL", "NewRuz <onboarding@resend.dev>"),
    )
    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": from_email,
            "to": [to],
            "subject": subject,
            "text": body,
        },
        timeout=30,
    )
    if response.status_code >= 400:
        logger.error("Resend API rejected email to %s: %s", to, response.text)
        raise EmailDeliveryError(
            f"Resend could not send to {to}. "
            f"If you use onboarding@resend.dev, you can only email your Resend account address "
            f"until you verify a domain at resend.com/domains. Details: {response.text}"
        )
    logger.info("Resend email accepted for %s (id=%s)", to, response.json().get("id", "?"))


def _send_via_gmail_api(*, to: str, subject: str, body: str) -> None:
    refresh_token = _gmail_refresh_token()
    client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or ""
    client_secret = getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", "") or ""
    if not refresh_token or not client_id or not client_secret:
        raise EmailDeliveryError("Gmail API mail is not configured.")

    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    sender = (
        os.environ.get("GMAIL_SENDER", "").strip()
        or getattr(settings, "EMAIL_HOST_USER", "")
        or "me"
    )

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=["https://www.googleapis.com/auth/gmail.send"],
    )
    creds.refresh(Request())

    mime = MIMEText(body)
    mime["to"] = to
    mime["subject"] = subject
    if sender != "me":
        mime["from"] = sender

    raw = base64.urlsafe_b64encode(mime.as_bytes()).decode()
    service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    service.users().messages().send(userId="me", body={"raw": raw}).execute()
    logger.info("Gmail API email sent to %s", to)


def deliver_email(*, to: str, subject: str, body: str) -> None:
    if not to:
        raise EmailDeliveryError("Recipient email is required.")

    method = delivery_method()

    if method == "resend":
        _send_via_resend(to=to, subject=subject, body=body)
        return

    if method == "gmail_api":
        try:
            _send_via_gmail_api(to=to, subject=subject, body=body)
            return
        except Exception as exc:
            logger.exception("Gmail API failed, trying fallback")
            if os.environ.get("RESEND_API_KEY"):
                _send_via_resend(to=to, subject=subject, body=body)
                return
            raise EmailDeliveryError(str(exc)) from exc

    if method == "console":
        if not settings.DEBUG:
            raise EmailDeliveryError(
                "Email not configured for production. Set RESEND_API_KEY on newruz-api "
                "(recommended on Render) or GOOGLE_MAIL_REFRESH_TOKEN with gmail.send scope."
            )
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to], fail_silently=False)
        logger.info("Console email for %s", to)
        return

    if method == "smtp":
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to], fail_silently=False)
        logger.info("SMTP email sent to %s", to)
        return

    raise EmailDeliveryError(
        "No email delivery configured. Add RESEND_API_KEY to Render (see DEPLOY_RENDER.md)."
    )
