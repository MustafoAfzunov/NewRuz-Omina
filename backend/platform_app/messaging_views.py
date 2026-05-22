from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User

from .models import Booking, Conversation, Message
from .serializers import (
    ConversationCreateSerializer,
    ConversationSerializer,
    MessageContactSerializer,
    MessageSerializer,
)


def _conversation_queryset_for_user(user):
    qs = Conversation.objects.select_related("mentor", "mentee")
    if user.role == User.Role.MENTEE:
        return qs.filter(mentee=user)
    if user.role == User.Role.MENTOR:
        return qs.filter(mentor=user)
    return qs.none()


def _mark_conversation_read(conversation, reader):
    conversation.messages.filter(read_at__isnull=True).exclude(sender=reader).update(
        read_at=timezone.now()
    )


class ConversationViewSet(viewsets.ModelViewSet):
    """In-app messaging between mentors and mentees who share a booking."""

    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return _conversation_queryset_for_user(self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return ConversationCreateSerializer
        return ConversationSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role not in (User.Role.MENTEE, User.Role.MENTOR):
            return Response(
                {"detail": "Only mentors and mentees can use messaging."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ConversationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        mentor = serializer.validated_data["mentor"]
        mentee = serializer.validated_data["mentee"]
        conversation, created = Conversation.objects.get_or_create(
            mentor=mentor,
            mentee=mentee,
        )
        data = ConversationSerializer(conversation, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        conversation = self.get_object()
        if request.method == "GET":
            _mark_conversation_read(conversation, request.user)
            msgs = conversation.messages.select_related("sender").order_by("created_at")
            return Response(
                MessageSerializer(msgs, many=True, context={"request": request}).data
            )

        body = (request.data.get("body") or "").strip()
        if not body:
            return Response({"detail": "Message body is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(body) > 4000:
            return Response(
                {"detail": "Message is too long (max 4000 characters)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=body,
        )
        Conversation.objects.filter(pk=conversation.pk).update(updated_at=timezone.now())
        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="contacts")
    def contacts(self, request):
        """People the current user can start a conversation with (from bookings)."""
        user = request.user
        contacts = []

        if user.role == User.Role.MENTOR:
            mentee_ids = (
                Booking.objects.filter(mentor=user)
                .exclude(status=Booking.Status.CANCELLED)
                .values_list("mentee_id", flat=True)
                .distinct()
            )
            for mentee in User.objects.filter(pk__in=mentee_ids).order_by("username"):
                contacts.append({"id": mentee.id, "username": mentee.username, "email": mentee.email})
        elif user.role == User.Role.MENTEE:
            mentor_ids = (
                Booking.objects.filter(mentee=user)
                .exclude(status=Booking.Status.CANCELLED)
                .values_list("mentor_id", flat=True)
                .distinct()
            )
            for mentor in User.objects.filter(pk__in=mentor_ids, is_active=True).order_by(
                "username"
            ):
                contacts.append({"id": mentor.id, "username": mentor.username, "email": mentor.email})

        return Response(MessageContactSerializer(contacts, many=True).data)
