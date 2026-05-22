import { useEffect, useState } from "react";
import { Bookmark, Calendar, Globe, MapPin, MessageSquare, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";
import { MentorProfileBookingSidebar } from "./MentorProfileBookingSidebar";
import { PublicNavbar } from "./PublicNavbar";
import { api } from "../lib/api";
import { getAuthToken, getAuthUser } from "../lib/auth";
import { setBookingDraft } from "../lib/bookingDraft";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";
const portfolioOne =
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const portfolioTwo =
  "https://images.unsplash.com/photo-1522252234503-e356532cafd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

type Mentor = {
  id: number;
  username: string;
  email: string;
  display_name: string;
  title: string;
  company: string;
  description: string;
  price: number;
  rating: number;
  image: string;
};

async function loadMentor(id: string): Promise<Mentor> {
  const response = await fetch(`${API_BASE}/mentors/${id}/`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.detail === "string" ? payload.detail : "Failed to load mentor.";
    throw new Error(message);
  }
  return payload as Mentor;
}

export function MentorProfilePage() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const authUser = getAuthUser();
  const isMentee = authUser?.role === "mentee" && Boolean(getAuthToken());

  useEffect(() => {
    const run = async () => {
      if (!mentorId) return;
      setLoading(true);
      setError("");
      try {
        const loaded = await loadMentor(mentorId);
        setMentor(loaded);
        setBookingDraft({ mentorId: loaded.id });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load mentor.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId || !isMentee) {
      setIsSaved(false);
      return;
    }
    void api
      .getMentorSavedStatus(Number(mentorId))
      .then((data) => setIsSaved(data.saved))
      .catch(() => setIsSaved(false));
  }, [mentorId, isMentee]);

  const toggleSaveMentor = async () => {
    if (!mentor) return;
    if (!isMentee) {
      navigate("/login");
      return;
    }
    setSaveLoading(true);
    setSaveMessage("");
    try {
      if (isSaved) {
        await api.unsaveMentor(mentor.id);
        setIsSaved(false);
        setSaveMessage("Removed from saved mentors.");
      } else {
        await api.saveMentor(mentor.id);
        setIsSaved(true);
        setSaveMessage("Saved to your dashboard.");
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not update saved mentors.");
    } finally {
      setSaveLoading(false);
    }
  };

  const title = mentor ? `${mentor.title} at ${mentor.company}` : "Loading mentor";

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <PublicNavbar />

      <main className="max-w-6xl mx-auto px-6 py-6">
        {error ? <p className="text-red-600 mb-4">{error}</p> : null}
        {loading ? <p className="text-gray-600 mb-4">Loading mentor profile...</p> : null}
        {mentor ? (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-5">
              <section className="bg-white border rounded-xl p-5">
                <div className="flex gap-5">
                  <img
                    src={mentor.image}
                    alt={mentor.display_name}
                    className="w-44 h-44 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-2">
                      {mentor.display_name}
                    </h1>
                    <p className="text-blue-700 font-semibold text-xl">{title}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div>Registered backend mentor</div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {mentor.email || mentor.username}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {mentor.rating} (84 reviews)
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="bg-blue-700 hover:bg-blue-800 w-36"
                      onClick={() => navigate(`/booking?mentorId=${mentor.id}`)}
                    >
                      Book Session
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-36 ${
                        isSaved
                          ? "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100"
                          : "border-blue-700 text-blue-700 hover:bg-blue-50"
                      }`}
                      disabled={saveLoading}
                      onClick={() => void toggleSaveMentor()}
                    >
                      <Bookmark className={`w-4 h-4 mr-1 ${isSaved ? "fill-current" : ""}`} />
                      {saveLoading ? "Saving…" : isSaved ? "Saved" : "Save mentor"}
                    </Button>
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 w-36">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    {saveMessage ? (
                      <p className="text-xs text-gray-500 w-36 text-center">{saveMessage}</p>
                    ) : null}
                    {!isMentee && getAuthToken() ? (
                      <p className="text-xs text-gray-400 w-36 text-center">Sign in as a mentee to save mentors.</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="bg-white border rounded-xl p-5">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">About Me</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {mentor.description}
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Portfolio &amp; Past Work</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-xl overflow-hidden">
                    <img src={portfolioOne} alt="Fintech app redesign" className="w-full h-36 object-cover" />
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-900">Fintech App Redesign</p>
                      <p className="text-xs text-gray-500">UX Research &amp; Mobile UI</p>
                    </div>
                  </div>
                  <div className="border rounded-xl overflow-hidden">
                    <img src={portfolioTwo} alt="Global design system" className="w-full h-36 object-cover" />
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-900">Global Design System</p>
                      <p className="text-xs text-gray-500">Scalable Architecture</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Recent Reviews</h2>
                  <button className="text-sm text-blue-700 hover:text-blue-800 font-medium">
                    View all 84 reviews
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="font-semibold text-gray-900">Sarah Jenkins</p>
                    <div className="flex text-yellow-400 mb-1">{"★".repeat(5)}</div>
                    <p className="text-gray-600 italic">
                      &quot;This mentor helped me completely pivot my portfolio. Their insights into what hiring
                      managers are looking for were invaluable. Highly recommend!&quot;
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Michael Chen</p>
                    <div className="flex text-yellow-400 mb-1">{"★".repeat(5)}</div>
                    <p className="text-gray-600 italic">
                      &quot;Great session on career strategy. Clear, actionable steps and very
                      encouraging environment.&quot;
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <MentorProfileBookingSidebar mentorId={mentor.id} hourlyRate={mentor.price} />
          </div>
        ) : null}
      </main>

      <footer className="bg-white border-t mt-10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 2 7l10 5 10-5-10-5z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">MentorHub</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-700">Community</a>
            <a href="#" className="hover:text-gray-700">Mentors</a>
            <a href="#" className="hover:text-gray-700">Resources</a>
            <a href="#" className="hover:text-gray-700">Help</a>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4" />
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-5 text-xs text-gray-400">
          © 2026 NewRuz Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
