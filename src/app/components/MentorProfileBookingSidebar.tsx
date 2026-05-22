import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { api, type MentorAvailability } from "../lib/api";
import {
  BOOKING_SESSION_OPTIONS,
  MENTOR_PROFILE_SESSION_LABELS,
  buildMonthGrid,
  formatBookingDateLabel,
  getBookingDraft,
  monthLabel,
  sessionPriceForMentor,
  setBookingDraft,
  type BookingSessionType,
} from "../lib/bookingDraft";

type AvailabilitySlot = MentorAvailability["slots"][number];

type MentorProfileBookingSidebarProps = {
  mentorId: number;
  hourlyRate: number;
};

function defaultViewDate(draftDate?: string): { year: number; month: number } {
  if (draftDate) {
    const [y, m] = draftDate.split("-").map(Number);
    return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function MentorProfileBookingSidebar({ mentorId, hourlyRate }: MentorProfileBookingSidebarProps) {
  const navigate = useNavigate();
  const saved = getBookingDraft();
  const savedForMentor = saved.mentorId === mentorId;

  const initialView = defaultViewDate(savedForMentor ? saved.date : undefined);
  const [selectedSession, setSelectedSession] = useState<BookingSessionType | null>(
    () => (savedForMentor ? saved.session ?? null : null) ?? BOOKING_SESSION_OPTIONS[0],
  );
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    savedForMentor ? saved.date ?? null : null,
  );
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    setBookingDraft({ mentorId });
  }, [mentorId]);

  useEffect(() => {
    if (!selectedSession || !selectedDate) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");

    void api
      .getMentorAvailability(mentorId, selectedDate, selectedSession.durationMinutes)
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots);
        setSelectedSlot((current) => {
          if (current && !data.slots.some((s) => s.start_at === current.start_at && s.available)) {
            return null;
          }
          return current;
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setSlotsError(err instanceof Error ? err.message : "Could not load availability.");
          setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mentorId, selectedDate, selectedSession?.durationMinutes]);

  useEffect(() => {
    if (!savedForMentor || !saved.date || !saved.time || slots.length === 0) return;
    const match = slots.find(
      (slot) =>
        slot.time === saved.time &&
        slot.available &&
        (saved.slotStartAt ? slot.start_at === saved.slotStartAt : true),
    );
    if (match) setSelectedSlot(match);
  }, [slots, savedForMentor, saved.date, saved.time, saved.slotStartAt]);

  const calendarCells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const pickSession = (session: BookingSessionType) => {
    setSelectedSession(session);
    setSelectedSlot(null);
    setBookingError("");
    setBookingDraft({ mentorId, session });
  };

  const pickDate = (isoDate: string) => {
    setSelectedDate(isoDate);
    setSelectedSlot(null);
    setBookingError("");
    setBookingDraft({ mentorId, date: isoDate, time: null, slotStartAt: null, slotEndAt: null });
  };

  const pickSlot = (slot: AvailabilitySlot) => {
    if (!slot.available || !selectedDate || !selectedSession) return;
    setSelectedSlot(slot);
    setBookingError("");
    setBookingDraft({
      mentorId,
      session: selectedSession,
      date: selectedDate,
      time: slot.time,
      slotStartAt: slot.start_at,
      slotEndAt: slot.end_at,
    });
  };

  const canContinue = Boolean(selectedSession && selectedDate && selectedSlot?.available);

  const handleContinue = () => {
    if (!selectedSession || !selectedDate || !selectedSlot) {
      setBookingError("Select a session type, date, and available time to continue.");
      return;
    }
    setBookingDraft({
      mentorId,
      session: selectedSession,
      date: selectedDate,
      time: selectedSlot.time,
      slotStartAt: selectedSlot.start_at,
      slotEndAt: selectedSlot.end_at,
    });
    navigate("/booking/details");
  };

  return (
    <div className="space-y-5">
      <section className="bg-white border rounded-xl p-5">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Session Formats</h3>
        <div className="space-y-3">
          {BOOKING_SESSION_OPTIONS.map((session, index) => {
            const labels = MENTOR_PROFILE_SESSION_LABELS[index];
            const isSelected = selectedSession?.title === session.title;
            const price = sessionPriceForMentor(session, hourlyRate);
            return (
              <button
                key={session.title}
                type="button"
                onClick={() => pickSession(session)}
                className={`w-full border rounded-lg p-3 flex justify-between text-left transition-colors ${
                  isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                }`}
              >
                <div>
                  <p className="font-semibold text-gray-900">{labels.label}</p>
                  <p className="text-xs text-gray-500">{labels.subtitle}</p>
                </div>
                <p className={`font-semibold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                  ${price}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Availability</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 min-w-[88px] text-center">
              {monthLabel(viewYear, viewMonth)}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <span key={`${day}-${i}`}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-4">
          {calendarCells.map((cell) => {
            if (cell.day === null) {
              return <div key={cell.key} className="h-8" />;
            }
            const isSelected = selectedDate === cell.isoDate;
            return (
              <button
                key={cell.key}
                type="button"
                disabled={cell.muted}
                onClick={() => cell.isoDate && pickDate(cell.isoDate)}
                className={`h-8 rounded text-sm transition-colors ${
                  isSelected
                    ? "bg-blue-700 text-white"
                    : cell.muted
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <p className="text-xs font-semibold tracking-wide text-gray-500 mb-3">
          {selectedDate
            ? `AVAILABLE SLOTS (${formatBookingDateLabel(selectedDate)})`
            : "SELECT A DATE TO SEE SLOTS"}
        </p>

        {!selectedDate ? (
          <p className="text-sm text-gray-500 mb-4">Pick a day on the calendar first.</p>
        ) : null}
        {slotsLoading ? (
          <p className="text-sm text-gray-500 mb-4">Loading availability…</p>
        ) : null}
        {slotsError ? <p className="text-sm text-red-600 mb-4">{slotsError}</p> : null}

        <div className="grid grid-cols-2 gap-2 mb-4">
          {slots.map((slot) => {
            const isBooked = !slot.available;
            const isSelected = selectedSlot?.start_at === slot.start_at;
            return (
              <button
                key={slot.start_at}
                type="button"
                disabled={!selectedDate || isBooked || slotsLoading}
                onClick={() => pickSlot(slot)}
                className={`h-9 border rounded-md text-sm transition-colors ${
                  isBooked
                    ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isBooked ? `${slot.time} · Booked` : slot.time}
              </button>
            );
          })}
        </div>

        {bookingError ? <p className="text-sm text-red-600 mb-3">{bookingError}</p> : null}

        <Button
          type="button"
          className="w-full bg-blue-700 hover:bg-blue-800 h-11 text-base disabled:opacity-50"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          {canContinue ? "Continue to booking" : "Select date & time"}
        </Button>
      </section>
    </div>
  );
}
