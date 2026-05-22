import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { api, type MentorAvailability } from "../lib/api";
import {
  buildMonthGrid,
  formatBookingDateLabel,
  getBookingDraft,
  monthLabel,
  setBookingDraft,
} from "../lib/bookingDraft";
import { BookingProgressNav } from "./BookingProgressNav";

type AvailabilitySlot = MentorAvailability["slots"][number];

function defaultViewDate(): { year: number; month: number } {
  const draft = getBookingDraft();
  if (draft.date) {
    const [y, m] = draft.date.split("-").map(Number);
    return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function BookingDateTimePage() {
  const navigate = useNavigate();
  const initialDraft = getBookingDraft();
  const initialView = defaultViewDate();

  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDraft.date ?? null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initialDraft.time ?? null);
  const [mentorId, setMentorId] = useState<number | null>(initialDraft.mentorId ?? null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const draft = getBookingDraft();

  useEffect(() => {
    if (mentorId) return;
    void api.getMentors().then((mentors) => {
      if (mentors[0]) setMentorId(mentors[0].id);
    });
  }, [mentorId]);

  useEffect(() => {
    const session = draft.session;
    if (!mentorId || !selectedDate || !session) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");

    void api
      .getMentorAvailability(mentorId, selectedDate, session.durationMinutes)
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots);
        setSelectedSlot((current) => {
          if (current && !data.slots.some((slot) => slot.time === current && slot.available)) {
            setBookingDraft({ time: null, slotStartAt: null, slotEndAt: null });
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
  }, [mentorId, selectedDate, draft.session?.durationMinutes]);

  const calendarCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  if (!draft.session) {
    return (
      <div className="min-h-screen bg-[#f4f5f9] flex items-center justify-center p-8">
        <div className="bg-white border rounded-2xl p-8 max-w-md text-center">
          <p className="text-gray-700 mb-4">Please select a session type first.</p>
          <Link to="/booking">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to session selection</Button>
          </Link>
        </div>
      </div>
    );
  }

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const pickDate = (isoDate: string) => {
    setSelectedDate(isoDate);
    setSelectedSlot(null);
    setBookingDraft({ date: isoDate, time: null, slotStartAt: null, slotEndAt: null });
  };

  const pickSlot = (slot: AvailabilitySlot) => {
    if (!selectedDate || !slot.available) return;
    setSelectedSlot(slot.time);
    setBookingDraft({
      date: selectedDate,
      time: slot.time,
      slotStartAt: slot.start_at,
      slotEndAt: slot.end_at,
      mentorId: mentorId ?? undefined,
    });
  };

  const selectedSlotAvailable = slots.some(
    (slot) =>
      slot.available &&
      (slot.time === selectedSlot ||
        (draft.slotStartAt != null && slot.start_at === draft.slotStartAt)),
  );
  const canConfirm = Boolean(selectedDate && selectedSlot && selectedSlotAvailable);

  const handleConfirm = () => {
    if (!canConfirm || !selectedDate || !selectedSlot || !draft.session) return;
    if (!selectedSlotAvailable) return;
    const slot = slots.find((item) => item.time === selectedSlot && item.available);
    if (!slot) return;
    setBookingDraft({
      session: draft.session,
      date: selectedDate,
      time: selectedSlot,
      slotStartAt: slot.start_at,
      slotEndAt: slot.end_at,
      mentorId: mentorId ?? undefined,
    });
    navigate("/booking/details");
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <header className="bg-white border-b px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-3xl">Book Appointment</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <button type="button" className="w-9 h-9 rounded-lg border bg-gray-50 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </button>
            <a href="#" className="font-medium hover:text-blue-600">
              My Bookings
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-7">
        <div className="mb-6 rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500 mb-3">Booking Progress • Step 2 of 4</p>
          <BookingProgressNav currentStep={2} variant="bar" />
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
          <Link to="/booking" className="hover:text-blue-600">
            Service Selection
          </Link>
          <span>›</span>
          <span className="text-blue-700 font-medium border-b border-blue-700">Choose Time Slot</span>
          <span>›</span>
          <span>Confirmation</span>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-2">Select Date &amp; Time</h1>
        <p className="text-gray-600 text-2xl mb-7">
          Choose your preferred date on the calendar and select an available time window.
        </p>

        <div className="grid grid-cols-12 gap-5">
          <section className="col-span-7 bg-white border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-3xl font-semibold text-gray-900">{monthLabel(viewYear, viewMonth)}</h2>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-xs text-gray-400 font-semibold mb-3">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div key={day} className="text-center py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell) => {
                if (cell.day === null) {
                  return <div key={cell.key} className="h-16" />;
                }

                const isSelected = selectedDate === cell.isoDate;
                const isBooked = false;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={cell.muted || isBooked}
                    onClick={() => cell.isoDate && pickDate(cell.isoDate)}
                    className={`h-16 rounded-xl text-sm transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white shadow"
                        : cell.muted || isBooked
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-blue-50 hover:border-blue-200 border border-transparent"
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Selected
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                Available
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-100 border" />
                Past / unavailable
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-200" />
                Booked
              </div>
            </div>
          </section>

          <section className="col-span-5 space-y-4">
            <div className="bg-white border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-3xl font-semibold text-gray-900">Available Slots</h3>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold">
                  {selectedDate ? formatBookingDateLabel(selectedDate) : "PICK A DATE"}
                </span>
              </div>

              {!selectedDate ? (
                <p className="text-sm text-gray-500 mb-4">Select a date on the calendar to see available times.</p>
              ) : null}
              {slotsLoading ? (
                <p className="text-sm text-gray-500 mb-4">Checking mentor availability…</p>
              ) : null}
              {slotsError ? (
                <p className="text-sm text-red-600 mb-4">{slotsError}</p>
              ) : null}
              {selectedDate && !slotsLoading && slots.length === 0 && !slotsError ? (
                <p className="text-sm text-gray-500 mb-4">No slots available for this date.</p>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot.time;
                  const isBooked = !slot.available;
                  return (
                    <button
                      key={slot.start_at}
                      type="button"
                      disabled={!selectedDate || isBooked || slotsLoading}
                      onClick={() => pickSlot(slot)}
                      className={`h-16 rounded-xl border text-center transition-colors ${
                        isBooked
                          ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : !selectedDate || slotsLoading
                            ? "border-gray-100 text-gray-300 cursor-not-allowed"
                            : isSelected
                              ? "border-blue-600 text-blue-700 bg-blue-50"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-semibold">{slot.time}</div>
                      <div className="text-xs text-gray-400">
                        {isBooked ? "Booked" : isSelected ? "Selected" : "Available"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-semibold">Important Note</p>
                <p>No double booking allowed. Only one appointment per user per time slot.</p>
              </div>

              <Button
                type="button"
                className="w-full mt-4 h-11 bg-blue-600 hover:bg-blue-700 text-base disabled:opacity-50"
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                {!selectedDate
                  ? "Select a date to continue"
                  : !selectedSlot
                    ? "Select a time slot to continue"
                    : "Confirm Appointment"}
              </Button>
            </div>

            <div className="bg-[#eaf2ff] border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white text-blue-700 flex items-center justify-center">
                  <Clock3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs tracking-wide text-blue-700 font-semibold">SERVICE SELECTED</p>
                  <p className="font-semibold text-gray-900">{draft.session.title}</p>
                </div>
              </div>
              <Link to="/booking" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                Edit
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t py-5 text-center text-sm text-gray-400">
        Powered by Appointments Pro • Terms &amp; Privacy
      </footer>
    </div>
  );
}
