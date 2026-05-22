import { createBrowserRouter } from "react-router";
import { HomePage } from "./components/HomePage";
import { MentorsPage } from "./components/MentorsPage";
import { ProgramsPage } from "./components/ProgramsPage";
import { EventsPage } from "./components/EventsPage";
import { OpportunitiesPage } from "./components/OpportunitiesPage";
import { MenteeDashboardLayout } from "./components/MenteeDashboardLayout";
import { MenteeDashboardHome } from "./components/MenteeDashboardHome";
import { MentorDashboard } from "./components/MentorDashboard";
import { MentorDashboardLayout } from "./components/MentorDashboardLayout";
import { MentorParticipantsPage } from "./components/MentorParticipantsPage";
import { MentorReviewsPage } from "./components/MentorReviewsPage";
import { MentorSettingsPage } from "./components/MentorSettingsPage";
import { MentorMessagesPage } from "./components/MentorMessagesPage";
import { SignUp } from "./components/SignUp";
import { Login } from "./components/Login";
import { CheckEmailPage } from "./components/CheckEmailPage";
import { VerifyEmailPage } from "./components/VerifyEmailPage";
import { PasswordRecovery } from "./components/PasswordRecovery";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { MentorProfilePage } from "./components/MentorProfilePage";
import { BookingPortalPage } from "./components/BookingPortalPage";
import { BookingDateTimePage } from "./components/BookingDateTimePage";
import { BookingConfirmationPage } from "./components/BookingConfirmationPage";
import { BookingDetailsPage } from "./components/BookingDetailsPage";
import { MenteeCalendarPage } from "./components/MenteeCalendarPage";
import { MenteeMessagesPage } from "./components/MenteeMessagesPage";
import { MentorCalendarPage } from "./components/MentorCalendarPage";
import { RequireAuth } from "./components/RequireAuth";
import { RequireRole } from "./components/RequireRole";
import { MentorGate } from "./components/MentorGate";
import { MentorPendingPage } from "./components/MentorPendingPage";
import { GoogleOAuthCallbackPage } from "./components/GoogleOAuthCallbackPage";
import { AdminDashboardLayout } from "./components/admin/AdminDashboardLayout";
import { AdminHomePage } from "./components/admin/AdminHomePage";
import { AdminUsersTable } from "./components/admin/AdminUsersTable";
import { AdminMentorRequestsPage } from "./components/admin/AdminMentorRequestsPage";
import { AdminProgramsPage } from "./components/admin/AdminProgramsPage";
import { AdminEventsPage } from "./components/admin/AdminEventsPage";
import { AdminOpportunitiesPage } from "./components/admin/AdminOpportunitiesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/platform",
    Component: HomePage,
  },
  {
    path: "/mentors",
    Component: MentorsPage,
  },
  {
    path: "/mentors/:mentorId",
    Component: MentorProfilePage,
  },
  {
    path: "/booking",
    element: (
      <RequireAuth>
        <BookingPortalPage />
      </RequireAuth>
    ),
  },
  {
    path: "/booking/date-time",
    element: (
      <RequireAuth>
        <BookingDateTimePage />
      </RequireAuth>
    ),
  },
  {
    path: "/booking/details",
    element: (
      <RequireAuth>
        <BookingDetailsPage />
      </RequireAuth>
    ),
  },
  {
    path: "/booking/confirmation",
    element: (
      <RequireAuth>
        <BookingConfirmationPage />
      </RequireAuth>
    ),
  },
  {
    path: "/programs",
    Component: ProgramsPage,
  },
  {
    path: "/events",
    Component: EventsPage,
  },
  {
    path: "/opportunities",
    Component: OpportunitiesPage,
  },
  {
    path: "/mentee-dashboard",
    element: (
      <RequireAuth>
        <MenteeDashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: MenteeDashboardHome },
      { path: "programs", element: <ProgramsPage embedded={true} /> },
      { path: "events", element: <EventsPage embedded={true} /> },
      { path: "opportunities", element: <OpportunitiesPage embedded={true} /> },
      { path: "mentors", element: <MentorsPage embedded={true} /> },
      { path: "calendar", Component: MenteeCalendarPage },
      { path: "messages", Component: MenteeMessagesPage },
    ],
  },
  {
    path: "/mentor-pending",
    element: (
      <RequireAuth>
        <MentorPendingPage />
      </RequireAuth>
    ),
  },
  {
    path: "/mentor-dashboard",
    element: (
      <RequireAuth>
        <MentorGate>
          <MentorDashboardLayout />
        </MentorGate>
      </RequireAuth>
    ),
    children: [
      { index: true, Component: MentorDashboard },
      { path: "calendar", Component: MentorCalendarPage },
      { path: "participants", Component: MentorParticipantsPage },
      { path: "messages", Component: MentorMessagesPage },
      { path: "reviews", Component: MentorReviewsPage },
      { path: "settings", Component: MentorSettingsPage },
    ],
  },
  {
    path: "/admin-dashboard",
    element: (
      <RequireAuth>
        <RequireRole role="admin">
          <AdminDashboardLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { index: true, Component: AdminHomePage },
      {
        path: "mentees",
        element: <AdminUsersTable role="mentee" title="All mentees" />,
      },
      {
        path: "mentors",
        element: (
          <AdminUsersTable
            role="mentor"
            title="All mentors"
            showMentorStatus
          />
        ),
      },
      { path: "mentor-requests", Component: AdminMentorRequestsPage },
      { path: "programs", Component: AdminProgramsPage },
      { path: "events", Component: AdminEventsPage },
      { path: "opportunities", Component: AdminOpportunitiesPage },
    ],
  },
  {
    path: "/signup",
    Component: SignUp,
  },
  {
    path: "/check-email",
    Component: CheckEmailPage,
  },
  {
    path: "/verify-email",
    Component: VerifyEmailPage,
  },
  {
    path: "/oauth/google/callback",
    element: (
      <RequireAuth>
        <GoogleOAuthCallbackPage />
      </RequireAuth>
    ),
  },
  {
    path: "/auth/google/callback",
    element: (
      <RequireAuth>
        <GoogleOAuthCallbackPage />
      </RequireAuth>
    ),
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/password-recovery",
    Component: PasswordRecovery,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
  },
]);