from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("platform", "0003_event_category_image_deadline"),
    ]

    operations = [
        migrations.AddField(
            model_name="opportunity",
            name="cta_label",
            field=models.CharField(default="Apply Now", max_length=40),
        ),
        migrations.AddField(
            model_name="opportunity",
            name="image_url",
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="opportunity",
            name="is_ongoing",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="opportunity",
            name="category",
            field=models.CharField(
                choices=[
                    ("internship", "Internship"),
                    ("scholarship", "Scholarship"),
                    ("volunteering", "Volunteering"),
                    ("competition", "Competition"),
                ],
                default="internship",
                max_length=20,
            ),
        ),
    ]
