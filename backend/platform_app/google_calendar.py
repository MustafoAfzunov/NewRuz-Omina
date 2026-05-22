"""Create Google Calendar events with Google Meet conference links."""

from __future__ import annotations

import logging
import os

# Google may return extra scopes (e.g. userinfo) when include_granted_scopes is enabled.
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
import uuid
from datetime import datetime, timezone as dt_timezone

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


class GoogleCalendarError(Exception):
    """Raised when Meet cannot be created."""


class GoogleCalendarNotConfigured(GoogleCalendarError):
    pass


def _client_config() -> dict | None:
    client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or ""
    client_secret = getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", "") or ""
    if not client_id or not client_secret:
        return None
    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }


def is_google_oauth_configured() -> bool:
    return _client_config() is not None


def _expiry_for_google_auth(expiry):
    """google-auth expects naive UTC for Credentials.expiry."""
    if expiry is None:
        return None
    if timezone.is_aware(expiry):
        return expiry.astimezone(dt_timezone.utc).replace(tzinfo=None)
    return expiry


def _expiry_for_db(expiry):
    """Store timezone-aware UTC in Django when USE_TZ is enabled."""
    if expiry is None:
        return None
    if timezone.is_naive(expiry):
        return timezone.make_aware(expiry, dt_timezone.utc)
    return expiry.astimezone(dt_timezone.utc)


def get_redirect_uri() -> str:
    return getattr(
        settings,
        "GOOGLE_OAUTH_REDIRECT_URI",
        "http://127.0.0.1:5173/oauth/google/callback",
    )


def build_authorization_url() -> str:
    from google_auth_oauthlib.flow import Flow

    config = _client_config()
    if not config:
        raise GoogleCalendarNotConfigured(
            "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and "
            "GOOGLE_OAUTH_CLIENT_SECRET in the environment."
        )
    flow = Flow.from_client_config(
        config,
        scopes=SCOPES,
        redirect_uri=get_redirect_uri(),
        autogenerate_code_verifier=False,
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


def exchange_authorization_code(code: str) -> dict:
    from google_auth_oauthlib.flow import Flow

    config = _client_config()
    if not config:
        raise GoogleCalendarNotConfigured("Google OAuth is not configured.")
    flow = Flow.from_client_config(
        config,
        scopes=SCOPES,
        redirect_uri=get_redirect_uri(),
        autogenerate_code_verifier=False,
    )
    flow.fetch_token(code=code)
    creds = flow.credentials
    if not creds.refresh_token:
        raise GoogleCalendarError(
            "Google did not return a refresh token. Disconnect the app in your "
            "Google Account settings and connect again with consent."
        )
    return {
        "refresh_token": creds.refresh_token,
        "access_token": creds.token or "",
        "token_expiry": _expiry_for_db(creds.expiry),
    }


def _credentials_from_stored(refresh_token: str, access_token: str = "", token_expiry=None):
    from google.oauth2.credentials import Credentials

    creds = Credentials(
        token=access_token or None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_OAUTH_CLIENT_ID,
        client_secret=settings.GOOGLE_OAUTH_CLIENT_SECRET,
        scopes=SCOPES,
    )
    expiry = _expiry_for_google_auth(token_expiry)
    if expiry is not None:
        creds.expiry = expiry
    return creds


def _refresh_credentials_if_needed(creds, mentor) -> None:
    from google.auth.transport.requests import Request

    if not creds.refresh_token:
        return
    try:
        needs_refresh = creds.expired
    except TypeError:
        needs_refresh = True
    if needs_refresh:
        creds.refresh(Request())
        _persist_refreshed_tokens(mentor, creds)


def get_mentor_credentials(mentor):
    from .models import GoogleCalendarCredential

    try:
        stored = mentor.google_calendar_credential
        return _credentials_from_stored(
            stored.refresh_token,
            stored.access_token,
            stored.token_expiry,
        )
    except GoogleCalendarCredential.DoesNotExist:
        pass

    fallback = getattr(settings, "GOOGLE_OAUTH_REFRESH_TOKEN", "") or ""
    if fallback and is_google_oauth_configured():
        return _credentials_from_stored(fallback)

    return None


def mentor_has_calendar_access(mentor) -> bool:
    from .models import GoogleCalendarCredential

    if GoogleCalendarCredential.objects.filter(user=mentor).exists():
        return True
    return bool(getattr(settings, "GOOGLE_OAUTH_REFRESH_TOKEN", "")) and is_google_oauth_configured()


def _persist_refreshed_tokens(mentor, creds) -> None:
    from .models import GoogleCalendarCredential

    try:
        stored = mentor.google_calendar_credential
    except GoogleCalendarCredential.DoesNotExist:
        return
    if creds.token:
        stored.access_token = creds.token
    if creds.expiry:
        stored.token_expiry = _expiry_for_db(creds.expiry)
    stored.save(update_fields=["access_token", "token_expiry", "updated_at"])


def _extract_meet_url(event: dict) -> str | None:
    hangout = event.get("hangoutLink")
    if hangout:
        return hangout
    for entry in event.get("conferenceData", {}).get("entryPoints", []):
        if entry.get("entryPointType") == "video" and entry.get("uri"):
            return entry["uri"]
    return None


def create_meet_for_booking(booking) -> tuple[str, str]:
    """
    Create a Calendar event with Google Meet for the booking.
    Returns (meeting_url, google_event_id).
    """
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError

    creds = get_mentor_credentials(booking.mentor)
    if not creds:
        raise GoogleCalendarNotConfigured(
            "Connect Google Calendar in Mentor Settings before starting a video call."
        )

    _refresh_credentials_if_needed(creds, booking.mentor)

    service = build("calendar", "v3", credentials=creds, cache_discovery=False)

    start = booking.start_at
    end = booking.end_at
    if timezone.is_naive(start):
        start = timezone.make_aware(start, dt_timezone.utc)
    if timezone.is_naive(end):
        end = timezone.make_aware(end, dt_timezone.utc)

    mentee = booking.mentee
    mentor = booking.mentor
    summary = f"NewRuz mentorship: {mentee.get_full_name() or mentee.username}"
    description = booking.notes or "Mentorship session scheduled via NewRuz."

    attendees = []
    if mentee.email:
        attendees.append({"email": mentee.email})
    if mentor.email:
        attendees.append({"email": mentor.email})

    calendar_id = "primary"
    try:
        stored = mentor.google_calendar_credential
        calendar_id = stored.calendar_id or "primary"
    except Exception:
        pass

    body = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
        "attendees": attendees,
        "conferenceData": {
            "createRequest": {
                "requestId": f"newruz-booking-{booking.id}-{uuid.uuid4().hex[:8]}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }

    try:
        created = (
            service.events()
            .insert(
                calendarId=calendar_id,
                body=body,
                conferenceDataVersion=1,
                sendUpdates="all",
            )
            .execute()
        )
    except HttpError as exc:
        logger.exception("Google Calendar API error for booking %s", booking.id)
        raise GoogleCalendarError(
            f"Could not create Google Meet ({exc.resp.status if exc.resp else 'error'}). "
            "Check that Google Calendar API is enabled and your account allows Meet."
        ) from exc

    meet_url = _extract_meet_url(created)
    if not meet_url:
        raise GoogleCalendarError("Google Calendar event was created but no Meet link was returned.")

    return meet_url, created.get("id", "")
