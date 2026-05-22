import { authFetch, getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type ProgramCategory =
  | "design"
  | "development"
  | "business"
  | "marketing"
  | "data_science";

export type ProgramDeliveryMode = "online" | "hybrid";

export type MenteeEnrolledProgram = {
  id: number;
  program_id: number;
  slug: string;
  title: string;
  category: ProgramCategory;
  delivery_mode: ProgramDeliveryMode;
  image_url: string;
  outcomes: string;
  mentor_name: string;
  duration_weeks: number;
  status: string;
  progress: number;
  next_step: string;
  created_at: string;
};

export type Program = {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: ProgramCategory;
  delivery_mode: ProgramDeliveryMode;
  image_url: string;
  price: number;
  duration_weeks: number;
  outcomes: string;
  mentor_name: string;
  mentor_image_url: string;
  applied?: boolean;
};

export type EventCategory = "workshop" | "seminar" | "bootcamp" | "networking";

export type EventItem = {
  id: number;
  title: string;
  description: string;
  category: EventCategory;
  image_url: string;
  application_deadline: string | null;
  starts_at: string;
  ends_at: string;
  location: string;
  applied?: boolean;
};

export type OpportunityCategory =
  | "internship"
  | "scholarship"
  | "volunteering"
  | "competition";

export type Opportunity = {
  id: number;
  title: string;
  description: string;
  category: OpportunityCategory;
  image_url: string;
  cta_label: string;
  deadline: string | null;
  is_ongoing: boolean;
  applied?: boolean;
};

export type ActivityApplicationResult = {
  id: number;
  status: string;
  message: string;
  created_at: string;
};

export type BookingStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export type Booking = {
  id: number;
  mentee: number;
  mentor: number;
  mentee_username: string;
  mentor_username: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  notes: string;
  meeting_url?: string;
};

export type MeetingResponse = {
  meeting_url: string;
  created: boolean;
  booking: Booking;
};

export type GoogleCalendarStatus = {
  oauth_configured: boolean;
  connected: boolean;
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  display_name: string;
  mentor_status: string;
  is_email_verified: boolean;
  is_active: boolean;
  date_joined: string;
};

export type AdminDashboard = {
  role: string;
  users_by_role: Record<string, number>;
  pending_mentors: number;
  bookings_by_status: Record<string, number>;
  programs: number;
  events: number;
  opportunities: number;
};

export type DashboardMentee = {
  role: "mentee";
  bookings_total: number;
  bookings_pending: number;
  reviews_written: number;
};

export type DashboardMentor = {
  role: "mentor";
  incoming_pending: number;
  approved_upcoming: number;
  reviews_received: number;
};

export type MentorPublic = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  verified: boolean;
  title: string;
  company: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  bg_color: string;
  profession: string;
  languages: string[];
  session_types: string[];
};

export type MenteePublic = {
  id: number;
  username: string;
  email: string;
};

export type MessageContact = {
  id: number;
  username: string;
  email: string;
};

export type Conversation = {
  id: number;
  mentor: number;
  mentee: number;
  other_user_id: number;
  other_username: string;
  other_email: string;
  last_message: string;
  last_message_at: string | null;
  unread_count: number;
  updated_at: string;
  created_at: string;
};

export type Message = {
  id: number;
  sender: number;
  sender_username: string;
  body: string;
  created_at: string;
  read_at: string | null;
  is_mine: boolean;
};

export type MentorAvailability = {
  mentor_id: number;
  date: string;
  duration_minutes: number;
  slots: Array<{
    time: string;
    start_at: string;
    end_at: string;
    available: boolean;
  }>;
};

export type Review = {
  id: number;
  booking: number;
  mentor: number;
  mentee: number;
  rating: number;
  comment: string;
  created_at: string;
};

function extractErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Request failed.";
  }
  const data = payload as Record<string, unknown>;
  if (typeof data.detail === "string") return data.detail;
  const firstValue = Object.values(data)[0];
  if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
  if (typeof firstValue === "string") return firstValue;
  return "Request failed.";
}

