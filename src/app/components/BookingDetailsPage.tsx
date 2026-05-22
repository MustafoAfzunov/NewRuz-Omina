import { CalendarIcon, Mail, Phone, User } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api } from "../lib/api";
import { getAuthUser } from "../lib/auth";
import { validateDraftSlotAvailable } from "../lib/bookingAvailability";
import {
  formatBookingDateLabel,
  getBookingDraft,
  isReadyForDetails,
  setBookingDraft,
} from "../lib/bookingDraft";
import { BookingProgressNav } from "./BookingProgressNav";

export function BookingDetailsPage() {
  const navigate = useNavigate();
  const draft = getBookingDraft();
  const user = getAuthUser();

  const [fullName, setFullName] = useState(draft.fullName ?? user?.username?.split("@")[0] ?? "");
  const [email, setEmail] = useState(draft.email ?? user?.email ?? "");
  const [phone, setPhone] = useState(draft.phone ?? "");
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [error, setError] = useState("");
  const [mentorId, setMentorId] = useState<number | null>(draft.mentorId ?? null);
  const [slotConflict, setSlotConflict] = useState("");

  useEffect(() => {
    if (mentorId) return;
    void api.getMentors().then((mentors) => {
      if (mentors[0]) setMentorId(mentors[0].id);
    });
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId || !isReadyForDetails(draft)) return;
    let cancelled = false;
    void validateDraftSlotAvailable(draft, mentorId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setSlotConflict(result.message);
        setBookingDraft({ time: null, slotStartAt: null, slotEndAt: null });
      } else {
        setSlotConflict("");
        if (!draft.slotStartAt || !draft.slotEndAt) {
          setBookingDraft({
            slotStartAt: result.slotStartAt,
            slotEndAt: result.slotEndAt,
          });
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mentorId, draft.date, draft.time, draft.session?.durationMinutes, draft.slotStartAt]);

  if (!isReadyForDetails(draft)) {
    return (
      <div className="min-h-screen bg-[#f4f5f9] flex items-center justify-center p-8">
        <div className="bg-white border rounded-2xl p-8 max-w-md text-center">
          <p className="text-gray-700 mb-4">Please complete session, date, and time selection first.</p>
          <Link to="/booking/date-time">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to date &amp; time</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleContinue = async () => {
    if (!fullName.trim() || !email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    if (slotConflict) {
      setError(slotConflict);
      return;
    }
    if (!mentorId) {
      setError("No mentor selected. Please book from a mentor profile.");
      return;
    }

    setError("");
    const validation = await validateDraftSlotAvailable(getBookingDraft(), mentorId);
    if (!validation.ok) {
      setError(validation.message);
      setBookingDraft({ time: null, slotStartAt: null, slotEndAt: null });
      return;
    }

    setBookingDraft({
      session: draft.session,
      date: draft.date,
      time: draft.time,
      slotStartAt: validation.slotStartAt,
      slotEndAt: validation.slotEndAt,
      mentorId: mentorId ?? draft.mentorId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });
    navigate("/booking/confirmation");
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <header className="bg-white border-b px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-3xl">Book Appointment</span>
          </div>
          <a href="#" className="text-sm text-gray-700 hover:text-blue-600">
            My Bookings
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-7">
        <div className="mb-6 rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500 mb-3">Booking Progress • Step 3 of 4</p>
                    <BookingProgressNav currentStep={3} variant="bar" />
        </div>

        <section className="bg-white border rounded-2xl p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Step 3: Your Details</h1>
          <p className="text-gray-600 mb-2">Please provide your contact details before final confirmation.</p>
          <p className="text-sm text-blue-700 mb-6">
            {draft.session.title} · {formatBookingDateLabel(draft.date)} · {draft.time}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                className="pl-9 h-11"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                className="pl-9 h-11"
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                className="pl-9 h-11"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Input
              className="h-11"
              placeholder="Notes for mentor (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {slotConflict ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {slotConflict}{" "}
              <Link to="/booking/date-time" className="font-semibold underline">
                Choose another time
              </Link>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600 mt-4">{error}</p> : null}

          <div className="mt-6 flex items-center justify-between">
            <Link to="/booking/date-time">
              <Button type="button" variant="outline">
                Back to Time Selection
              </Button>
            </Link>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={Boolean(slotConflict)}
              onClick={() => void handleContinue()}
            >
              Continue to Confirmation
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
