from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.models import User
from .models import (
    ActivityApplicationStatus,
    Booking,
    Conversation,
    Event,
    EventApplication,
    Message,
    Opportunity,
    OpportunityApplication,
    Program,
    ProgramApplication,
    Review,
    SavedMentor,
)

UserModel = get_user_model()


class ProgramSerializer(serializers.ModelSerializer):
    applied = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "category",
            "delivery_mode",
            "image_url",
            "price",
            "duration_weeks",
            "outcomes",
            "mentor_name",
            "mentor_image_url",
            "applied",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "applied")

    def get_applied(self, obj):
        applied_ids = self.context.get("applied_program_ids")
        return bool(applied_ids and obj.id in applied_ids)


class EventSerializer(serializers.ModelSerializer):
    applied = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "description",
            "category",
            "image_url",
            "application_deadline",
            "starts_at",
            "ends_at",
            "location",
            "applied",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "applied")

    def get_applied(self, obj):
        applied_ids = self.context.get("applied_event_ids")
        return bool(applied_ids and obj.id in applied_ids)


class OpportunitySerializer(serializers.ModelSerializer):
    applied = serializers.SerializerMethodField()

    class Meta:
        model = Opportunity
        fields = (
            "id",
            "title",
            "description",
            "category",
            "image_url",
            "cta_label",
            "deadline",
            "is_ongoing",
            "applied",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "applied")

    def get_applied(self, obj):
        applied_ids = self.context.get("applied_opportunity_ids")
        return bool(applied_ids and obj.id in applied_ids)


class EventApplicationSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(source="event.id", read_only=True)

    class Meta:
        model = EventApplication
        fields = ("id", "event_id", "status", "message", "created_at")
        read_only_fields = ("id", "event_id", "status", "created_at")


class ProgramApplicationSerializer(serializers.ModelSerializer):
    program_id = serializers.IntegerField(source="program.id", read_only=True)
    program_slug = serializers.CharField(source="program.slug", read_only=True)

    class Meta:
        model = ProgramApplication
        fields = ("id", "program_id", "program_slug", "status", "message", "created_at")
        read_only_fields = ("id", "program_id", "program_slug", "status", "created_at")


class OpportunityApplicationSerializer(serializers.ModelSerializer):
    opportunity_id = serializers.IntegerField(source="opportunity.id", read_only=True)

    class Meta:
        model = OpportunityApplication
        fields = ("id", "opportunity_id", "status", "message", "created_at")
        read_only_fields = ("id", "opportunity_id", "status", "created_at")


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "sender",
            "sender_username",
            "body",
            "created_at",
            "read_at",
            "is_mine",
        )
        read_only_fields = ("id", "sender", "sender_username", "created_at", "read_at", "is_mine")

    def get_is_mine(self, obj):
        user = self.context["request"].user
        return obj.sender_id == user.id


class ConversationSerializer(serializers.ModelSerializer):
    other_user_id = serializers.SerializerMethodField()
    other_username = serializers.SerializerMethodField()
    other_email = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id",
            "mentor",
            "mentee",
            "other_user_id",
            "other_username",
            "other_email",
            "last_message",
            "last_message_at",
            "unread_count",
            "updated_at",
            "created_at",
        )
        read_only_fields = fields

    def _other_user(self, obj):
        user = self.context["request"].user
        if user.id == obj.mentor_id:
            return obj.mentee
        return obj.mentor

    def get_other_user_id(self, obj):
        return self._other_user(obj).id

    def get_other_username(self, obj):
        return self._other_user(obj).username

    def get_other_email(self, obj):
        return self._other_user(obj).email

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if not last:
            return ""
        preview = last.body.strip()
        return preview[:120] + ("…" if len(preview) > 120 else "")

    def get_last_message_at(self, obj):
        last = obj.messages.order_by("-created_at").first()
        return last.created_at if last else None

    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(read_at__isnull=True).exclude(sender=user).count()


class ConversationCreateSerializer(serializers.Serializer):
    mentor_id = serializers.IntegerField(required=False)
    mentee_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        mentor_id = attrs.get("mentor_id")
        mentee_id = attrs.get("mentee_id")

        if user.role == User.Role.MENTOR:
            if not mentee_id:
                raise serializers.ValidationError({"mentee_id": ["This field is required."]})
            try:
                mentee = UserModel.objects.get(pk=mentee_id, role=User.Role.MENTEE)
            except UserModel.DoesNotExist:
                raise serializers.ValidationError({"mentee_id": ["Mentee not found."]})
            mentor = user
            attrs["mentor"] = mentor
            attrs["mentee"] = mentee
        elif user.role == User.Role.MENTEE:
            if not mentor_id:
                raise serializers.ValidationError({"mentor_id": ["This field is required."]})
            try:
                mentor = UserModel.objects.get(pk=mentor_id, role=User.Role.MENTOR, is_active=True)
            except UserModel.DoesNotExist:
                raise serializers.ValidationError({"mentor_id": ["Mentor not found."]})
            attrs["mentor"] = mentor
            attrs["mentee"] = user
        else:
            raise serializers.ValidationError("Only mentors and mentees can start conversations.")

        if not Booking.objects.filter(
            mentor=attrs["mentor"],
            mentee=attrs["mentee"],
        ).exclude(status=Booking.Status.CANCELLED).exists():
            raise serializers.ValidationError(
                "You can only message someone you have a mentorship session with."
            )
        return attrs


class MessageContactSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()


class MenteeEnrolledProgramSerializer(serializers.ModelSerializer):
    program_id = serializers.IntegerField(source="program.id", read_only=True)
    slug = serializers.CharField(source="program.slug", read_only=True)
    title = serializers.CharField(source="program.title", read_only=True)
    category = serializers.CharField(source="program.category", read_only=True)
    delivery_mode = serializers.CharField(source="program.delivery_mode", read_only=True)
    image_url = serializers.CharField(source="program.image_url", read_only=True)
    outcomes = serializers.CharField(source="program.outcomes", read_only=True)
    mentor_name = serializers.CharField(source="program.mentor_name", read_only=True)
    duration_weeks = serializers.IntegerField(source="program.duration_weeks", read_only=True)
    progress = serializers.SerializerMethodField()
    next_step = serializers.SerializerMethodField()

    class Meta:
        model = ProgramApplication
        fields = (
            "id",
            "program_id",
            "slug",
            "title",
            "category",
            "delivery_mode",
            "image_url",
            "outcomes",
            "mentor_name",
            "duration_weeks",
            "status",
            "progress",
            "next_step",
            "created_at",
        )
        read_only_fields = fields

    def get_progress(self, obj):
        from django.utils import timezone

        weeks = max(0, (timezone.now() - obj.created_at).days // 7)
        if obj.status == ActivityApplicationStatus.APPROVED:
            return min(95, 55 + weeks * 5)
        return min(50, 15 + weeks * 4)

    def get_next_step(self, obj):
        if obj.status == ActivityApplicationStatus.SUBMITTED:
            return "Awaiting enrollment confirmation"
        outcomes = (obj.program.outcomes or "").strip()
        if outcomes:
            snippet = outcomes.split(".")[0].strip()
            return snippet[:80] + ("…" if len(snippet) > 80 else "")
        return "Continue your learning path"


class BookingListSerializer(serializers.ModelSerializer):
    mentee_username = serializers.CharField(source="mentee.username", read_only=True)
    mentor_username = serializers.CharField(source="mentor.username", read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "mentee",
            "mentor",
            "mentee_username",
            "mentor_username",
            "start_at",
            "end_at",
            "status",
            "notes",
            "meeting_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class BookingCreateSerializer(serializers.ModelSerializer):
    mentor = serializers.PrimaryKeyRelatedField(
        queryset=UserModel.objects.filter(role=User.Role.MENTOR),
    )

    class Meta:
        model = Booking
        fields = ("mentor", "start_at", "end_at", "notes")

    def validate(self, attrs):
        start_at = attrs["start_at"]
        end_at = attrs["end_at"]
        mentor = attrs["mentor"]

        if end_at <= start_at:
            raise serializers.ValidationError("end_at must be after start_at.")

        if Booking.mentor_has_overlap(mentor.id, start_at, end_at):
            raise serializers.ValidationError(
                {"non_field_errors": ["This mentor is already booked for an overlapping time slot."]}
            )

        return attrs


class BookingMentorCreateSerializer(serializers.ModelSerializer):
    mentee = serializers.PrimaryKeyRelatedField(
        queryset=UserModel.objects.filter(role=User.Role.MENTEE),
    )

    class Meta:
        model = Booking
        fields = ("mentee", "start_at", "end_at", "notes")

    def validate(self, attrs):
        start_at = attrs["start_at"]
        end_at = attrs["end_at"]
        mentor = self.context["request"].user

        if end_at <= start_at:
            raise serializers.ValidationError("end_at must be after start_at.")

        if Booking.mentor_has_overlap(mentor.id, start_at, end_at):
            raise serializers.ValidationError(
                {"non_field_errors": ["You already have a session for an overlapping time slot."]}
            )

        return attrs


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = (
            "id",
            "booking",
            "mentor",
            "mentee",
            "rating",
            "comment",
            "created_at",
        )
        read_only_fields = ("id", "mentor", "mentee", "created_at")

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_booking(self, booking):
        user = self.context["request"].user
        if booking.mentee_id != user.id:
            raise serializers.ValidationError("You can only review your own sessions.")
        if booking.status != Booking.Status.COMPLETED:
            raise serializers.ValidationError(
                "You can only leave a review after the session is completed."
            )
        if hasattr(booking, "review"):
            raise serializers.ValidationError("A review already exists for this session.")
        return booking

    def create(self, validated_data):
        booking = validated_data["booking"]
        return Review.objects.create(
            booking=booking,
            mentor=booking.mentor,
            mentee=booking.mentee,
            rating=validated_data["rating"],
            comment=validated_data.get("comment", ""),
        )


class SavedMentorCreateSerializer(serializers.Serializer):
    mentor = serializers.PrimaryKeyRelatedField(
        queryset=UserModel.objects.filter(role=User.Role.MENTOR, is_active=True),
    )

    def create(self, validated_data):
        mentee = self.context["request"].user
        mentor = validated_data["mentor"]
        link, created = SavedMentor.objects.get_or_create(mentee=mentee, mentor=mentor)
        if not created:
            raise serializers.ValidationError({"mentor": ["This mentor is already saved."]})
        return link


class MentorPublicSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    verified = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    bg_color = serializers.SerializerMethodField()
    profession = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()
    session_types = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "display_name",
            "verified",
            "title",
            "company",
            "description",
            "price",
            "rating",
            "image",
            "bg_color",
            "profession",
            "languages",
            "session_types",
        )

    mentor_profiles = {
        "sarah.jenkins": {
            "title": "Senior UX Designer",
            "company": "Adobe",
            "description": "Helping product designers master the art of user research and visual storytelling. 8+ years of industry...",
            "price": 60,
            "rating": 4.9,
            "image": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
            "bg_color": "bg-[#D4B896]",
            "profession": "design",
            "languages": ["english"],
            "session_types": ["1-on-1", "workshop"],
        },
        "david.chen": {
            "title": "Lead Backend Developer",
            "company": "Meta",
            "description": "Expert in distributed systems and scalable cloud architecture. I love teaching complex concepts in simple...",
            "price": 85,
            "rating": 4.8,
            "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
            "bg_color": "bg-[#D4B896]",
            "profession": "engineering",
            "languages": ["english"],
            "session_types": ["1-on-1"],
        },
        "elena.rodriguez": {
            "title": "Marketing Strategy Director",
            "company": "Spotify",
            "description": "Specializing in growth marketing for startups and brand positioning. Let's scale your career together.",
            "price": 120,
            "rating": 5.0,
            "image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
            "bg_color": "bg-[#F4B4A0]",
            "profession": "marketing",
            "languages": ["english", "spanish"],
            "session_types": ["1-on-1", "workshop"],
        },
        "marcus.thorne": {
            "title": "Product Manager",
            "company": "Google",
            "description": "Helping product people navigate the transition from junior to senior roles. Roadmap and strategy expert.",
            "price": 95,
            "rating": 4.7,
            "image": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
            "bg_color": "bg-[#D4B896]",
            "profession": "product",
            "languages": ["english"],
            "session_types": ["1-on-1"],
        },
        "sophie.alvez": {
            "title": "Data Science Lead",
            "company": "Amazon",
            "description": "Expert in Machine Learning and Python. I help students prepare for technical interviews at top-tier tech...",
            "price": 75,
            "rating": 4.9,
            "image": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
            "bg_color": "bg-[#2C5F5D]",
            "profession": "data",
            "languages": ["english", "french"],
            "session_types": ["1-on-1", "workshop"],
        },
        "james.wilson": {
            "title": "Full Stack Developer",
            "company": "Netflix",
            "description": "Learn React, Node, and Tailwind from scratch. I build real projects with you to boost your portfolio.",
            "price": 55,
            "rating": 4.6,
            "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
            "bg_color": "bg-[#A8C5C1]",
            "profession": "engineering",
            "languages": ["english"],
            "session_types": ["1-on-1", "workshop"],
        },
    }

    default_profile = {
        "title": "Registered Mentor",
        "company": "NewRuz",
        "description": "Verified mentor registered in the backend and available for mentorship sessions.",
        "price": 60,
        "rating": 4.8,
        "image": "",
        "bg_color": "bg-[#D4B896]",
        "profession": "engineering",
        "languages": ["english"],
        "session_types": ["1-on-1"],
    }

    def get_profile_value(self, obj, key):
        return self.mentor_profiles.get(obj.username, self.default_profile)[key]

    def get_display_name(self, obj):
        full_name = obj.get_full_name().strip()
        return full_name or obj.username

    def get_verified(self, obj):
        return obj.is_active and obj.role == User.Role.MENTOR

    def get_title(self, obj):
        return self.get_profile_value(obj, "title")

    def get_company(self, obj):
        return self.get_profile_value(obj, "company")

    def get_description(self, obj):
        return self.get_profile_value(obj, "description")

    def get_price(self, obj):
        return self.get_profile_value(obj, "price")

    def get_rating(self, obj):
        return self.get_profile_value(obj, "rating")

    def get_image(self, obj):
        return self.get_profile_value(obj, "image")

    def get_bg_color(self, obj):
        return self.get_profile_value(obj, "bg_color")

    def get_profession(self, obj):
        return self.get_profile_value(obj, "profession")

    def get_languages(self, obj):
        return self.get_profile_value(obj, "languages")

    def get_session_types(self, obj):
        return self.get_profile_value(obj, "session_types")


class MenteePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")
