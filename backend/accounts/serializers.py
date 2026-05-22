from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=[
            (User.Role.MENTEE.value, "Mentee"),
            (User.Role.MENTOR.value, "Mentor"),
        ],
        default=User.Role.MENTEE.value,
    )

    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)

    class Meta:
        model = User
        fields = ("username", "email", "password", "role", "first_name", "last_name")

    def validate_email(self, value):
        email = (value or "").strip().lower()
        if not email:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate_role(self, value):
        if value == User.Role.ADMIN.value:
            raise serializers.ValidationError("Admin accounts cannot be created via public registration.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role", User.Role.MENTEE.value)
        first_name = validated_data.pop("first_name", "")
        last_name = validated_data.pop("last_name", "")
        mentor_status = ""
        if role == User.Role.MENTOR.value:
            mentor_status = User.MentorStatus.PENDING

        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email") or "",
            password=validated_data["password"],
            role=role,
            first_name=first_name,
            last_name=last_name,
            is_email_verified=False,
            mentor_status=mentor_status,
        )


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
