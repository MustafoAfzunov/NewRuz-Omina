import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Create or update the production admin user (for Render shell / one-off jobs)."

    def handle(self, *args, **options):
        email = os.environ.get("ADMIN_EMAIL", "ainulloevao@gmail.com").strip().lower()
        password = os.environ.get("ADMIN_PASSWORD", "11111111")
        username = os.environ.get("ADMIN_USERNAME", email)

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_email_verified": True,
            },
        )
        user.email = email
        user.role = User.Role.ADMIN
        user.is_staff = True
        user.is_superuser = True
        user.is_email_verified = True
        user.is_active = True
        user.set_password(password)
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} admin: {user.username} ({user.email})"))
