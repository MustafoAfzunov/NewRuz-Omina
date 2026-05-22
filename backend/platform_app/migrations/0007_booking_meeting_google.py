import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("platform", "0006_activity_applications"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="meeting_url",
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="booking",
            name="google_calendar_event_id",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.CreateModel(
            name="GoogleCalendarCredential",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("refresh_token", models.TextField()),
                ("access_token", models.TextField(blank=True)),
                ("token_expiry", models.DateTimeField(blank=True, null=True)),
                ("calendar_id", models.CharField(default="primary", max_length=255)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="google_calendar_credential",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
