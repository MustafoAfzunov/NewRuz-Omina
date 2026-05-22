import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Calendar as CalendarIcon,
  Users,
  Star,
  Bell,
  Plus,
  Video,
} from "lucide-react";
import { Button } from "./ui/button";
import { JoinMeetingButton } from "./JoinMeetingButton";
import { MentorDashboardAvailability } from "./MentorDashboardAvailability";
import { api, type Conversation } from "../lib/api";
import { authFetch, getAuthUser } from "../lib/auth";

const recentReviews = [
  {
    rating: 5,
    text: '"Dr. Thorne helped me nail my architecture interview. His explanations are incredibly clear."',
    author: "Liam P., Software Engineer",
    date: "2 days ago",
  },
  {
    rating: 5,
    text: '"Excellent mentor. Patient and insightful. Would highly recommend for anyone learning Scalability."',
    author: "Elena G., Senior Dev",
    date: "1 week ago",
  },
];

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
];

type Mentee = {
  id: number;
  username: string;
  email: string;
};

type Booking = {
  id: number;
  mentee: number;
  mentor: number;
  mentee_username: string;
  mentor_username: string;
  start_at: string;
  end_at: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  notes: string;
  meeting_url?: string;
};

function extractErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Request failed.";
  }
  const data = payload as Record<string, unknown>;
  if (typeof data.detail === "string") return data.detail;
  const firstValue = Object.values(data)[0];
  if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
  if (typeof firstValue === "string") return firstValue;
  return "Request failed.";
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload));
  }
  return payload as T;
}

function formatLocalDateTimeInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSessionRange(startAt: string, endAt: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(new Date(startAt))} – ${new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(endAt))}`;
}

function menteeInitials(username: string): string {
  const parts = username.replace(/@.*/, "").split(/[._\s-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

export function MentorDashboard() {
  const currentUser = getAuthUser();
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMentees, setIsLoadingMentees] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState("");
  const [startAt, setStartAt] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1, 0, 0, 0);
    return formatLocalDateTimeInput(date);
  });
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [notes, setNotes] = useState("");
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [actionBookingId, setActionBookingId] = useState<number | null>(null);
  const [inboxPreview, setInboxPreview] = useState<Conversation[]>([]);

  const mentorId = currentUser?.id ?? null;
  const unreadMessages = inboxPreview.reduce((sum, c) => sum + c.unread_count, 0);
  const now = Date.now();

  const pendingRequests = bookings
    .filter((booking) => booking.status === "pending")
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const upcomingSessions = bookings
    .filter(
      (booking) =>
        (booking.status === "pending" || booking.status === "approved") &&
        new Date(booking.start_at).getTime() >= now,
    )
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const [showAllParticipants, setShowAllParticipants] = useState(false);

  const activeMenteeList = useMemo(() => {
    const byMenteeId = new Map<
      number,
      { id: number; username: string; status: Booking["status"] }
    >();

    for (const booking of bookings) {
      if (booking.status !== "pending" && booking.status !== "approved") {
        continue;
      }
      if (!byMenteeId.has(booking.mentee)) {
        byMenteeId.set(booking.mentee, {
          id: booking.mentee,
          username: booking.mentee_username,
          status: booking.status,
        });
      }
    }

    const emailById = new Map(mentees.map((mentee) => [mentee.id, mentee.email]));

    return Array.from(byMenteeId.values())
      .map((mentee) => ({
        ...mentee,
        email: emailById.get(mentee.id) ?? "",
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [bookings, mentees]);

  const uniqueMenteeCount = activeMenteeList.length;

  const visibleActiveMentees = activeMenteeList.slice(0, 3);
  const hiddenActiveMenteeCount = Math.max(0, activeMenteeList.length - visibleActiveMentees.length);

  const refreshBookings = async () => {
    const response = await authFetch("/bookings/");
    const data = await parseApiResponse<Booking[]>(response);
    setBookings(Array.isArray(data) ? data : []);
    setBookingsError("");
  };

  useEffect(() => {
    void api
      .getConversations()
      .then((data) => setInboxPreview(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setInboxPreview([]));
  }, []);

  useEffect(() => {
    setBookingsLoading(true);
    refreshBookings()
      .catch((err) => {
        setBookings([]);
        setBookingsError(err instanceof Error ? err.message : "Could not load sessions.");
      })
      .finally(() => setBookingsLoading(false));
  }, []);

  useEffect(() => {
    authFetch("/mentees/")
      .then((response) => parseApiResponse<Mentee[]>(response))
      .then((data) => setMentees(Array.isArray(data) ? data : []))
      .catch(() => setMentees([]));
  }, []);

  useEffect(() => {
    if (!isNewSessionOpen) return;

    setIsLoadingMentees(true);
    setFormError("");
    authFetch("/mentees/")
      .then((response) => parseApiResponse<Mentee[]>(response))
      .then((data) => {
        setMentees(data);
        setSelectedMenteeId((current) => current || String(data[0]?.id ?? ""));
      })
      .catch((error) => {
        setFormError(error instanceof Error ? error.message : "Unable to load mentees.");
      })
      .finally(() => {
        setIsLoadingMentees(false);
      });
  }, [isNewSessionOpen]);

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const startDate = new Date(startAt);
    const duration = Number(durationMinutes);
    if (!selectedMenteeId || Number.isNaN(startDate.getTime()) || !Number.isFinite(duration) || duration <= 0) {
      setFormError("Choose a mentee, start time, and valid duration.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
      const response = await authFetch("/bookings/create-as-mentor/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentee: Number(selectedMenteeId),
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          notes,
        }),
      });
      await parseApiResponse<Booking>(response);
      await refreshBookings();
      setFormSuccess("Session created successfully.");
      setNotes("");
      setIsNewSessionOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (bookingId: number) => {
    setActionBookingId(bookingId);
    try {
      const response = await authFetch(`/bookings/${bookingId}/approve/`, { method: "POST" });
      await parseApiResponse<Booking>(response);
      await refreshBookings();
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : "Could not approve request.");
    } finally {
      setActionBookingId(null);
    }
  };

  const handleReject = async (bookingId: number) => {
    setActionBookingId(bookingId);
    try {
      const response = await authFetch(`/bookings/${bookingId}/reject/`, { method: "POST" });
      await parseApiResponse<Booking>(response);
      await refreshBookings();
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : "Could not decline request.");
    } finally {
      setActionBookingId(null);
    }
  };

  return (
    <>
          <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Mentor Overview</h1>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Sessions</p>
                  <p className="text-xl font-bold text-blue-600">{bookings.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Active Mentees</p>
                  <p className="text-xl font-bold text-blue-600">{uniqueMenteeCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                  <p className="text-xl font-bold text-blue-600">{pendingRequests.length}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="button" className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5 text-gray-700" />
              </button>
              <Button
                onClick={() => setIsNewSessionOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Session
              </Button>
            </div>
          </header>

          <div className="max-w-[1400px] mx-auto p-8">
            {bookingsError ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {bookingsError}
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">Pending Session Requests</h2>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {pendingRequests.length} waiting
                    </span>
                  </div>

                  <div className="space-y-4">
                    {bookingsLoading ? (
                      <p className="text-sm text-gray-500">Loading requests…</p>
                    ) : pendingRequests.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-xl">
                        No pending requests right now.
                      </p>
                    ) : (
                      pendingRequests.map((request, index) => {
                        const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
                        return (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center font-bold text-sm`}
                              >
                                {menteeInitials(request.mentee_username)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{request.mentee_username}</p>
                                <p className="text-sm text-gray-600">
                                  {request.notes || "Mentorship session request"}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  {formatSessionRange(request.start_at, request.end_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-gray-700"
                                disabled={actionBookingId === request.id}
                                onClick={() => void handleReject(request.id)}
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={actionBookingId === request.id}
                                onClick={() => void handleApprove(request.id)}
                              >
                                Accept
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Video className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">Upcoming Schedule</h2>
                  </div>

                  <div className="space-y-4">
                    {bookingsLoading ? (
                      <p className="text-sm text-gray-500">Loading schedule…</p>
                    ) : upcomingSessions.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-xl">
                        No upcoming sessions. Create one with &quot;New Session&quot; or accept a request.
                      </p>
                    ) : (
                      upcomingSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-start justify-between p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">Mentorship Session</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Mentee: {session.mentee_username} ·{" "}
                              <span className="capitalize">{session.status}</span>
                            </p>
                            {session.notes ? (
                              <p className="text-xs text-gray-500 mb-2">{session.notes}</p>
                            ) : null}
                            {session.status === "approved" ? (
                              <JoinMeetingButton
                                bookingId={session.id}
                                meetingUrl={session.meeting_url}
                                onMeetingReady={(url) => {
                                  setBookings((prev) =>
                                    prev.map((b) =>
                                      b.id === session.id ? { ...b, meeting_url: url } : b,
                                    ),
                                  );
                                }}
                              />
                            ) : null}
                          </div>
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {formatSessionDate(session.start_at)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Star className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">Recent Reviews</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {recentReviews.map((review, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-300 text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 italic">{review.text}</p>
                        <p className="text-xs text-gray-600 font-medium">— {review.author}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {mentorId ? (
                  <MentorDashboardAvailability mentorId={mentorId} />
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm p-5 text-sm text-gray-500">
                    Sign in as a mentor to view availability.
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      to="/mentor-dashboard/messages"
                      className="text-lg font-bold text-gray-900 hover:text-blue-600"
                    >
                      Messages
                    </Link>
                    {unreadMessages > 0 ? (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadMessages}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {inboxPreview.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        No messages yet.{" "}
                        <Link to="/mentor-dashboard/messages" className="text-blue-600 underline">
                          Start a chat
                        </Link>
                      </p>
                    ) : (
                      inboxPreview.slice(0, 3).map((conv) => (
                        <Link
                          key={conv.id}
                          to="/mentor-dashboard/messages"
                          className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {menteeInitials(conv.other_username)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {conv.other_username}
                              </p>
                              {conv.unread_count > 0 ? (
                                <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 ml-2" />
                              ) : null}
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              {conv.last_message || "No messages yet"}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-bold text-gray-900">Active Mentees</h2>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {uniqueMenteeCount} total
                    </span>
                  </div>

                  {bookingsLoading ? (
                    <p className="text-sm text-gray-500 mb-4">Loading mentees…</p>
                  ) : activeMenteeList.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4 py-3 text-center border border-dashed rounded-lg">
                      No active mentees yet. Accept a request or schedule a session.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        {visibleActiveMentees.map((mentee, index) => {
                          const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
                          return (
                            <div
                              key={mentee.id}
                              title={mentee.email || mentee.username}
                              className={`w-12 h-12 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? "ring-2 ring-blue-600" : ""
                              }`}
                            >
                              {menteeInitials(mentee.username)}
                            </div>
                          );
                        })}
                        {hiddenActiveMenteeCount > 0 ? (
                          <div
                            className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600"
                            title={`${hiddenActiveMenteeCount} more active mentees`}
                          >
                            +{hiddenActiveMenteeCount}
                          </div>
                        ) : null}
                      </div>

                      {showAllParticipants ? (
                        <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                          {activeMenteeList.map((mentee, index) => {
                            const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
                            return (
                              <li
                                key={mentee.id}
                                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
                              >
                                <div
                                  className={`w-9 h-9 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center text-xs font-bold shrink-0`}
                                >
                                  {menteeInitials(mentee.username)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {mentee.username}
                                  </p>
                                  {mentee.email ? (
                                    <p className="text-xs text-gray-500 truncate">{mentee.email}</p>
                                  ) : null}
                                </div>
                                <span className="text-[10px] font-bold uppercase text-blue-600 shrink-0">
                                  {mentee.status}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAllParticipants((open) => !open)}
                      disabled={activeMenteeList.length === 0}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {showAllParticipants ? "Hide Participants" : "Show Participants"}
                    </button>
                    <Link
                      to="/mentor-dashboard/participants"
                      className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2 border border-blue-200 rounded-lg hover:bg-blue-50 block"
                    >
                      Manage All Participants
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
      {isNewSessionOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Session</h2>
                <p className="text-sm text-gray-500">
                  Schedule a session directly with one of your mentees.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSessionOpen(false)}
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close new session form"
              >
                X
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateSession}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mentee</label>
                <select
                  value={selectedMenteeId}
                  onChange={(event) => setSelectedMenteeId(event.target.value)}
                  disabled={isLoadingMentees}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  required
                >
                  <option value="">
                    {isLoadingMentees ? "Loading mentees..." : "Select a mentee"}
                  </option>
                  {mentees.map((mentee) => (
                    <option key={mentee.id} value={mentee.id}>
                      {mentee.username} ({mentee.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  placeholder="Topic, meeting link, or anything the mentee should prepare."
                />
              </div>

              {formError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
              ) : null}
              {formSuccess ? (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{formSuccess}</p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsNewSessionOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoadingMentees || mentees.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Creating..." : "Create Session"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
