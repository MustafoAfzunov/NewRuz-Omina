from django.db import migrations, models


def approve_existing_mentors(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(role="mentor").update(mentor_status="approved")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_user_is_email_verified"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="mentor_status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("pending", "Pending"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                db_index=True,
                default="",
                max_length=20,
            ),
        ),
        migrations.RunPython(approve_existing_mentors, migrations.RunPython.noop),
    ]
