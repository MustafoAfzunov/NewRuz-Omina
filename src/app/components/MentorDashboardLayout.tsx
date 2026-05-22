import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Users,
  MessageSquare,
  Star,
  Settings,
  LogOut,
} from "lucide-react";
import { clearAuth, getAuthUser } from "../lib/auth";

const avatarImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3Ccircle cx='32' cy='24' r='12' fill='%239ca3af'/%3E%3Cpath d='M12 56c2-12 10-18 20-18s18 6 20 18' fill='%239ca3af'/%3E%3C/svg%3E";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors w-full ${
    isActive
      ? "bg-blue-600 text-white"
      : "text-gray-400 hover:bg-[#252b45] hover:text-white"
  }`;

export function MentorDashboardLayout() {
  const navigate = useNavigate();
  const user = getAuthUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-[#1a1f37] text-white flex flex-col shrink-0">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-semibold text-base">NewRuz</span>
          </div>
          <p className="text-xs text-gray-400 ml-10">Mentor Portal</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <NavLink to="/mentor-dashboard" end className={navClass}>
            <LayoutGrid className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
          <NavLink to="/mentor-dashboard/calendar" className={navClass}>
            <CalendarIcon className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Calendar</span>
          </NavLink>
          <NavLink to="/mentor-dashboard/participants" className={navClass}>
            <Users className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Participants</span>
          </NavLink>
          <NavLink to="/mentor-dashboard/messages" className={navClass}>
            <MessageSquare className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Messages</span>
          </NavLink>
          <NavLink to="/mentor-dashboard/reviews" className={navClass}>
            <Star className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Reviews</span>
          </NavLink>
          <NavLink to="/mentor-dashboard/settings" className={navClass}>
            <Settings className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <img src={avatarImage} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.username ?? "Mentor"}
              </p>
              <p className="text-xs text-gray-400">Mentor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-xs text-red-400 hover:text-red-300"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
