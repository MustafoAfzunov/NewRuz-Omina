import logging
import threading

logger = logging.getLogger(__name__)


def send_verification_email_async(user) -> None:
    """Send verification email without blocking the HTTP request (avoids 502 on slow SMTP)."""

    def task():
        try:
            from .email_verification import send_verification_email

            send_verification_email(user)
        except Exception:
            logger.exception("Verification email failed for %s", user.email)

    threading.Thread(target=task, daemon=True).start()


def send_password_reset_email_async(user) -> None:
    def task():
        try:
            from .password_reset import send_password_reset_email

            send_password_reset_email(user)
        except Exception:
            logger.exception("Password reset email failed for %s", user.email)

    threading.Thread(target=task, daemon=True).start()
