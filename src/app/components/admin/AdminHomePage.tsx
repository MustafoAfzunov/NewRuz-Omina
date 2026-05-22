import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, type AdminDashboard } from "../../lib/api";

export function AdminHomePage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getAdminDashboard()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats."));
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!stats) {
    return <p className="text-gray-500">Loading overview…</p>;
  }

  const cards = [
    { label: "Mentees", value: stats.users_by_role.mentee ?? 0, to: "/admin-dashboard/mentees" },
    { label: "Mentors", value: stats.users_by_role.mentor ?? 0, to: "/admin-dashboard/mentors" },
    {
      label: "Pending mentor requests",
      value: stats.pending_mentors,
      to: "/admin-dashboard/mentor-requests",
      highlight: stats.pending_mentors > 0,
    },
    { label: "Programs", value: stats.programs, to: "/admin-dashboard/programs" },
    { label: "Events", value: stats.events, to: "/admin-dashboard/events" },
    { label: "Opportunities", value: stats.opportunities, to: "/admin-dashboard/opportunities" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin overview</h1>
      <p className="text-gray-600 mb-8">Manage users, mentor approvals, and platform content.</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow ${
              card.highlight ? "ring-2 ring-amber-400" : ""
            }`}
          >
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
