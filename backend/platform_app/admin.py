from django.contrib import admin

from .models import (
    Booking,
    Conversation,
    Event,
    GoogleCalendarCredential,
    Message,
    Opportunity,
    Program,
    Review,
    SavedMentor,
)


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "created_at")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "starts_at", "ends_at")


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "deadline")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "mentee", "mentor", "start_at", "end_at", "status", "meeting_url")
    list_filter = ("status",)


@admin.register(GoogleCalendarCredential)
class GoogleCalendarCredentialAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "calendar_id", "updated_at")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "mentee", "mentor", "booking", "rating", "created_at")


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "mentor", "mentee", "updated_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "created_at", "read_at")


@admin.register(SavedMentor)
class SavedMentorAdmin(admin.ModelAdmin):
    list_display = ("id", "mentee", "mentor", "created_at")
