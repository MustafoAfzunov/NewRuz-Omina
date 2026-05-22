import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from .email_send import deliver_email

logger = logging.getLogger(__name__)

SIGNER_SALT = "newruz-email-verify"
User = get_user_model()


def make_verification_token(user_id: int) -> str:
    signer = signing.TimestampSigner(salt=SIGNER_SALT)
    return signer.sign(str(user_id))


def user_id_from_token(token: str) -> int | None:
    signer = signing.TimestampSigner(salt=SIGNER_SALT)
    max_age = getattr(settings, "EMAIL_VERIFICATION_MAX_AGE", 60 * 60 * 48)
    try:
        value = signer.unsign(token, max_age=max_age)
        return int(value)
    except (signing.BadSignature, signing.SignatureExpired, ValueError):
        return None


def verification_link(user_id: int) -> str:
    frontend = getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")
    token = make_verification_token(user_id)
    return f"{frontend}/verify-email?token={token}"


def send_verification_email(user) -> None:
    if not user.email:
        raise ValueError("User has no email address.")

    role_label = "Mentor" if user.role == User.Role.MENTOR else "Mentee"
    link = verification_link(user.id)
    subject = "Verify your NewRuz email address"
    message = (
        f"Hello{f' {user.first_name}' if user.first_name else ''},\n\n"
        f"Thanks for registering as a {role_label} on NewRuz.\n\n"
        f"Please verify your email address by opening this link:\n{link}\n\n"
        f"This link expires in 48 hours.\n\n"
        f"If you did not create an account, you can ignore this email.\n\n"
        f"— The NewRuz Team"
    )

    deliver_email(to=user.email, subject=subject, body=message)
