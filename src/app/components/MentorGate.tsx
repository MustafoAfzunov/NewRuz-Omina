import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { getAuthUser } from "../lib/auth";

type MentorGateProps = {
  children: ReactNode;
};

/** Only approved mentors can access mentor dashboard routes. */
export function MentorGate({ children }: MentorGateProps) {
  const user = getAuthUser();
  if (user?.role !== "mentor") {
    return <Navigate to="/login" replace />;
  }
  if (user.mentor_status === "pending") {
    return <Navigate to="/mentor-pending" replace />;
  }
  if (user.mentor_status === "rejected") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