/** Use auth when logged in so list responses include `applied` for mentees. */
async function listRequest<T>(path: string): Promise<T> {
  if (getAuthToken()) {
    return authApiRequest<T>(path);
  }
  return apiRequest<T>(path);
}

async function apiRequest<T>(path: string, method: ApiMethod = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractErrorMessage(payload));
  return payload as T;
}

async function authApiRequest<T>(path: string, method: ApiMethod = "GET", body?: unknown): Promise<T> {
  const response = await authFetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(extractErrorMessage(payload));
  return payload as T;
}

export const api = {
  getPrograms: () => listRequest<Program[]>("/programs/"),
  getMyPrograms: () => authApiRequest<MenteeEnrolledProgram[]>("/my-programs/"),
  getProgram: (slug: string) => listRequest<Program>(`/programs/${slug}/`),
  getEvents: () => listRequest<EventItem[]>("/events/"),
  getEvent: (id: number) => listRequest<EventItem>(`/events/${id}/`),
  getOpportunities: () => listRequest<Opportunity[]>("/opportunities/"),
  getOpportunity: (id: number) => listRequest<Opportunity>(`/opportunities/${id}/`),

  applyToEvent: (eventId: number, message?: string) =>
    authApiRequest<ActivityApplicationResult>(`/events/${eventId}/apply/`, "POST", {
      message: message ?? "",
    }),
  applyToProgram: (slug: string, message?: string) =>
    authApiRequest<ActivityApplicationResult>(`/programs/${slug}/apply/`, "POST", {
      message: message ?? "",
    }),
  applyToOpportunity: (opportunityId: number, message?: string) =>
    authApiRequest<ActivityApplicationResult>(
      `/opportunities/${opportunityId}/apply/`,
      "POST",
      { message: message ?? "" },
    ),
  getMentors: () => apiRequest<MentorPublic[]>("/mentors/"),
  getMentees: () => authApiRequest<MenteePublic[]>("/mentees/"),
  getMentor: (id: number) => apiRequest<MentorPublic>(`/mentors/${id}/`),
  getMentorAvailability: (id: number, date: string, duration: number) =>
    apiRequest<MentorAvailability>(`/mentors/${id}/availability/?date=${date}&duration=${duration}`),

  getMenteeDashboard: () => authApiRequest<DashboardMentee>("/dashboard/mentee/"),
  getMentorDashboard: () => authApiRequest<DashboardMentor>("/dashboard/mentor/"),

  getBookings: () => authApiRequest<Booking[]>("/bookings/"),
  createBooking: (payload: { mentor: number; start_at: string; end_at: string; notes?: string }) =>
    authApiRequest<Booking>("/bookings/", "POST", payload),
  createMentorSession: (payload: { mentee: number; start_at: string; end_at: string; notes?: string }) =>
    authApiRequest<Booking>("/bookings/create-as-mentor/", "POST", payload),
  approveBooking: (bookingId: number) => authApiRequest<Booking>(`/bookings/${bookingId}/approve/`, "POST"),
  rejectBooking: (bookingId: number) => authApiRequest<Booking>(`/bookings/${bookingId}/reject/`, "POST"),
  completeBooking: (bookingId: number) => authApiRequest<Booking>(`/bookings/${bookingId}/complete/`, "POST"),
  cancelBooking: (bookingId: number) => authApiRequest<Booking>(`/bookings/${bookingId}/cancel/`, "POST"),
  createOrGetMeeting: (bookingId: number) =>
    authApiRequest<MeetingResponse>(`/bookings/${bookingId}/meeting/`, "POST"),

  getGoogleCalendarStatus: () => authApiRequest<GoogleCalendarStatus>("/google/calendar/status/"),
  getGoogleCalendarAuthUrl: () => authApiRequest<{ auth_url: string }>("/google/calendar/auth-url/"),
  connectGoogleCalendar: (code: string) =>
    authApiRequest<{ connected: boolean }>("/google/calendar/connect/", "POST", { code }),
  disconnectGoogleCalendar: () =>
    authApiRequest<{ connected: boolean }>("/google/calendar/disconnect/", "POST"),

  getReviews: () => authApiRequest<Review[]>("/reviews/"),
  createReview: (payload: { booking: number; rating: number; comment?: string }) =>
    authApiRequest<Review>("/reviews/", "POST", payload),

  getConversations: () => authApiRequest<Conversation[]>("/conversations/"),
  getConversation: (id: number) => authApiRequest<Conversation>(`/conversations/${id}/`),
  createConversation: (payload: { mentor_id?: number; mentee_id?: number }) =>
    authApiRequest<Conversation>("/conversations/", "POST", payload),
  getMessageContacts: () => authApiRequest<MessageContact[]>("/conversations/contacts/"),
  getConversationMessages: (conversationId: number) =>
    authApiRequest<Message[]>(`/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId: number, body: string) =>
    authApiRequest<Message>(`/conversations/${conversationId}/messages/`, "POST", { body }),

  getSavedMentors: () => authApiRequest<MentorPublic[]>("/saved-mentors/"),
  saveMentor: (mentorId: number) =>
    authApiRequest<MentorPublic>("/saved-mentors/", "POST", { mentor: mentorId }),
  unsaveMentor: (mentorId: number) =>
    authApiRequest<void>(`/saved-mentors/${mentorId}/`, "DELETE"),
  getMentorSavedStatus: (mentorId: number) =>
    authApiRequest<{ mentor_id: number; saved: boolean }>(`/saved-mentors/${mentorId}/`),

  getAdminDashboard: () => authApiRequest<AdminDashboard>("/dashboard/admin/"),
  getAdminUsers: (params?: { role?: string; mentor_status?: string }) => {
    const q = new URLSearchParams();
    if (params?.role) q.set("role", params.role);
    if (params?.mentor_status) q.set("mentor_status", params.mentor_status);
    const query = q.toString();
    return authApiRequest<AdminUser[]>(`/admin/users/${query ? `?${query}` : ""}`);
  },
  deleteAdminUser: (id: number) => authApiRequest<void>(`/admin/users/${id}/`, "DELETE"),
  approveMentor: (id: number) => authApiRequest<AdminUser>(`/admin/mentors/${id}/approve/`, "POST"),
  rejectMentor: (id: number) => authApiRequest<AdminUser>(`/admin/mentors/${id}/reject/`, "POST"),
  verifyUserEmail: (id: number) =>
    authApiRequest<AdminUser>(`/admin/users/${id}/verify-email/`, "POST"),

  createProgram: (payload: Omit<Program, "id" | "applied">) =>
    authApiRequest<Program>("/programs/", "POST", payload),
  updateProgram: (slug: string, payload: Partial<Program>) =>
    authApiRequest<Program>(`/programs/${slug}/`, "PATCH", payload),
  deleteProgram: (slug: string) => authApiRequest<void>(`/programs/${slug}/`, "DELETE"),

  createEvent: (payload: Omit<EventItem, "id" | "applied">) =>
    authApiRequest<EventItem>("/events/", "POST", payload),
  updateEvent: (id: number, payload: Partial<EventItem>) =>
    authApiRequest<EventItem>(`/events/${id}/`, "PATCH", payload),
  deleteEvent: (id: number) => authApiRequest<void>(`/events/${id}/`, "DELETE"),

  createOpportunity: (payload: Omit<Opportunity, "id" | "applied">) =>
    authApiRequest<Opportunity>("/opportunities/", "POST", payload),
  updateOpportunity: (id: number, payload: Partial<Opportunity>) =>
    authApiRequest<Opportunity>(`/opportunities/${id}/`, "PATCH", payload),
  deleteOpportunity: (id: number) => authApiRequest<void>(`/opportunities/${id}/`, "DELETE"),
};
