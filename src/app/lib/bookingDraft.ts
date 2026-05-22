export type BookingSessionType = {
  title: string;
  duration: string;
  durationMinutes: number;
  description: string;
};

export const BOOKING_SESSION_OPTIONS: BookingSessionType[] = [
  {
    title: "Initial Consultation",
    duration: "60 MINS",
    durationMinutes: 60,
    description:
      "A comprehensive deep-dive into your requirements, background analysis, and professional goal setting.",
  },
  {
    title: "Follow-up Session",
    duration: "30 MINS",
    durationMinutes: 30,
    description:
      "Review progress from previous sessions, adjust ongoing strategies, and tackle immediate roadblocks.",
  },
  {
    title: "Quick Sync",
    duration: "15 MINS",
    durationMinutes: 15,
    description:
      "Short check-in for urgent questions or brief updates on specific tasks. Best for established clients.",
  },
];

/** Display labels for mentor profile sidebar (maps to BOOKING_SESSION_OPTIONS by index). */
export const MENTOR_PROFILE_SESSION_LABELS = [
  { label: "1:1 Video Call", subtitle: "60 minutes · focused advice" },
  { label: "Follow-up Session", subtitle: "30 minutes · progress check-in" },
  { label: "Quick Sync", subtitle: "15 minutes · quick questions" },
] as const;

export function sessionPriceForMentor(session: BookingSessionType, hourlyRate: number): number {
  if (session.durationMinutes >= 60) return hourlyRate;
  if (session.durationMinutes >= 30) return Math.max(40, Math.round(hourlyRate * 0.55));
  return Math.max(40, hourlyRate - 20);
}

export type BookingDraft = {
  mentorId?: number;
  session?: BookingSessionType;
  date?: string;
  time?: string;
  /** ISO datetimes from mentor availability API — use for booking to avoid timezone drift */
  slotStartAt?: string;
  slotEndAt?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

const STORAGE_KEY = "newruz_booking_draft";

export function getBookingDraft(): BookingDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return {};
  }
}

export type BookingDraftPatch = {
  [K in keyof BookingDraft]?: BookingDraft[K] | null;
};

export function setBookingDraft(patch: BookingDraftPatch): BookingDraft {
  const next: BookingDraft = { ...getBookingDraft() };

  (Object.keys(patch) as (keyof BookingDraft)[]).forEach((key) => {
    const value = patch[key];
    if (value === undefined || value === null) {
      delete next[key];
    } else {
      next[key] = value as never;
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearBookingDraft(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSession(draft: BookingDraft = getBookingDraft()): boolean {
  return Boolean(draft.session?.title && draft.session.durationMinutes);
}

export function hasDateTime(draft: BookingDraft = getBookingDraft()): boolean {
  return Boolean(draft.date && draft.time);
}

export function isReadyForDetails(draft: BookingDraft = getBookingDraft()): boolean {
  return hasSession(draft) && hasDateTime(draft);
}

export function isReadyForConfirmation(draft: BookingDraft = getBookingDraft()): boolean {
  return isReadyForDetails(draft);
}

export function getBookingStepPath(step: 1 | 2 | 3 | 4): string {
  switch (step) {
    case 1:
      return "/booking";
    case 2:
      return "/booking/date-time";
    case 3:
      return "/booking/details";
    case 4:
      return "/booking/confirmation";
    default:
      return "/booking";
  }
}

export function getMissingBookingSteps(draft: BookingDraft = getBookingDraft()): string[] {
  const missing: string[] = [];
  if (!hasSession(draft)) missing.push("session type");
  if (!draft.date) missing.push("date");
  if (!draft.time) missing.push("time slot");
  return missing;
}

export function formatBookingDateLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export function parseTime12h(time: string): { hours: number; minutes: number } {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return { hours: 9, minutes: 0 };
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

export function buildBookingTimes(
  date: string,
  time: string,
  durationMinutes: number,
): { start_at: string; end_at: string } {
  const { hours, minutes } = parseTime12h(time);
  const start = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start_at: start.toISOString(), end_at: end.toISOString() };
}

export type CalendarCell = {
  key: string;
  day: number | null;
  isoDate: string | null;
  muted: boolean;
};

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ key: `pad-${i}`, day: null, isoDate: null, muted: true });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cellDate = new Date(`${isoDate}T12:00:00`);
    const muted = cellDate < today;
    cells.push({
      key: isoDate,
      day,
      isoDate,
      muted,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `trail-${cells.length}`, day: null, isoDate: null, muted: true });
  }

  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
