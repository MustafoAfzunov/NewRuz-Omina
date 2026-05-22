from django.db import migrations, models


def mark_existing_users_verified(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(is_email_verified=False).update(is_email_verified=True)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_email_verified",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.RunPython(mark_existing_users_verified, migrations.RunPython.noop),
    ]
