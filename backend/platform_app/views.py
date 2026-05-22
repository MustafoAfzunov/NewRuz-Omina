from datetime import date as date_cls, datetime, time, timedelta

from django.db.models import Case, Count, IntegerField, Q, Value, When
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User

from .google_calendar import (
    GoogleCalendarError,
    GoogleCalendarNotConfigured,
    build_authorization_url,
    create_meet_for_booking,
    exchange_authorization_code,
    is_google_oauth_configured,
    mentor_has_calendar_access,
)
from .models import (
    Booking,
    Event,
    EventApplication,
    GoogleCalendarCredential,
    Opportunity,
    OpportunityApplication,
    Program,
    ProgramApplication,
    Review,
    SavedMentor,
)
from .permissions import IsAdminOrReadOnly, IsAdminRole, IsMentee, IsMentor
from .serializers import (
    BookingCreateSerializer,
    BookingListSerializer,
    BookingMentorCreateSerializer,
    EventApplicationSerializer,
    EventSerializer,
    MenteePublicSerializer,
    MentorPublicSerializer,
    OpportunityApplicationSerializer,
    OpportunitySerializer,
    ProgramApplicationSerializer,
    ProgramSerializer,
    ReviewSerializer,
    SavedMentorCreateSerializer,
)


def _mentee_application_context(request):
    """Annotate list serializers with IDs the current mentee has applied to."""
    ctx = {}
    user = request.user
    if not user.is_authenticated or getattr(user, "role", None) != User.Role.MENTEE:
        return ctx
    ctx["applied_event_ids"] = set(
        EventApplication.objects.filter(mentee=user).values_list("event_id", flat=True)
    )
    ctx["applied_program_ids"] = set(
        ProgramApplication.objects.filter(mentee=user).values_list("program_id", flat=True)
    )
    ctx["applied_opportunity_ids"] = set(
        OpportunityApplication.objects.filter(mentee=user).values_list(
            "opportunity_id", flat=True
        )
    )
    return ctx


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx.update(_mentee_application_context(self.request))
        return ctx

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsMentee])
    def apply(self, request, slug=None):
        program = self.get_object()
        message = (request.data.get("message") or "").strip()
        application, created = ProgramApplication.objects.get_or_create(
            mentee=request.user,
            program=program,
            defaults={"message": message},
        )
        if not created:
            return Response(
                {"detail": "You have already applied to this program."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            ProgramApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx.update(_mentee_application_context(self.request))
        return ctx

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsMentee])
    def apply(self, request, pk=None):
        event = self.get_object()
        if event.application_deadline and event.application_deadline < date_cls.today():
            return Response(
                {"detail": "The application deadline for this event has passed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        message = (request.data.get("message") or "").strip()
        application, created = EventApplication.objects.get_or_create(
            mentee=request.user,
            event=event,
            defaults={"message": message},
        )
        if not created:
            return Response(
                {"detail": "You have already applied to this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            EventApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )


class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx.update(_mentee_application_context(self.request))
        return ctx

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsMentee])
    def apply(self, request, pk=None):
        opportunity = self.get_object()
        if (
            not opportunity.is_ongoing
            and opportunity.deadline
            and opportunity.deadline < date_cls.today()
        ):
            return Response(
                {"detail": "The deadline for this opportunity has passed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        message = (request.data.get("message") or "").strip()
        application, created = OpportunityApplication.objects.get_or_create(
            mentee=request.user,
            opportunity=opportunity,
            defaults={"message": message},
        )
        if not created:
            return Response(
                {"detail": "You have already applied to this opportunity."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            OpportunityApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )


class BookingViewSet(viewsets.ModelViewSet):
    """
    Mentees create booking requests.
    Mentors list incoming requests and approve/reject/complete.
    Admins see all bookings.
    """

    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [IsMentee()]
        if self.action == "create_as_mentor":
            return [IsMentor()]
        if self.action == "cancel":
            return [IsMentee()]
        if self.action in ("approve", "reject", "complete"):
            return [IsMentor()]
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAdminRole()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related("mentee", "mentor").all()

        if user.role == User.Role.ADMIN:
            return qs
        if user.role == User.Role.MENTEE:
            return qs.filter(mentee=user)
        if user.role == User.Role.MENTOR:
            return qs.filter(mentor=user)
        return qs.none()

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingListSerializer

    def perform_create(self, serializer):
        serializer.save(mentee=self.request.user, status=Booking.Status.PENDING)

    @action(detail=False, methods=["post"], url_path="create-as-mentor")
    def create_as_mentor(self, request):
        serializer = BookingMentorCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save(mentor=request.user, status=Booking.Status.APPROVED)
        return Response(BookingListSerializer(booking).data, status=status.HTTP_201_CREATED)

    def _mentor_booking_or_403(self, booking):
        if booking.mentor_id != self.request.user.id:
            return Response(
                {"detail": "You can only manage bookings assigned to you."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        booking = self.get_object()
        err = self._mentor_booking_or_403(booking)
        if err:
            return err
        if booking.status != Booking.Status.PENDING:
            return Response(
                {"detail": "Only pending bookings can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if Booking.mentor_has_overlap(
            booking.mentor_id,
            booking.start_at,
            booking.end_at,
            exclude_pk=booking.pk,
        ):
            return Response(
                {"detail": "Cannot approve: another booking overlaps this time slot."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.APPROVED
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingListSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        booking = self.get_object()
        err = self._mentor_booking_or_403(booking)
        if err:
            return err
        if booking.status != Booking.Status.PENDING:
            return Response(
                {"detail": "Only pending bookings can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.REJECTED
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingListSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        booking = self.get_object()
        err = self._mentor_booking_or_403(booking)
        if err:
            return err
        if booking.status != Booking.Status.APPROVED:
            return Response(
                {"detail": "Only approved sessions can be marked completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.COMPLETED
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingListSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.mentee_id != request.user.id:
            return Response(
                {"detail": "You can only cancel your own bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if booking.status not in (Booking.Status.PENDING, Booking.Status.APPROVED):
            return Response(
                {"detail": "Only pending or approved bookings can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingListSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="meeting")
    def meeting(self, request, pk=None):
        """Create or return the Google Meet link for an approved session."""
        booking = self.get_object()
        user = request.user
        if user.id not in (booking.mentee_id, booking.mentor_id):
            return Response(
                {"detail": "You are not a participant in this session."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if booking.status != Booking.Status.APPROVED:
            return Response(
                {"detail": "Meetings are only available for approved sessions."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.meeting_url:
            return Response(
                {
                    "meeting_url": booking.meeting_url,
                    "created": False,
                    "booking": BookingListSerializer(booking).data,
                }
            )

        if not mentor_has_calendar_access(booking.mentor):
            return Response(
                {
                    "detail": (
                        "Your mentor must connect Google Calendar in Mentor Settings "
                        "before video calls can be created."
                    ),
                    "code": "google_not_connected",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            meet_url, event_id = create_meet_for_booking(booking)
        except GoogleCalendarNotConfigured as exc:
            return Response(
                {"detail": str(exc), "code": "google_not_configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except GoogleCalendarError as exc:
            return Response(
                {"detail": str(exc), "code": "google_error"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            return Response(
                {"detail": f"Could not create meeting: {exc}", "code": "meeting_error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        booking.meeting_url = meet_url
        booking.google_calendar_event_id = event_id
        booking.save(update_fields=["meeting_url", "google_calendar_event_id", "updated_at"])
        return Response(
            {
                "meeting_url": meet_url,
                "created": True,
                "booking": BookingListSerializer(booking).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ReviewViewSet(viewsets.ModelViewSet):
    """Mentees create reviews only for their own completed bookings."""

    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [IsMentee()]
        if self.action in ("update", "partial_update", "destroy"):
            return [IsAdminRole()]
        return [IsAuthenticated()]

    serializer_class = ReviewSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Review.objects.select_related("booking", "mentor", "mentee").all()
        if user.role == User.Role.ADMIN:
            return qs
        if user.role == User.Role.MENTEE:
            return qs.filter(mentee=user)
        if user.role == User.Role.MENTOR:
            return qs.filter(mentor=user)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save()


@api_view(["GET"])
@permission_classes([IsMentee])
def mentee_dashboard(request):
    user = request.user
    data = {
        "role": user.role,
        "bookings_total": Booking.objects.filter(mentee=user).count(),
        "bookings_pending": Booking.objects.filter(
            mentee=user, status=Booking.Status.PENDING
        ).count(),
        "reviews_written": Review.objects.filter(mentee=user).count(),
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsMentor])
def mentor_dashboard(request):
    user = request.user
    data = {
        "role": user.role,
        "incoming_pending": Booking.objects.filter(
            mentor=user, status=Booking.Status.PENDING
        ).count(),
        "approved_upcoming": Booking.objects.filter(
            mentor=user, status=Booking.Status.APPROVED
        ).count(),
        "reviews_received": Review.objects.filter(mentor=user).count(),
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_dashboard(request):
    data = {
        "role": User.Role.ADMIN,
        "users_by_role": dict(
            User.objects.values("role").annotate(c=Count("id")).values_list("role", "c")
        ),
        "pending_mentors": User.objects.filter(
            role=User.Role.MENTOR, mentor_status=User.MentorStatus.PENDING
        ).count(),
        "bookings_by_status": dict(
            Booking.objects.values("status").annotate(c=Count("id")).values_list("status", "c")
        ),
        "programs": Program.objects.count(),
        "events": Event.objects.count(),
        "opportunities": Opportunity.objects.count(),
    }
    return Response(data)


@api_view(["GET"])
def mentor_list(request):
    mentors = (
        User.objects.filter(
            role=User.Role.MENTOR,
            is_active=True,
            mentor_status=User.MentorStatus.APPROVED,
        )
        .annotate(
            missing_name=Case(
                When(first_name="", last_name="", then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        )
        .order_by("missing_name", "first_name", "last_name", "username")
    )
    return Response(MentorPublicSerializer(mentors, many=True).data)


@api_view(["GET"])
@permission_classes([IsMentor | IsAdminRole])
def mentee_list(request):
    mentees = User.objects.filter(role=User.Role.MENTEE).order_by("username")
    return Response(MenteePublicSerializer(mentees, many=True).data)


@api_view(["GET"])
def mentor_detail(request, pk: int):
    try:
        mentor = User.objects.get(
            pk=pk,
            role=User.Role.MENTOR,
            is_active=True,
            mentor_status=User.MentorStatus.APPROVED,
        )
    except User.DoesNotExist:
        return Response({"detail": "Mentor not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(MentorPublicSerializer(mentor).data)


@api_view(["GET"])
def mentor_availability(request, pk: int):
    try:
        mentor = User.objects.get(pk=pk, role=User.Role.MENTOR)
    except User.DoesNotExist:
        return Response({"detail": "Mentor not found."}, status=status.HTTP_404_NOT_FOUND)

    date_str = request.query_params.get("date")
    if not date_str:
        return Response({"detail": "date query param is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        target_date = date_cls.fromisoformat(date_str)
    except ValueError:
        return Response({"detail": "Invalid date format."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        duration_minutes = int(request.query_params.get("duration", "60"))
    except ValueError:
        return Response({"detail": "duration must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

    # Baseline mentor slot starts. Availability is computed from bookings.
    slot_starts = ["09:00", "10:00", "11:00", "13:00", "14:30", "16:00"]
    slots = []
    for slot_start in slot_starts:
        hour, minute = slot_start.split(":")
        start_dt = datetime.combine(target_date, time(int(hour), int(minute)))
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt, timezone.get_current_timezone())
        end_dt = start_dt + timedelta(minutes=duration_minutes)
        available = not Booking.mentor_has_overlap(mentor.id, start_dt, end_dt)
        slots.append(
            {
                "time": start_dt.strftime("%I:%M %p"),
                "start_at": start_dt.isoformat(),
                "end_at": end_dt.isoformat(),
                "available": available,
            }
        )

    return Response(
        {
            "mentor_id": mentor.id,
            "date": target_date.isoformat(),
            "duration_minutes": duration_minutes,
            "slots": slots,
        }
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsMentee])
def saved_mentors(request):
    if request.method == "GET":
        links = (
            SavedMentor.objects.filter(mentee=request.user)
            .select_related("mentor")
            .order_by("-created_at")
        )
        mentors = [link.mentor for link in links]
        return Response(MentorPublicSerializer(mentors, many=True).data)

    serializer = SavedMentorCreateSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    mentor = serializer.validated_data["mentor"]
    return Response(MentorPublicSerializer(mentor).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated, IsMentee])
def saved_mentor_detail(request, mentor_id: int):
    try:
        mentor = User.objects.get(pk=mentor_id, role=User.Role.MENTOR, is_active=True)
    except User.DoesNotExist:
        return Response({"detail": "Mentor not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        saved = SavedMentor.objects.filter(mentee=request.user, mentor=mentor).exists()
        return Response({"mentor_id": mentor.id, "saved": saved})

    deleted, _ = SavedMentor.objects.filter(mentee=request.user, mentor=mentor).delete()
    if not deleted:
        return Response({"detail": "Mentor was not in your saved list."}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsMentor])
def google_calendar_status(request):
    connected = mentor_has_calendar_access(request.user)
    return Response(
        {
            "oauth_configured": is_google_oauth_configured(),
            "connected": connected,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsMentor])
def google_calendar_auth_url(request):
    try:
        url = build_authorization_url()
    except GoogleCalendarNotConfigured as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({"auth_url": url})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsMentor])
def google_calendar_connect(request):
    code = (request.data.get("code") or "").strip()
    if not code:
        return Response({"detail": "Authorization code is required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        tokens = exchange_authorization_code(code)
    except GoogleCalendarNotConfigured as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except GoogleCalendarError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response(
            {"detail": f"Google token exchange failed: {exc}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    GoogleCalendarCredential.objects.update_or_create(
        user=request.user,
        defaults={
            "refresh_token": tokens["refresh_token"],
            "access_token": tokens.get("access_token", ""),
            "token_expiry": tokens.get("token_expiry"),
            "calendar_id": "primary",
        },
    )
    return Response({"connected": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsMentor])
def google_calendar_disconnect(request):
    GoogleCalendarCredential.objects.filter(user=request.user).delete()
    return Response({"connected": False})
