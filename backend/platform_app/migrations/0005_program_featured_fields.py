from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("platform", "0004_opportunity_image_cta_ongoing"),
    ]

    operations = [
        migrations.AddField(
            model_name="program",
            name="category",
            field=models.CharField(
                choices=[
                    ("design", "Design"),
                    ("development", "Development"),
                    ("business", "Business"),
                    ("marketing", "Marketing"),
                    ("data_science", "Data Science"),
                ],
                default="development",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="program",
            name="delivery_mode",
            field=models.CharField(
                choices=[("online", "Online"), ("hybrid", "Hybrid")],
                default="online",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="program",
            name="duration_weeks",
            field=models.PositiveSmallIntegerField(default=8),
        ),
        migrations.AddField(
            model_name="program",
            name="image_url",
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="program",
            name="mentor_image_url",
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="program",
            name="mentor_name",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="program",
            name="outcomes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="program",
            name="price",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
