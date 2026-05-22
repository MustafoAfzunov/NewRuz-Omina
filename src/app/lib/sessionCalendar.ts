import type { Booking, BookingStatus } from "./api";

export function bookingLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function groupBookingsByDate(bookings: Booking[]): Map<string, Booking[]> {
  const map = new Map<string, Booking[]>();
  for (const booking of bookings) {
    const key = bookingLocalDateKey(booking.start_at);
    const list = map.get(key) ?? [];
    list.push(booking);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }
  return map;
}

export function formatSessionTimeRange(startAt: string, endAt: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(new Date(startAt))} – ${fmt.format(new Date(endAt))}`;
}

export function formatSessionDateLong(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  approved: "Confirmed",
  rejected: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BOOKING_STATUS_CLASS: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-gray-100 text-gray-600 border-gray-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export function isCalendarVisibleStatus(status: BookingStatus): boolean {
  return status !== "cancelled";
}

export function formatStartsInLabel(startAt: string): string | null {
  const ms = new Date(startAt).getTime() - Date.now();
  if (ms < 0) return null;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "STARTING NOW";
  if (minutes < 60) return `IN ${minutes} MINUTE${minutes === 1 ? "" : "S"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `IN ${hours} HOUR${hours === 1 ? "" : "S"}`;
  const days = Math.round(hours / 24);
  return `IN ${days} DAY${days === 1 ? "" : "S"}`;
}

export function formatSessionDayLabel(startAt: string): string {
  const start = new Date(startAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sessionDay = new Date(start);
  sessionDay.setHours(0, 0, 0, 0);
  const timeFmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (sessionDay.getTime() === today.getTime()) {
    return `Today · ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(start)}`;
  }
  if (sessionDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow · ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(start)}`;
  }
  return timeFmt.format(start);
}

export function bookingLocalDateKeyFromIso(iso: string): string {
  return bookingLocalDateKey(iso);
}

export function sessionsTodayCount(bookings: import("./api").Booking[]): number {
  const todayKey = bookingLocalDateKey(new Date().toISOString());
  return bookings.filter(
    (b) =>
      (b.status === "pending" || b.status === "approved") &&
      bookingLocalDateKey(b.start_at) === todayKey &&
      new Date(b.end_at).getTime() >= Date.now(),
  ).length;
}
