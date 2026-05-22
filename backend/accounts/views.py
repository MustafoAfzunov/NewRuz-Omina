import logging

from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .email_verification import send_verification_email, user_id_from_token
from .password_reset import send_password_reset_email, user_id_from_reset_token
from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


def _user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_email_verified": user.is_email_verified,
        "mentor_status": user.mentor_status or None,
    }


@api_view(["POST"])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    try:
        send_verification_email(user)
    except Exception:
        logger.exception("Failed to send verification email to %s", user.email)
        user.delete()
        return Response(
            {
                "detail": "Could not send verification email. Check email settings and try again.",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        {
            "detail": "Registration successful. Please check your email to verify your account.",
            "email": user.email,
            "requires_verification": True,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def verify_email_view(request):
    token = request.data.get("token") or request.query_params.get("token")
    if not token:
        return Response({"detail": "Verification token is required."}, status=status.HTTP_400_BAD_REQUEST)

    user_id = user_id_from_token(token)
    if not user_id:
        return Response(
            {"detail": "Invalid or expired verification link. Request a new email."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

    if user.is_email_verified:
        auth_token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "detail": "Email already verified. You can sign in.",
                "already_verified": True,
                "token": auth_token.key,
                "user": _user_payload(user),
            }
        )

    user.is_email_verified = True
    user.save(update_fields=["is_email_verified"])

    auth_token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "detail": "Email verified successfully.",
            "token": auth_token.key,
            "user": _user_payload(user),
        }
    )


@api_view(["POST"])
def resend_verification_view(request):
    serializer = ResendVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].strip().lower()

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response(
            {
                "detail": "If an account exists for this email, a verification link has been sent.",
            }
        )

    if user.is_email_verified:
        return Response({"detail": "This email is already verified. You can sign in."})

    try:
        send_verification_email(user)
    except Exception:
        logger.exception("Failed to resend verification email to %s", user.email)
        return Response(
            {"detail": "Could not send verification email. Try again later."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        {
            "detail": "If an account exists for this email, a verification link has been sent.",
        }
    )


@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    identifier = serializer.validated_data["username"]
    password = serializer.validated_data["password"]
    user = None

    if "@" in identifier:
        for candidate in User.objects.filter(email__iexact=identifier):
            user = authenticate(username=candidate.username, password=password)
            if user:
                break
    else:
        user = authenticate(username=identifier, password=password)

    if not user:
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.is_email_verified:
        return Response(
            {
                "detail": "Please verify your email before signing in.",
                "requires_verification": True,
                "email": user.email,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if user.role == User.Role.MENTOR and user.mentor_status == User.MentorStatus.REJECTED:
        return Response(
            {"detail": "Your mentor application was not approved. Contact support if you have questions."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "user": _user_payload(user),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.auth.delete()
    return Response({"detail": "Logged out successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(_user_payload(request.user))


PASSWORD_RESET_SENT_DETAIL = (
    "If an account exists for this email, a password reset link has been sent."
)


@api_view(["POST"])
def request_password_reset_view(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].strip().lower()

    user = User.objects.filter(email__iexact=email).first()
    if user:
        try:
            send_password_reset_email(user)
        except Exception:
            logger.exception("Failed to send password reset email to %s", email)
            return Response(
                {"detail": "Could not send reset email. Try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    return Response({"detail": PASSWORD_RESET_SENT_DETAIL})


@api_view(["POST"])
def confirm_password_reset_view(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user_id = user_id_from_reset_token(serializer.validated_data["token"])
    if not user_id:
        return Response(
            {"detail": "Invalid or expired reset link. Request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data["password"])
    user.save(update_fields=["password"])
    Token.objects.filter(user=user).delete()

    return Response({"detail": "Password updated successfully. You can sign in now."})
