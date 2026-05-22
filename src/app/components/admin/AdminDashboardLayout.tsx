import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutGrid,
  Users,
  UserCheck,
  GraduationCap,
  Calendar,
  Briefcase,
  LogOut,
  Shield,
} from "lucide-react";
import { clearAuth, getAuthUser } from "../../lib/auth";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors w-full ${
    isActive
      ? "bg-blue-600 text-white"
      : "text-gray-400 hover:bg-[#252b45] hover:text-white"
  }`;

export function AdminDashboardLayout() {
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
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-base">NewRuz</span>
          </div>
          <p className="text-xs text-gray-400 ml-10">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <NavLink to="/admin-dashboard" end className={navClass}>
            <LayoutGrid className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Overview</span>
          </NavLink>
          <NavLink to="/admin-dashboard/mentees" className={navClass}>
            <Users className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Mentees</span>
          </NavLink>
          <NavLink to="/admin-dashboard/mentors" className={navClass}>
            <UserCheck className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Mentors</span>
          </NavLink>
          <NavLink to="/admin-dashboard/mentor-requests" className={navClass}>
            <UserCheck className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Mentor requests</span>
          </NavLink>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 px-3 mt-4 mb-2">
            Content
          </p>
          <NavLink to="/admin-dashboard/programs" className={navClass}>
            <GraduationCap className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Programs</span>
          </NavLink>
          <NavLink to="/admin-dashboard/events" className={navClass}>
            <Calendar className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Events</span>
          </NavLink>
          <NavLink to="/admin-dashboard/opportunities" className={navClass}>
            <Briefcase className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Opportunities</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <p className="text-sm font-medium text-white truncate">{user?.username ?? "Admin"}</p>
          <p className="text-xs text-gray-400 mb-3">Administrator</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
