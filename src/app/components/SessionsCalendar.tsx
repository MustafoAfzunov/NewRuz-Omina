import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { JoinMeetingButton } from "./JoinMeetingButton";
import { api, type Booking } from "../lib/api";
import { buildMonthGrid, monthLabel } from "../lib/bookingDraft";
import {
  BOOKING_STATUS_CLASS,
  BOOKING_STATUS_LABEL,
  bookingLocalDateKey,
  formatSessionDateLong,
  formatSessionTimeRange,
  groupBookingsByDate,
  isCalendarVisibleStatus,
} from "../lib/sessionCalendar";

type SessionsCalendarProps = {
  role: "mentee" | "mentor";
};

export function SessionsCalendar({ role }: SessionsCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => bookingLocalDateKey(today.toISOString()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  const loadBookings = () => {
    setLoading(true);
    setError("");
    return api
      .getBookings()
      .then((data) => {
        setBookings(Array.isArray(data) ? data.filter((b) => isCalendarVisibleStatus(b.status)) : []);
      })
      .catch((err) => {
        setBookings([]);
        setError(err instanceof Error ? err.message : "Could not load sessions.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const byDate = useMemo(() => groupBookingsByDate(bookings), [bookings]);
  const calendarCells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const selectedBookings = byDate.get(selectedDate) ?? [];

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const runAction = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionId(null);
    }
  };

  const counterpart = (booking: Booking) =>
    role === "mentor" ? booking.mentee_username : booking.mentor_username;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Calendar</h1>
          <p className="text-gray-600 text-sm mt-1">
            {role === "mentor"
              ? "View and manage all mentorship sessions with your mentees."
              : "See your upcoming and past sessions with mentors."}
          </p>
        </div>
        {role === "mentee" ? (
          <Link to="/booking">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              Book a session
            </Button>
          </Link>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{monthLabel(viewYear, viewMonth)}</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                  setSelectedDate(bookingLocalDateKey(today.toISOString()));
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-xs text-gray-400 font-semibold mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              if (cell.day === null) {
                return <div key={cell.key} className="h-12" />;
              }
              const dayBookings = cell.isoDate ? (byDate.get(cell.isoDate) ?? []) : [];
              const isSelected = selectedDate === cell.isoDate;
              const hasSessions = dayBookings.length > 0;
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={cell.muted}
                  onClick={() => cell.isoDate && setSelectedDate(cell.isoDate)}
                  className={`h-12 rounded-xl text-sm relative transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : cell.muted
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  {cell.day}
                  {hasSessions && !isSelected ? (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <span
                          key={b.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === "pending"
                              ? "bg-amber-400"
                              : b.status === "approved"
                                ? "bg-blue-500"
                                : "bg-green-500"
                          }`}
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Confirmed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Completed
            </span>
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {formatSessionDateLong(`${selectedDate}T12:00:00`)}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {loading
              ? "Loading…"
              : `${selectedBookings.length} session${selectedBookings.length === 1 ? "" : "s"}`}
          </p>

          {loading ? (
            <p className="text-sm text-gray-500">Loading sessions…</p>
          ) : selectedBookings.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl">
              <p className="text-sm text-gray-500 mb-3">No sessions on this day.</p>
              {role === "mentee" ? (
                <Link to="/booking">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Book a session
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {selectedBookings.map((booking) => {
                const isPast = new Date(booking.end_at).getTime() < Date.now();
                return (
                  <div key={booking.id} className="border rounded-xl p-4 hover:border-gray-300">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{counterpart(booking)}</p>
                        <p className="text-sm text-gray-600">
                          {formatSessionTimeRange(booking.start_at, booking.end_at)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${BOOKING_STATUS_CLASS[booking.status]}`}
                      >
                        {BOOKING_STATUS_LABEL[booking.status]}
                      </span>
                    </div>
                    {booking.notes ? (
                      <p className="text-xs text-gray-500 mb-3">{booking.notes}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {role === "mentor" && booking.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 h-8"
                            disabled={actionId === booking.id}
                            onClick={() => {
                              setActionId(booking.id);
                              void runAction(() => api.approveBooking(booking.id));
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={actionId === booking.id}
                            onClick={() => {
                              setActionId(booking.id);
                              void runAction(() => api.rejectBooking(booking.id));
                            }}
                          >
                            Decline
                          </Button>
                        </>
                      ) : null}
                      {role === "mentor" &&
                      booking.status === "approved" &&
                      isPast ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={actionId === booking.id}
                          onClick={() => {
                            setActionId(booking.id);
                            void runAction(() => api.completeBooking(booking.id));
                          }}
                        >
                          Mark completed
                        </Button>
                      ) : null}
                      {booking.status === "approved" && !isPast ? (
                        <JoinMeetingButton
                          bookingId={booking.id}
                          meetingUrl={booking.meeting_url}
                          onMeetingReady={() => void loadBookings()}
                        />
                      ) : null}
                      {role === "mentee" &&
                      (booking.status === "pending" || booking.status === "approved") &&
                      !isPast ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={actionId === booking.id}
                          onClick={() => {
                            setActionId(booking.id);
                            void runAction(() => api.cancelBooking(booking.id));
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
