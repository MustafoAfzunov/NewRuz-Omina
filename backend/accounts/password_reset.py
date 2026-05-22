import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

SIGNER_SALT = "newruz-password-reset"
User = get_user_model()


def make_reset_token(user_id: int) -> str:
    signer = signing.TimestampSigner(salt=SIGNER_SALT)
    return signer.sign(str(user_id))


def user_id_from_reset_token(token: str) -> int | None:
    signer = signing.TimestampSigner(salt=SIGNER_SALT)
    max_age = getattr(settings, "PASSWORD_RESET_MAX_AGE", 60 * 60)
    try:
        value = signer.unsign(token, max_age=max_age)
        return int(value)
    except (signing.BadSignature, signing.SignatureExpired, ValueError):
        return None


def password_reset_link(user_id: int) -> str:
    frontend = getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")
    token = make_reset_token(user_id)
    return f"{frontend}/reset-password?token={token}"


def send_password_reset_email(user) -> None:
    from .email_verification import _require_deliverable_email_backend

    if not user.email:
        raise ValueError("User has no email address.")

    _require_deliverable_email_backend()

    link = password_reset_link(user.id)
    subject = "Reset your NewRuz password"
    message = (
        f"Hello{f' {user.first_name}' if user.first_name else ''},\n\n"
        f"We received a request to reset your NewRuz password.\n\n"
        f"Open this link to choose a new password:\n{link}\n\n"
        f"This link expires in 1 hour.\n\n"
        f"If you did not request a reset, you can ignore this email.\n\n"
        f"— The NewRuz Team"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
    logger.info("Password reset email sent to %s", user.email)
