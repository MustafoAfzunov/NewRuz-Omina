from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .messaging_views import ConversationViewSet
from .program_enrollment_views import my_programs
from .admin_api import admin_mentor_approve, admin_mentor_reject, admin_user_delete, admin_users
from .views import (
    BookingViewSet,
    EventViewSet,
    OpportunityViewSet,
    ProgramViewSet,
    ReviewViewSet,
    admin_dashboard,
    google_calendar_auth_url,
    google_calendar_connect,
    google_calendar_disconnect,
    google_calendar_status,
    mentor_availability,
    mentor_detail,
    mentor_list,
    mentee_list,
    mentee_dashboard,
    mentor_dashboard,
    saved_mentor_detail,
    saved_mentors,
)

router = DefaultRouter()
router.register(r"programs", ProgramViewSet, basename="program")
router.register(r"events", EventViewSet, basename="event")
router.register(r"opportunities", OpportunityViewSet, basename="opportunity")
router.register(r"bookings", BookingViewSet, basename="booking")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"conversations", ConversationViewSet, basename="conversation")

urlpatterns = [
    path("", include(router.urls)),
    path("mentors/", mentor_list, name="mentor-list"),
    path("mentees/", mentee_list, name="mentee-list"),
    path("mentors/<int:pk>/", mentor_detail, name="mentor-detail"),
    path("mentors/<int:pk>/availability/", mentor_availability, name="mentor-availability"),
    path("dashboard/mentee/", mentee_dashboard, name="dashboard-mentee"),
    path("dashboard/mentor/", mentor_dashboard, name="dashboard-mentor"),
    path("dashboard/admin/", admin_dashboard, name="dashboard-admin"),
    path("admin/users/", admin_users, name="admin-users"),
    path("admin/users/<int:pk>/", admin_user_delete, name="admin-user-delete"),
    path("admin/mentors/<int:pk>/approve/", admin_mentor_approve, name="admin-mentor-approve"),
    path("admin/mentors/<int:pk>/reject/", admin_mentor_reject, name="admin-mentor-reject"),
    path("saved-mentors/", saved_mentors, name="saved-mentors"),
    path("saved-mentors/<int:mentor_id>/", saved_mentor_detail, name="saved-mentor-detail"),
    path("google/calendar/status/", google_calendar_status, name="google-calendar-status"),
    path("google/calendar/auth-url/", google_calendar_auth_url, name="google-calendar-auth-url"),
    path("google/calendar/connect/", google_calendar_connect, name="google-calendar-connect"),
    path("google/calendar/disconnect/", google_calendar_disconnect, name="google-calendar-disconnect"),
    path("my-programs/", my_programs, name="my-programs"),
]
