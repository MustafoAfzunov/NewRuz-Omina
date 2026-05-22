import { ArrowLeft, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  BOOKING_SESSION_OPTIONS,
  getBookingDraft,
  setBookingDraft,
} from "../lib/bookingDraft";
import { BookingProgressNav } from "./BookingProgressNav";

const sessions = BOOKING_SESSION_OPTIONS;

export function BookingPortalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedSession, setSelectedSession] = useState<string | null>(
    () => getBookingDraft().session?.title ?? null,
  );

  useEffect(() => {
    const mentorId = searchParams.get("mentorId");
    if (mentorId) {
      setBookingDraft({ mentorId: Number(mentorId) });
    }
  }, [searchParams]);

  const selectSession = (session: BookingSessionType) => {
    setSelectedSession(session.title);
    setBookingDraft({ session });
  };

  const continueToDateTime = () => {
    const session = sessions.find((item) => item.title === selectedSession);
    if (!session) return;
    setBookingDraft({ session });
    navigate("/booking/date-time");
  };

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <header className="bg-white border-b px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Booking Portal</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-blue-600">Help Center</a>
            <a href="#" className="hover:text-blue-600">My Bookings</a>
            <div className="w-9 h-9 rounded-full bg-orange-100 border" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-12 gap-6">
        <aside className="col-span-3 space-y-4">
          <div className="bg-white border rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 text-xl">Booking Progress</h2>
            <p className="text-sm text-gray-500 mb-5">Step 1 of 4</p>
            <BookingProgressNav currentStep={1} variant="sidebar" />
          </div>

          <div className="bg-[#eef5ff] border rounded-2xl p-5">
            <p className="text-xs tracking-wide text-blue-700 font-semibold mb-2">NEED HELP?</p>
            <p className="text-sm text-gray-600 mb-4">
              Our support team is available 24/7 for any technical issues.
            </p>
            <a href="#" className="text-blue-700 text-sm font-medium hover:text-blue-800">
              Contact Support →
            </a>
          </div>
        </aside>

        <section className="col-span-9">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Select Session Type</h1>
          <p className="text-gray-600 text-2xl leading-relaxed mb-7">
            Choose the session that best fits your needs. We offer various durations for different goals.
          </p>

          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.title} className="bg-white border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-3xl font-semibold text-gray-900">{session.title}</h3>
                    <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mt-1 mb-3">
                      <Clock3 className="w-4 h-4" />
                      <span>{session.duration}</span>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed">{session.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        selectedSession === session.title ? "text-green-600 fill-green-600" : "text-gray-300"
                      }`}
                    />
                    <Button
                      className={`px-7 ${
                        selectedSession === session.title
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      onClick={() => selectSession(session)}
                    >
                      {selectedSession === session.title ? "Selected" : "Select Session"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t flex items-center justify-between">
            <Link to="/mentors">
              <Button variant="outline" className="h-10 px-6 text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            {selectedSession ? (
              <div className="flex items-center gap-4">
                <p className="text-sm text-green-700 font-medium">{selectedSession} selected</p>
                <Button
                  className="h-10 px-8 bg-blue-600 hover:bg-blue-700"
                  onClick={continueToDateTime}
                >
                  Continue
                </Button>
              </div>
            ) : (
              <p className="text-sm italic text-gray-500">Please select an option to continue</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
