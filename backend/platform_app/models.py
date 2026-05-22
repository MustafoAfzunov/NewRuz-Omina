from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Program(models.Model):
    class Category(models.TextChoices):
        DESIGN = "design", "Design"
        DEVELOPMENT = "development", "Development"
        BUSINESS = "business", "Business"
        MARKETING = "marketing", "Marketing"
        DATA_SCIENCE = "data_science", "Data Science"

    class DeliveryMode(models.TextChoices):
        ONLINE = "online", "Online"
        HYBRID = "hybrid", "Hybrid"

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.DEVELOPMENT,
    )
    delivery_mode = models.CharField(
        max_length=10,
        choices=DeliveryMode.choices,
        default=DeliveryMode.ONLINE,
    )
    image_url = models.URLField(max_length=500, blank=True)
    price = models.PositiveIntegerField(default=0)
    duration_weeks = models.PositiveSmallIntegerField(default=8)
    outcomes = models.TextField(blank=True)
    mentor_name = models.CharField(max_length=120, blank=True)
    mentor_image_url = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Event(models.Model):
    class Category(models.TextChoices):
        WORKSHOP = "workshop", "Workshop"
        SEMINAR = "seminar", "Seminar"
        BOOTCAMP = "bootcamp", "Bootcamp"
        NETWORKING = "networking", "Networking"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.WORKSHOP,
    )
    image_url = models.URLField(max_length=500, blank=True)
    application_deadline = models.DateField(null=True, blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    location = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class ActivityApplicationStatus(models.TextChoices):
    SUBMITTED = "submitted", "Submitted"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class EventApplication(models.Model):
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_applications",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=ActivityApplicationStatus.choices,
        default=ActivityApplicationStatus.SUBMITTED,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["mentee", "event"],
                name="unique_mentee_event_application",
            ),
        ]

    def __str__(self):
        return f"mentee={self.mentee_id} event={self.event_id}"


class ProgramApplication(models.Model):
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="program_applications",
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=ActivityApplicationStatus.choices,
        default=ActivityApplicationStatus.SUBMITTED,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["mentee", "program"],
                name="unique_mentee_program_application",
            ),
        ]

    def __str__(self):
        return f"mentee={self.mentee_id} program={self.program_id}"


class OpportunityApplication(models.Model):
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="opportunity_applications",
    )
    opportunity = models.ForeignKey(
        "Opportunity",
        on_delete=models.CASCADE,
        related_name="applications",
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=ActivityApplicationStatus.choices,
        default=ActivityApplicationStatus.SUBMITTED,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["mentee", "opportunity"],
                name="unique_mentee_opportunity_application",
            ),
        ]

    def __str__(self):
        return f"mentee={self.mentee_id} opportunity={self.opportunity_id}"


class Opportunity(models.Model):
    class Category(models.TextChoices):
        INTERNSHIP = "internship", "Internship"
        SCHOLARSHIP = "scholarship", "Scholarship"
        VOLUNTEERING = "volunteering", "Volunteering"
        COMPETITION = "competition", "Competition"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.INTERNSHIP,
    )
    image_url = models.URLField(max_length=500, blank=True)
    cta_label = models.CharField(max_length=40, default="Apply Now")
    deadline = models.DateField(null=True, blank=True)
    is_ongoing = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Booking(models.Model):
    """Mentorship session booking between a mentee and a mentor."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings_as_mentee",
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings_as_mentor",
    )
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    notes = models.TextField(blank=True)
    meeting_url = models.URLField(max_length=500, blank=True)
    google_calendar_event_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_at"]
        indexes = [
            models.Index(fields=["mentor", "start_at", "end_at"]),
        ]

    def __str__(self):
        return f"{self.mentee_id} → {self.mentor_id} @ {self.start_at}"

    @classmethod
    def blocking_statuses(cls):
        return [cls.Status.PENDING, cls.Status.APPROVED]

    @classmethod
    def mentor_has_overlap(cls, mentor_id, start_at, end_at, exclude_pk=None):
        qs = cls.objects.filter(
            mentor_id=mentor_id,
            status__in=cls.blocking_statuses(),
        ).filter(
            Q(start_at__lt=end_at) & Q(end_at__gt=start_at),
        )
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        return qs.exists()


class GoogleCalendarCredential(models.Model):
    """OAuth tokens so a mentor can create Google Calendar events with Meet links."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="google_calendar_credential",
    )
    refresh_token = models.TextField()
    access_token = models.TextField(blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    calendar_id = models.CharField(max_length=255, default="primary")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"google_calendar user={self.user_id}"


class Conversation(models.Model):
    """Direct message thread between one mentor and one mentee."""

    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentor_conversations",
    )
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentee_conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["mentor", "mentee"],
                name="unique_mentor_mentee_conversation",
            ),
        ]

    def __str__(self):
        return f"conversation mentor={self.mentor_id} mentee={self.mentee_id}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"message {self.id} in conversation {self.conversation_id}"


class SavedMentor(models.Model):
    """Mentee bookmark of a mentor profile."""

    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_mentor_links",
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_by_mentee_links",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["mentee", "mentor"],
                name="unique_mentee_saved_mentor",
            ),
        ]

    def __str__(self):
        return f"mentee={self.mentee_id} saved mentor={self.mentor_id}"


class Review(models.Model):
    """Review left by a mentee for a mentor after a completed session."""

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="review",
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_received",
    )
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_written",
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if self.booking.status != Booking.Status.COMPLETED:
            raise ValidationError("Reviews are only allowed for completed sessions.")
        if self.booking.mentee_id != self.mentee_id:
            raise ValidationError("Only the session mentee can author this review.")
        if self.booking.mentor_id != self.mentor_id:
            raise ValidationError("Review mentor must match the booking mentor.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
