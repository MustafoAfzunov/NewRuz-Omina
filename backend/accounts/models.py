from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", "mentee")
        if not username:
            raise ValueError("Username is required")
        email = self.normalize_email(email) if email else None
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_email_verified", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    """Application user with a single role used for authorization."""

    class Role(models.TextChoices):
        MENTEE = "mentee", "Mentee"
        MENTOR = "mentor", "Mentor"
        ADMIN = "admin", "Admin"

    class MentorStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MENTEE,
        db_index=True,
    )
    is_email_verified = models.BooleanField(default=False, db_index=True)
    mentor_status = models.CharField(
        max_length=20,
        choices=MentorStatus.choices,
        blank=True,
        default="",
        db_index=True,
    )

    objects = UserManager()

    @property
    def is_approved_mentor(self):
        return self.role == self.Role.MENTOR and self.mentor_status == self.MentorStatus.APPROVED

    def save(self, *args, **kwargs):
        if self.role == self.Role.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
