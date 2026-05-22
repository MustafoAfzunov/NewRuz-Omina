from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .permissions import IsAdminRole

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "first_name",
            "last_name",
            "display_name",
            "mentor_status",
            "is_email_verified",
            "is_active",
            "date_joined",
        )

    def get_display_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users(request):
    role = request.query_params.get("role")
    qs = User.objects.all().order_by("-date_joined")
    if role in (User.Role.MENTEE, User.Role.MENTOR, User.Role.ADMIN):
        qs = qs.filter(role=role)
    mentor_status = request.query_params.get("mentor_status")
    if mentor_status:
        qs = qs.filter(mentor_status=mentor_status)
    return Response(AdminUserSerializer(qs, many=True).data)


@api_view(["DELETE"])
@permission_classes([IsAdminRole])
def admin_user_delete(request, pk: int):
    if request.user.pk == pk:
        return Response(
            {"detail": "You cannot delete your own account."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    if user.role == User.Role.ADMIN:
        return Response(
            {"detail": "Admin accounts cannot be deleted from the panel."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_mentor_approve(request, pk: int):
    try:
        user = User.objects.get(pk=pk, role=User.Role.MENTOR)
    except User.DoesNotExist:
        return Response({"detail": "Mentor not found."}, status=status.HTTP_404_NOT_FOUND)
    user.mentor_status = User.MentorStatus.APPROVED
    user.is_active = True
    user.save(update_fields=["mentor_status", "is_active"])
    return Response(AdminUserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_mentor_reject(request, pk: int):
    try:
        user = User.objects.get(pk=pk, role=User.Role.MENTOR)
    except User.DoesNotExist:
        return Response({"detail": "Mentor not found."}, status=status.HTTP_404_NOT_FOUND)
    user.mentor_status = User.MentorStatus.REJECTED
    user.save(update_fields=["mentor_status"])
    return Response(AdminUserSerializer(user).data)
