import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Search,
  GraduationCap,
  Users,
  UserPlus,
  Star,
  ChevronRight,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "./ui/button";
import { PublicNavbar } from "./PublicNavbar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api, type EventItem, type MentorPublic, type Program } from "../lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

function formatEventDay(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return {
    day: start.getDate(),
    month: start.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    time: `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
  };
}

export function HomePage() {
  const [mentors, setMentors] = useState<MentorPublic[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    void Promise.all([api.getMentors(), api.getEvents(), api.getPrograms()])
      .then(([mentorData, eventData, programData]) => {
        setMentors(Array.isArray(mentorData) ? mentorData : []);
        setEvents(Array.isArray(eventData) ? eventData : []);
        setPrograms(Array.isArray(programData) ? programData : []);
      })
      .catch((err) => {
        setMentors([]);
        setEvents([]);
        setPrograms([]);
        setLoadError(
          err instanceof Error ? err.message : "Could not load platform content.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {loadError ? (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-3 text-sm text-center">
          {loadError} Make sure the API is running at{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">127.0.0.1:8000</code>.
        </div>
      ) : null}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Empowering Students
            <br />
            Through Mentorship
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with experienced mentors who will guide you towards your
            academic and career goals. Get personalized advice and grow with our
            supportive community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/mentors">
              <Button className="h-12 rounded-xl bg-[#0B4EA2] text-white font-semibold px-8 hover:bg-[#0A4590] shadow-sm">
                Find a Mentor
              </Button>
            </Link>
            <Link to="/programs">
              <Button
                variant="outline"
                className="h-12 rounded-xl border border-white/90 bg-transparent text-white font-semibold px-8 hover:bg-white/10 hover:text-white"
              >
                Browse Programs
              </Button>
            </Link>
            <Link to="/signup?role=mentor">
              <Button
                variant="outline"
                className="h-12 rounded-xl border border-white/90 bg-transparent text-white font-semibold px-8 hover:bg-white/10 hover:text-white"
              >
                Become a Mentor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Create Profile</h3>
              <Link to="/signup" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">Sign up free →</Link>
              <p className="text-gray-600">
                Sign up and create your profile highlighting your goals, interests,
                and what you're looking for in a mentor.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Matched</h3>
              <Link to="/mentors" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">Browse mentors →</Link>
              <p className="text-gray-600">
                Our smart algorithm matches you with mentors based on your field of
                interest, career goals, and learning style.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Grow Together</h3>
              <Link to="/login" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">Go to dashboard →</Link>
              <p className="text-gray-600">
                Start your mentorship journey with regular sessions, goal tracking,
                and continuous support to achieve success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Mentors</h2>
              <p className="text-gray-600">
                Meet our top-rated mentors who are ready to guide you
              </p>
            </div>
            <Link to="/mentors">
              <Button variant="outline" className="hidden md:flex items-center gap-2">
                View All Mentors
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading mentors…</p>
          ) : null}
          {!loading && mentors.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No mentors available yet.</p>
          ) : null}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...mentors]
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 4)
              .map((mentor) => (
              <Link
                key={mentor.id}
                to={`/mentors/${mentor.id}`}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow block"
              >
                <div className={`aspect-square relative ${mentor.bg_color || "bg-blue-50"}`}>
                  {mentor.image ? (
                    <ImageWithFallback
                      src={mentor.image}
                      alt={mentor.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl font-semibold text-blue-600">
                        {mentor.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-0.5 flex items-center gap-1 text-xs font-semibold shadow-sm">
                    <Star className="w-3 h-3 fill-blue-600 text-blue-600" />
                    {mentor.rating}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{mentor.display_name}</h3>
                  <p className="text-sm text-blue-600 mb-2">
                    {mentor.title} @ {mentor.company}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{mentor.description}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${mentor.price}
                    <span className="text-gray-500 font-normal">/hr</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Link to="/mentors">
              <Button variant="outline" className="gap-2">
                View All Mentors
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mentorship Programs */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            Mentorship Programs
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Explore our tailored mentorship programs designed for success
          </p>
          <div className="flex justify-center mb-8">
            <Link to="/programs">
              <Button variant="outline">View All Programs</Button>
            </Link>
          </div>
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading programs…</p>
          ) : null}
          {!loading && programs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No programs available yet.</p>
          ) : null}
          <div className="grid md:grid-cols-2 gap-8">
            {programs.slice(0, 2).map((program, idx) => (
              <div
                key={program.id}
                className={
                  idx % 2 === 0
                    ? "bg-slate-900 text-white rounded-lg p-8 relative overflow-hidden"
                    : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-lg p-8 relative overflow-hidden"
                }
              >
                <div className="relative">
                  <p className="text-xs uppercase tracking-wider opacity-80 mb-2">
                    {program.duration_weeks} weeks · ${program.price.toLocaleString()}
                  </p>
                  <h3 className="text-2xl font-bold mb-3">{program.title}</h3>
                  <p className={idx % 2 === 0 ? "text-blue-100 mb-2" : "text-emerald-50 mb-2"}>
                    Mentor: {program.mentor_name}
                  </p>
                  <p className={idx % 2 === 0 ? "text-blue-100 mb-6" : "text-emerald-50 mb-6"}>
                    {program.description}
                  </p>
                  <Link to="/programs">
                    <Button
                      variant="outline"
                      className="border-white text-white hover:bg-white/10"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Upcoming Events</h2>
          <div className="flex justify-center mb-8">
            <Link to="/events">
              <Button variant="outline">View All Events</Button>
            </Link>
          </div>
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading events…</p>
          ) : null}
          {!loading && events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming events.</p>
          ) : null}
          <div className="space-y-4 max-w-3xl mx-auto">
            {events.slice(0, 3).map((event) => {
              const { day, month, time } = formatEventDay(event.starts_at, event.ends_at);
              return (
                <div
                  key={event.id}
                  className="bg-white border rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-center bg-blue-50 rounded-lg p-4 min-w-[80px]">
                    <div className="text-3xl font-bold text-blue-600">{day}</div>
                    <div className="text-sm text-gray-600">{month}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold uppercase text-blue-600 tracking-wide">
                      {event.category.replace(/_/g, " ")}
                    </span>
                    <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                    <p className="text-sm text-blue-600">{time}</p>
                    {event.application_deadline ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Apply by {new Date(`${event.application_deadline}T12:00:00`).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <Link to="/events" className="flex-shrink-0 w-full sm:w-auto">
                    <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                      Register
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Voices of NewRuz
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <p className="text-gray-700 mb-6 leading-relaxed">
                "Finding my mentor through this platform was a turning point. She
                helped me explore my interests and gave me the confidence to pursue
                what I'm truly passionate about. The guidance I received through
                NewRuz was life-changing!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">AB</span>
                </div>
                <div>
                  <p className="font-semibold">Alex Brown</p>
                  <p className="text-sm text-gray-500">Computer Science Student</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <p className="text-gray-700 mb-6 leading-relaxed">
                "As someone from a non-tech background, entering the world of UX
                design felt overwhelming. Thanks to my mentor, I now have a clear
                roadmap and the skills to succeed in my new career. I couldn't be
                more grateful!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-emerald-600">SM</span>
                </div>
                <div>
                  <p className="font-semibold">Samira Nik</p>
                  <p className="text-sm text-gray-500">UX Design Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                What can you help me with the program?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Our mentors can help with career guidance, academic support, skill
                development, networking strategies, and personal growth. Whether
                you're looking for advice on course selection, job applications, or
                navigating your career path, our mentors are here to guide you.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How does the matching work?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Our intelligent matching algorithm considers your goals, interests,
                field of study, and preferred mentoring style to connect you with the
                most suitable mentors. You can also browse mentor profiles and send
                connection requests to mentors who align with your needs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Is there any cost involved?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                We offer both free and premium mentorship programs. Basic matching
                and monthly sessions are available at no cost. Premium programs offer
                additional benefits like unlimited sessions, priority matching, and
                access to exclusive workshops and events.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-6 h-6" />
                <span className="text-lg font-semibold">NewRuz</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Empowering students through meaningful mentorship connections.
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/mentors" className="hover:text-white">Find a Mentor</Link>
                </li>
                <li>
                  <Link to="/signup?role=mentor" className="hover:text-white">Become a Mentor</Link>
                </li>
                <li>
                  <Link to="/platform#testimonials" className="hover:text-white">Success Stories</Link>
                </li>
                <li>
                  <Link to="/programs" className="hover:text-white">Resources</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">About Us</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/platform#how-it-works" className="hover:text-white">Our Story</Link>
                </li>
                <li>
                  <Link to="/platform" className="hover:text-white">Team</Link>
                </li>
                <li>
                  <Link to="/opportunities" className="hover:text-white">Careers</Link>
                </li>
                <li>
                  <Link to="/events" className="hover:text-white">Blog</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  hello@newruz.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  San Francisco, CA
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <p>© 2026 NewRuz Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}