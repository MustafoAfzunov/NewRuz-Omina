from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("platform", "0002_savedmentor"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="application_deadline",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="event",
            name="category",
            field=models.CharField(
                choices=[
                    ("workshop", "Workshop"),
                    ("seminar", "Seminar"),
                    ("bootcamp", "Bootcamp"),
                    ("networking", "Networking"),
                ],
                default="workshop",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="event",
            name="image_url",
            field=models.URLField(blank=True, max_length=500),
        ),
    ]
