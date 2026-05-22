import { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  Trophy,
  Calendar,
  MessageCircle,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { JoinMeetingButton } from "./JoinMeetingButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api, type Booking, type Conversation, type MenteeEnrolledProgram, type MentorPublic } from "../lib/api";
import { getAuthUser } from "../lib/auth";
import { programCardStyle } from "../lib/menteeProgramCard";
import {
  BOOKING_STATUS_LABEL,
  formatSessionTimeRange,
  formatStartsInLabel,
  formatSessionDayLabel,
  sessionsTodayCount,
} from "../lib/sessionCalendar";

const defaultMentorImage =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?w=100";

export function MenteeDashboardHome() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const displayName =
    user?.username?.split("@")[0]?.replace(/\./g, " ") ?? "there";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedMentors, setSavedMentors] = useState<MentorPublic[]>([]);
  const [mentorMap, setMentorMap] = useState<Map<number, MentorPublic>>(new Map());
  const [enrolledPrograms, setEnrolledPrograms] = useState<MenteeEnrolledProgram[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingChatId, setOpeningChatId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getBookings(),
      api.getSavedMentors(),
      api.getMentors(),
      api.getMyPrograms(),
      api.getConversations(),
    ])
      .then(([bookingData, saved, mentors, programs, convos]) => {
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setSavedMentors(Array.isArray(saved) ? saved : []);
        setMentorMap(new Map(mentors.map((m) => [m.id, m])));
        setEnrolledPrograms(Array.isArray(programs) ? programs : []);
        setConversations(Array.isArray(convos) ? convos : []);
      })
      .catch(() => {
        setBookings([]);
        setSavedMentors([]);
        setEnrolledPrograms([]);
        setConversations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const overallProgress = useMemo(() => {
    if (enrolledPrograms.length === 0) return 0;
    const sum = enrolledPrograms.reduce((acc, p) => acc + p.progress, 0);
    return Math.round(sum / enrolledPrograms.length);
  }, [enrolledPrograms]);

  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  const openChatWithMentor = async (mentorId: number) => {
    setOpeningChatId(mentorId);
    try {
      const existing = conversations.find((c) => c.other_user_id === mentorId);
      if (existing) {
        navigate(`/mentee-dashboard/messages?conversation=${existing.id}`);
        return;
      }
      const conv = await api.createConversation({ mentor_id: mentorId });
      navigate(`/mentee-dashboard/messages?conversation=${conv.id}`);
    } catch {
      navigate("/mentee-dashboard/messages");
    } finally {
      setOpeningChatId(null);
    }
  };

  const now = Date.now();

  const upcomingSessions = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            (b.status === "pending" || b.status === "approved") &&
            new Date(b.start_at).getTime() >= now,
        )
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    [bookings, now],
  );

  const nextSession = upcomingSessions[0] ?? null;

  const messagePreview = useMemo(() => {
    const withUnread = conversations.filter((c) => c.unread_count > 0);
    const pick = withUnread[0] ?? conversations[0];
    if (!pick) {
      return nextSession
        ? `Message ${mentorMap.get(nextSession.mentor)?.display_name ?? "your mentor"} about your upcoming session.`
        : "Apply to a program or book a mentor to start a conversation.";
    }
    if (pick.unread_count > 0) {
      return pick.last_message
        ? `${pick.other_username}: ${pick.last_message}`
        : `New message from ${pick.other_username}`;
    }
    return pick.last_message
      ? `${pick.other_username}: ${pick.last_message}`
      : `Open your chat with ${pick.other_username}.`;
  }, [conversations, nextSession, mentorMap]);

  const messagesLink = useMemo(() => {
    const withUnread = conversations.find((c) => c.unread_count > 0);
    const pick = withUnread ?? conversations[0];
    return pick
      ? `/mentee-dashboard/messages?conversation=${pick.id}`
      : "/mentee-dashboard/messages";
  }, [conversations]);

  const pastSessions = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            b.status === "completed" ||
            (new Date(b.end_at).getTime() < now &&
              (b.status === "approved" || b.status === "pending")),
        )
        .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
        .slice(0, 10),
    [bookings, now],
  );

  const todayCount = sessionsTodayCount(bookings);

  const mentorDisplay = (booking: Booking) => {
    const profile = mentorMap.get(booking.mentor);
    return profile?.display_name ?? booking.mentor_username;
  };

  const mentorImage = (booking: Booking) =>
    mentorMap.get(booking.mentor)?.image ?? defaultMentorImage;

  return (
    <div className="max-w-[1400px] mx-auto p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 capitalize">
            Welcome back, {displayName}!
          </h1>
          <p className="text-gray-600">
            {loading
              ? "Loading your schedule…"
              : todayCount > 0
                ? `You have ${todayCount} session${todayCount === 1 ? "" : "s"} scheduled for today.`
                : upcomingSessions.length > 0
                  ? `You have ${upcomingSessions.length} upcoming session${upcomingSessions.length === 1 ? "" : "s"}.`
                  : "No upcoming sessions — book time with a mentor when you're ready."}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-xl">
          <Trophy className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Course Progress</p>
            <p className="text-lg font-bold text-gray-900">
              {loading ? "—" : enrolledPrograms.length > 0 ? `${overallProgress}% Overall` : "No programs yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
              <Link
                to="/mentee-dashboard/calendar"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Calendar
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Loading sessions…</p>
            ) : !nextSession ? (
              <div className="text-center py-8 border border-dashed rounded-xl">
                <p className="text-gray-600 mb-4">No upcoming sessions on your calendar.</p>
                <Link to="/mentee-dashboard/mentors">
                  <Button className="bg-blue-600 hover:bg-blue-700">Find a mentor</Button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-5">
                <div className="flex-1">
                  {formatStartsInLabel(nextSession.start_at) ? (
                    <div className="inline-block bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded mb-3">
                      {formatStartsInLabel(nextSession.start_at)}
                    </div>
                  ) : (
                    <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded mb-3">
                      {BOOKING_STATUS_LABEL[nextSession.status]}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {nextSession.notes || "Mentorship Session"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                    <span className="text-gray-400">👤</span> with {mentorDisplay(nextSession)}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-5">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{formatSessionDayLabel(nextSession.start_at)}</span>
                    <span className="text-gray-400 mx-1">•</span>
                    <Clock className="w-4 h-4" />
                    <span>{formatSessionTimeRange(nextSession.start_at, nextSession.end_at)}</span>
                  </div>

                  {upcomingSessions.length > 1 ? (
                    <p className="text-xs text-gray-500 mb-4">
                      +{upcomingSessions.length - 1} more on your{" "}
                      <Link to="/mentee-dashboard/calendar" className="text-blue-600 underline">
                        calendar
                      </Link>
                    </p>
                  ) : null}

                  <div className="flex gap-3 flex-wrap items-start">
                    {nextSession.status === "approved" ? (
                      <JoinMeetingButton
                        bookingId={nextSession.id}
                        meetingUrl={nextSession.meeting_url}
                        size="default"
                        label="Join Meeting"
                        className="bg-blue-600 hover:bg-blue-700"
                        onMeetingReady={(url) => {
                          setBookings((prev) =>
                            prev.map((b) =>
                              b.id === nextSession.id ? { ...b, meeting_url: url } : b,
                            ),
                          );
                        }}
                      />
                    ) : null}
                    <Link to="/mentee-dashboard/calendar">
                      <Button variant="outline">View in calendar</Button>
                    </Link>
                  </div>
                </div>

                <div className="w-56 h-40 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={mentorImage(nextSession)}
                    alt={mentorDisplay(nextSession)}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Active Programs</h2>
              <Link
                to="/mentee-dashboard/programs"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Browse programs
              </Link>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Loading programs…</p>
            ) : enrolledPrograms.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-xl">
                <p className="text-gray-600 mb-4">You have not enrolled in any programs yet.</p>
                <Link to="/mentee-dashboard/programs">
                  <Button className="bg-blue-600 hover:bg-blue-700">Explore programs</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {enrolledPrograms.slice(0, 4).map((program) => {
                  const style = programCardStyle(program.category);
                  return (
                    <Link
                      key={program.id}
                      to="/mentee-dashboard/programs"
                      className={`${style.color} rounded-xl p-5 block hover:shadow-md transition-shadow`}
                    >
                      {program.image_url ? (
                        <div className="h-20 rounded-lg overflow-hidden mb-3 bg-white/50">
                          <ImageWithFallback
                            src={program.image_url}
                            alt={program.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 ${style.iconBg} rounded-lg flex items-center justify-center text-2xl mb-4`}
                        >
                          {style.emoji}
                        </div>
                      )}
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 line-clamp-2">
                        {program.title}
                      </p>
                      <p className="text-[10px] text-gray-500 mb-2 capitalize">
                        {program.status === "approved" ? "Enrolled" : "Application pending"}
                        {program.mentor_name ? ` · ${program.mentor_name}` : ""}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-700">Progress</span>
                        <span className="text-sm font-bold text-blue-600">{program.progress}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2 mb-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${program.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 italic line-clamp-2">
                        Next: {program.next_step}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Past Sessions</h2>
            {pastSessions.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-xl">
                No past sessions yet.
              </p>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">
                        Mentor
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">
                        Topic
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">
                        Date
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastSessions.map((session) => (
                      <tr key={session.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={mentorMap.get(session.mentor)?.image ?? defaultMentorImage}
                              alt={mentorDisplay(session)}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="font-medium text-gray-900">
                              {mentorDisplay(session)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-700">
                          {session.notes || "Mentorship session"}
                        </td>
                        <td className="py-4 text-sm text-gray-600">
                          {formatSessionDayLabel(session.start_at)}
                        </td>
                        <td className="py-4 text-sm text-gray-600 capitalize">
                          {BOOKING_STATUS_LABEL[session.status]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Saved Mentors</h2>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : savedMentors.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-xl mb-4">
                Save mentors from their profile to see them here.
              </p>
            ) : (
              <div className="space-y-3">
                {savedMentors.map((mentor) => (
                  <div key={mentor.id} className="flex items-center justify-between">
                    <Link
                      to={`/mentors/${mentor.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80"
                    >
                      <img
                        src={mentor.image || defaultMentorImage}
                        alt={mentor.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {mentor.display_name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {mentor.title} @ {mentor.company}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-lg shrink-0 disabled:opacity-50"
                      disabled={openingChatId === mentor.id}
                      onClick={() => void openChatWithMentor(mentor.id)}
                      title="Message mentor"
                    >
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Link
              to="/mentee-dashboard/mentors"
              className="block w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2"
            >
              + Find New Mentors
            </Link>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-sm p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <Link to="/mentee-dashboard/messages" className="text-lg font-bold hover:underline">
                Messages
              </Link>
              {unreadMessages > 0 ? (
                <span className="bg-white/20 text-xs font-semibold px-2 py-1 rounded">
                  {unreadMessages} New
                </span>
              ) : null}
            </div>
            <p className="text-sm text-blue-50 mb-4 line-clamp-3">{messagePreview}</p>
            <Link to={messagesLink}>
              <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                {unreadMessages > 0 ? "Read messages" : conversations.length > 0 ? "Open messages" : "Go to messages"}
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Recent</span>
            </div>
            <div className="space-y-4">
              {nextSession && formatStartsInLabel(nextSession.start_at) ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Session Reminder</p>
                    <p className="text-xs text-gray-600">
                      Your session with {mentorDisplay(nextSession)} {formatStartsInLabel(nextSession.start_at)?.toLowerCase()}.
                    </p>
                  </div>
                </div>
              ) : null}
              {enrolledPrograms[0] ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Program enrolled</p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {enrolledPrograms[0].title} — {enrolledPrograms[0].next_step}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <Link
              to="/mentee-dashboard/calendar"
              className="block w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2"
            >
              View calendar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
