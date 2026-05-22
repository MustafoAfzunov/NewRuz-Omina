from django.urls import path

from .views import (
    bootstrap_admin_view,
    confirm_password_reset_view,
    email_status_view,
    login_view,
    logout_view,
    me_view,
    register_view,
    request_password_reset_view,
    resend_verification_view,
    verify_email_view,
)

urlpatterns = [
    path("email-status/", email_status_view, name="email-status"),
    path("bootstrap-admin/", bootstrap_admin_view, name="bootstrap-admin"),
    path("register/", register_view, name="register"),
    path("verify-email/", verify_email_view, name="verify-email"),
    path("resend-verification/", resend_verification_view, name="resend-verification"),
    path("password-reset/", request_password_reset_view, name="password-reset"),
    path("password-reset/confirm/", confirm_password_reset_view, name="password-reset-confirm"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("me/", me_view, name="me"),
]
