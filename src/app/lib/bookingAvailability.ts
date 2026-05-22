import { api } from "./api";
import { buildBookingTimes, type BookingDraft } from "./bookingDraft";

export function normalizeSlotTimeLabel(time: string): string {
  return time.trim().replace(/\s+/g, " ").toUpperCase();
}

export async function validateDraftSlotAvailable(
  draft: BookingDraft,
  mentorId: number,
): Promise<{ ok: true; slotStartAt: string; slotEndAt: string } | { ok: false; message: string }> {
  if (!draft.date || !draft.time || !draft.session) {
    return { ok: false, message: "Please select a date and time." };
  }

  const data = await api.getMentorAvailability(
    mentorId,
    draft.date,
    draft.session.durationMinutes,
  );

  const slot = draft.slotStartAt
    ? data.slots.find((item) => item.start_at === draft.slotStartAt)
    : data.slots.find(
        (item) => normalizeSlotTimeLabel(item.time) === normalizeSlotTimeLabel(draft.time!),
      );

  if (!slot) {
    return {
      ok: false,
      message: "This time is no longer offered. Please choose another slot.",
    };
  }

  if (!slot.available) {
    return {
      ok: false,
      message: "This mentor is already booked at that time. Please choose another time.",
    };
  }

  return { ok: true, slotStartAt: slot.start_at, slotEndAt: slot.end_at };
}

export function getBookingTimesFromDraft(draft: BookingDraft): { start_at: string; end_at: string } | null {
  if (draft.slotStartAt && draft.slotEndAt) {
    return { start_at: draft.slotStartAt, end_at: draft.slotEndAt };
  }
  if (!draft.date || !draft.time || !draft.session) return null;
  return buildBookingTimes(draft.date, draft.time, draft.session.durationMinutes);
}
