import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { getAuthToken, getAuthUser, type UserRole } from "../lib/auth";

type RequireRoleProps = {
  children: ReactNode;
  role: UserRole;
};

export function RequireRole({ children, role }: RequireRoleProps) {
  const location = useLocation();
  const token = getAuthToken();
  const user = getAuthUser();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!user || user.role !== role) {
    const fallback =
      user?.role === "admin"
        ? "/admin-dashboard"
        : user?.role === "mentor"
          ? user.mentor_status === "pending"
            ? "/mentor-pending"
            : "/mentor-dashboard"
          : "/mentee-dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
