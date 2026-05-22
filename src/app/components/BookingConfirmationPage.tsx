import { useEffect, useState } from "react";
import { Bell, CalendarDays, CalendarIcon, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { api } from "../lib/api";
import {
  getBookingTimesFromDraft,
  validateDraftSlotAvailable,
} from "../lib/bookingAvailability";
import {
  clearBookingDraft,
  getBookingDraft,
  getMissingBookingSteps,
  isReadyForConfirmation,
  setBookingDraft,
  type BookingDraft,
} from "../lib/bookingDraft";
import { BookingProgressNav } from "./BookingProgressNav";

const bookingImage =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900";

export function BookingConfirmationPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<BookingDraft>(() => getBookingDraft());
  const [mentorId, setMentorId] = useState<number | null>(draft.mentorId ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingDraft | null>(null);
  const [checkingSlot, setCheckingSlot] = useState(true);
  const [slotUnavailable, setSlotUnavailable] = useState("");

  useEffect(() => {
    setDraft(getBookingDraft());
  }, []);

  useEffect(() => {
    const current = getBookingDraft();
    if (current.mentorId) {
      setMentorId(current.mentorId);
      return;
    }
    void api.getMentors().then((mentors) => {
      if (mentors[0]) setMentorId(mentors[0].id);
    });
  }, []);

  useEffect(() => {
    if (!mentorId || !isReadyForConfirmation(draft)) {
      setCheckingSlot(false);
      return;
    }

    let cancelled = false;
    setCheckingSlot(true);
    void validateDraftSlotAvailable(draft, mentorId)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setSlotUnavailable(result.message);
          setBookingDraft({ time: null, slotStartAt: null, slotEndAt: null });
        } else {
          setSlotUnavailable("");
          setBookingDraft({
            slotStartAt: result.slotStartAt,
            slotEndAt: result.slotEndAt,
            mentorId,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlotUnavailable("Could not verify this time slot. Please pick another time.");
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingSlot(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mentorId, draft.date, draft.time, draft.session?.durationMinutes, draft.slotStartAt]);

  if (success && confirmedBooking?.session && confirmedBooking.date && confirmedBooking.time) {
    const dateLabel = new Date(`${confirmedBooking.date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div className="min-h-screen bg-[#f4f5f9] flex items-center justify-center p-8">
        <div className="bg-white border rounded-2xl p-10 max-w-lg text-center shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your booking request was submitted. A mentor will review and confirm the session.
          </p>
          <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Session:</span> {confirmedBooking.session.title}
            </p>
            <p>
              <span className="font-semibold">Date:</span> {dateLabel}
            </p>
            <p>
              <span className="font-semibold">Time:</span> {confirmedBooking.time}
            </p>
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/mentee-dashboard")}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (slotUnavailable) {
    return (
      <div className="min-h-screen bg-[#f4f5f9] flex items-center justify-center p-8">
        <div className="bg-white border rounded-2xl p-8 max-w-md text-center">
          <p className="text-gray-900 font-semibold mb-2">This time is no longer available</p>
          <p className="text-sm text-gray-600 mb-6">{slotUnavailable}</p>
          <Link to="/booking/date-time">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Choose another time</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isReadyForConfirmation(draft)) {
    const missing = getMissingBookingSteps(draft);
    return (
      <div className="min-h-screen bg-[#f4f5f9] flex items-center justify-center p-8">
        <div className="bg-white border rounded-2xl p-8 max-w-md text-center">
          <p className="text-gray-700 mb-2">Your booking is incomplete.</p>
          <p className="text-sm text-gray-500 mb-6">
            Still needed: {missing.join(", ")}. Use the Continue button on each step to save your
            choices before moving on.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/booking">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">1. Select session</Button>
            </Link>
            <Link to="/booking/date-time">
              <Button variant="outline" className="w-full">
                2. Pick date &amp; time
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dateLabel = new Date(`${draft.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleConfirmBooking = async () => {
    if (!mentorId) {
      setError("No mentor available for this booking. Please book from a mentor profile.");
      return;
    }

    const snapshot: BookingDraft = { ...getBookingDraft() };
    if (!isReadyForConfirmation(snapshot)) {
      setError("Booking details were lost. Please go back and select your session, date, and time again.");
      setDraft(getBookingDraft());
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const validation = await validateDraftSlotAvailable(snapshot, mentorId);
      if (!validation.ok) {
        setError(validation.message);
        setSlotUnavailable(validation.message);
        setBookingDraft({ time: null, slotStartAt: null, slotEndAt: null });
        return;
      }

      const times = getBookingTimesFromDraft({
        ...snapshot,
        slotStartAt: validation.slotStartAt,
        slotEndAt: validation.slotEndAt,
      });
      if (!times) {
        setError("Booking details were lost. Please go back and select your session, date, and time again.");
        return;
      }

      await api.createBooking({
        mentor: mentorId,
        start_at: times.start_at,
        end_at: times.end_at,
        notes: snapshot.notes ?? "",
      });

      setConfirmedBooking(snapshot);
      setSuccess(true);
      clearBookingDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <header className="bg-white border-b px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-3xl">Booking System</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="w-9 h-9 rounded-lg border bg-gray-50 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button type="button" className="w-9 h-9 rounded-lg border bg-gray-50 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-600" />
            </button>
            <div className="w-9 h-9 rounded-full bg-orange-100 border" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-7">
        <div className="mb-6 rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500 mb-3">Booking Progress • Step 4 of 4</p>
          <BookingProgressNav currentStep={4} variant="bar" />
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-2">Step 4: Confirm Booking</h1>
        <p className="text-gray-600 text-2xl mb-7">
          Please review your final selection before we finalize your appointment.
        </p>

        {checkingSlot ? (
          <p className="mb-6 text-gray-600">Verifying that this time is still available…</p>
        ) : null}
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        ) : null}

        <section className="bg-white border rounded-2xl p-5 mb-8">
          <div className="grid grid-cols-12 gap-5 items-center">
            <div className="col-span-8">
              <p className="text-xs tracking-wide font-semibold text-gray-500 mb-1">SELECTED SESSION</p>
              <h2 className="text-4xl font-semibold text-gray-900 mb-3">{draft.session!.title}</h2>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2 text-lg">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  {dateLabel}
                </p>
                <p className="flex items-center gap-2 text-lg">
                  <Clock3 className="w-4 h-4 text-blue-600" />
                  {draft.time} ({draft.session!.duration})
                </p>
                <p className="flex items-center gap-2 text-lg">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Online session
                </p>
                {draft.fullName ? (
                  <p className="text-sm text-gray-500 pt-2">
                    {draft.fullName} · {draft.email}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3 mt-5">
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 px-6 h-11"
                  disabled={submitting || checkingSlot}
                  onClick={() => void handleConfirmBooking()}
                >
                  {submitting ? "Submitting…" : "Confirm Booking"}
                </Button>
                <Link to="/booking/date-time">
                  <Button type="button" variant="outline" className="h-11 px-6">
                    Edit Selection
                  </Button>
                </Link>
              </div>
            </div>

            <div className="col-span-4">
              <img src={bookingImage} alt="Booking office" className="w-full h-52 object-cover rounded-xl border" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-3">
          <p>© 2026 NewRuz Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-700">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-700">
              Terms of Service
            </a>
            <a href="#" className="hover:text-gray-700">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
