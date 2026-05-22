import {
  FolderOpen,
  Trophy,
  Calendar,
  MessageCircle,
  Clock,
} from "lucide-react";
import { Button } from "./ui/button";
const avatarImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3Ccircle cx='32' cy='24' r='12' fill='%239ca3af'/%3E%3Cpath d='M12 56c2-12 10-18 20-18s18 6 20 18' fill='%239ca3af'/%3E%3C/svg%3E";

const savedMentors = [
  {
    name: "Marcus Thorne",
    role: "Senior Product Designer",
    avatar: "https://images.unsplash.com/photo-1629507208649-70919ca33793?w=100",
  },
  {
    name: "Elena Rodriguez",
    role: "Growth Specialist",
    avatar: "https://images.unsplash.com/photo-1616444493079-c71a6f0062b3?w=100",
  },
  {
    name: "James Wilson",
    role: "Full Stack Engineer",
    avatar: "https://images.unsplash.com/photo-1634133472760-e5c2bd346787?w=100",
  },
];

const activePrograms = [
  {
    title: "UX RESEARCH MASTERY",
    progress: 75,
    nextLesson: "User Persona Development",
    icon: "🎨",
    color: "bg-blue-50",
    iconBg: "bg-blue-100",
  },
  {
    title: "REACT FRONTEND BOOTCAMP",
    progress: 42,
    nextLesson: "State Management with Hooks",
    icon: "⚛️",
    color: "bg-green-50",
    iconBg: "bg-green-100",
  },
];

const pastSessions = [
  {
    mentor: "Sarah Jenkins",
    mentorAvatar: "https://images.unsplash.com/photo-1650784855038-9f4d5ed154a9?w=100",
    topic: "Visual Hierarchy 101",
    date: "Oct 05, 2023",
    rating: 5,
  },
  {
    mentor: "David Chen",
    mentorAvatar: "https://images.unsplash.com/photo-1629507208649-70919ca33793?w=100",
    topic: "React Fundamentals",
    date: "Sep 28, 2023",
    rating: 4,
  },
];

export function MenteeDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1f37] text-white flex flex-col">
        {/* Logo */}
        <div className="p-5 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-base">NewRuz</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <Link
            to="/mentee-dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 text-white mb-1"
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            to="/programs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#252b45] hover:text-white transition-colors mb-1"
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-sm font-medium">Programs</span>
          </Link>
          <Link
            to="/mentors"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#252b45] hover:text-white transition-colors mb-1"
          >
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Mentors</span>
          </Link>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#252b45] hover:text-white transition-colors w-full mb-1">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Messages</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#252b45] hover:text-white transition-colors w-full mb-1">
            <Bell className="w-5 h-5" />
            <span className="text-sm font-medium">Notifications</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#252b45] hover:text-white transition-colors w-full">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={avatarImage}
              alt="Alex Johnson"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Alex Johnson
              </p>
              <p className="text-xs text-gray-400">Premium Mentee</p>
            </div>
          </div>
          <Link
            to="/login"
            onClick={() => clearAuth()}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Welcome back, Alex!
              </h1>
              <p className="text-gray-600">
                You have 2 sessions scheduled for today. Keep up the great
                progress!
              </p>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-xl">
              <Trophy className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Course Progress
                </p>
                <p className="text-lg font-bold text-gray-900">84% Overall</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="col-span-2 space-y-6">
              {/* Upcoming Sessions */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Upcoming Sessions
                  </h2>
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Calendar
                  </a>
                </div>

                <div className="flex gap-5">
                  <div className="flex-1">
                    <div className="inline-block bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded mb-3">
                      IN 45 MINUTES
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Advanced UI Design Systems
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                      <span className="text-gray-400">👤</span> with Sarah
                      Jenkins
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-5">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Today, Oct 12</span>
                      <span className="text-gray-400 mx-1">•</span>
                      <Clock className="w-4 h-4" />
                      <span>10:00 AM - 11:30 AM</span>
                    </div>

                    <div className="flex gap-3">
                      <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                        Join Meeting
                      </Button>
                      <Button variant="outline">Reschedule</Button>
                    </div>
                  </div>

                  <div className="w-56 h-40 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1623679072629-3aaa0192a391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                      alt="Session"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Active Programs */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">
                  Active Programs
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {activePrograms.map((program, index) => (
                    <div
                      key={index}
                      className={`${program.color} rounded-xl p-5`}
                    >
                      <div
                        className={`w-12 h-12 ${program.iconBg} rounded-lg flex items-center justify-center text-2xl mb-4`}
                      >
                        {program.icon}
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        {program.title}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-700">
                          Curriculum Progress
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {program.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2 mb-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${program.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 italic">
                        Next: {program.nextLesson}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Sessions */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">
                  Past Sessions
                </h2>

                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">
                          Mentor
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">
                          Topic
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">
                          Date
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">
                          Rating
                        </th>
                        <th className="w-10 pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastSessions.map((session, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={session.mentorAvatar}
                                alt={session.mentor}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <span className="font-medium text-gray-900">
                                {session.mentor}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-gray-700">
                            {session.topic}
                          </td>
                          <td className="py-4 text-sm text-gray-600">
                            {session.date}
                          </td>
                          <td className="py-4">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < session.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300 fill-gray-300"
                                  }`}
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                            </div>
                          </td>
                          <td className="py-4">
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="12" cy="6" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="18" r="2" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Saved Mentors */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Saved Mentors
                </h2>
                <div className="space-y-3">
                  {savedMentors.map((mentor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={mentor.avatar}
                          alt={mentor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {mentor.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {mentor.role}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2">
                  + Find New Mentors
                </button>
              </div>

              {/* Messages */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-sm p-5 text-white">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">Messages</h2>
                  <span className="bg-white/20 text-xs font-semibold px-2 py-1 rounded">
                    3 New
                  </span>
                </div>
                <p className="text-sm text-blue-50 mb-4">
                  Sarah Jenkins sent you feedback on your latest UI wireframes.
                </p>
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                  Read Message
                </Button>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Notifications
                  </h2>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Recent
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Course Updated
                      </p>
                      <p className="text-xs text-gray-600">
                        UX Research Mastery has a new lesson available.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Session Reminder
                      </p>
                      <p className="text-xs text-gray-600">
                        Your session with Sarah starts in 45 mins.
                      </p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium text-center py-2">
                  View All Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
