import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Users } from "lucide-react";
import { Button } from "./ui/button";
import { api, type Booking, type MenteePublic } from "../lib/api";
import { MENTOR_AVATAR_COLORS, menteeInitials } from "../lib/mentorDashboard";

export function MentorParticipantsPage() {
  const [mentees, setMentees] = useState<MenteePublic[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([api.getMentees(), api.getBookings()])
      .then(([menteeData, bookingData]) => {
        setMentees(Array.isArray(menteeData) ? menteeData : []);
        setBookings(Array.isArray(bookingData) ? bookingData : []);
      })
      .catch((err) => {
        setMentees([]);
        setBookings([]);
        setError(err instanceof Error ? err.message : "Failed to load participants.");
      })
      .finally(() => setLoading(false));
  }, []);

  const participants = useMemo(() => {
    const stats = new Map<
      number,
      { mentee: MenteePublic; total: number; upcoming: number; pending: number }
    >();

    for (const mentee of mentees) {
      stats.set(mentee.id, { mentee, total: 0, upcoming: 0, pending: 0 });
    }

    const now = Date.now();
    for (const booking of bookings) {
      const entry = stats.get(booking.mentee) ?? {
        mentee: {
          id: booking.mentee,
          username: booking.mentee_username,
          email: "",
        },
        total: 0,
        upcoming: 0,
        pending: 0,
      };
      entry.total += 1;
      if (booking.status === "pending") entry.pending += 1;
      if (
        (booking.status === "pending" || booking.status === "approved") &&
        new Date(booking.start_at).getTime() >= now
      ) {
        entry.upcoming += 1;
      }
      stats.set(booking.mentee, entry);
    }

    return Array.from(stats.values()).sort((a, b) =>
      a.mentee.username.localeCompare(b.mentee.username),
    );
  }, [mentees, bookings]);

  const activeCount = participants.filter((p) => p.pending > 0 || p.upcoming > 0).length;

  return (
    <>
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Participants</h1>
            <p className="text-sm text-gray-500">
              Mentees registered on the platform and your session history with them.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-8">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total mentees</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{participants.length}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Active mentees</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total sessions</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{bookings.length}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading participants…</p>
        ) : participants.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed p-10 text-center">
            <p className="text-gray-600 mb-4">No mentees in the system yet.</p>
            <Link to="/mentor-dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Mentee</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Sessions</th>
                  <th className="px-5 py-3">Upcoming</th>
                  <th className="px-5 py-3">Pending</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((row, index) => {
                  const colors = MENTOR_AVATAR_COLORS[index % MENTOR_AVATAR_COLORS.length];
                  return (
                    <tr key={row.mentee.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center font-bold text-xs`}
                          >
                            {menteeInitials(row.mentee.username)}
                          </div>
                          <span className="font-semibold text-gray-900">{row.mentee.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{row.mentee.email || "—"}</td>
                      <td className="px-5 py-4">{row.total}</td>
                      <td className="px-5 py-4">{row.upcoming}</td>
                      <td className="px-5 py-4">{row.pending}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
