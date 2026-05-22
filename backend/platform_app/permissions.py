from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import User


class IsMentee(BasePermission):
    message = "Only mentees can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == User.Role.MENTEE
        )


class IsMentor(BasePermission):
    message = "Only approved mentors can perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == User.Role.MENTOR
            and getattr(user, "mentor_status", None) == User.MentorStatus.APPROVED
        )


class IsAdminRole(BasePermission):
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == User.Role.ADMIN
        )


class IsAdminOrReadOnly(BasePermission):
    """Guests and any authenticated user can read; only admins can write."""

    message = "Only administrators can modify this resource."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == User.Role.ADMIN
        )
