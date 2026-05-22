import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type MentorAvailability } from "../lib/api";
import { formatBookingDateLabel } from "../lib/bookingDraft";

type Slot = MentorAvailability["slots"][number];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type MentorDashboardAvailabilityProps = {
  mentorId: number;
};

export function MentorDashboardAvailability({ mentorId }: MentorDashboardAvailabilityProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return {
        iso: toIsoDate(date),
        label: ["M", "T", "W", "T", "F", "S", "S"][index],
        dayNum: String(date.getDate()),
        isToday: isSameDay(date, today),
        isPast: date < today,
      };
    });
  }, [weekStart, today]);

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
    return `${fmt.format(weekStart)} – ${fmt.format(end)}`;
  }, [weekStart]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void api
      .getMentorAvailability(mentorId, selectedDate, 60)
      .then((data) => {
        if (!cancelled) setSlots(data.slots);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load availability.");
          setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mentorId, selectedDate]);

  const availableCount = slots.filter((slot) => slot.available).length;
  const bookedCount = slots.filter((slot) => !slot.available).length;
  const isSelectedToday = selectedDate === toIsoDate(today);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">Availability</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const prev = new Date(weekStart);
              prev.setDate(prev.getDate() - 7);
              setWeekStart(prev);
            }}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-500 min-w-[100px] text-center">{weekLabel}</span>
          <button
            type="button"
            onClick={() => {
              const next = new Date(weekStart);
              next.setDate(next.getDate() + 7);
              setWeekStart(next);
            }}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map((day) => (
          <div key={day.iso} className="text-center text-xs font-medium text-gray-500">
            {day.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day) => {
          const isSelected = selectedDate === day.iso;
          return (
            <button
              key={day.iso}
              type="button"
              disabled={day.isPast}
              onClick={() => setSelectedDate(day.iso)}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white ring-2 ring-blue-200"
                  : day.isToday
                    ? "bg-blue-100 text-blue-800"
                    : day.isPast
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day.dayNum}
            </button>
          );
        })}
      </div>

      <p className="text-xs font-semibold tracking-wide text-gray-500 mb-2">
        SLOTS · {formatBookingDateLabel(selectedDate)}
      </p>

      {loading ? <p className="text-sm text-gray-500 mb-3">Loading…</p> : null}
      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2 mb-3 max-h-32 overflow-y-auto">
        {slots.length === 0 && !loading && !error ? (
          <p className="col-span-2 text-sm text-gray-500">No slots for this day.</p>
        ) : null}
        {slots.map((slot) => (
          <div
            key={slot.start_at}
            className={`text-center text-xs py-2 px-1 rounded-md border ${
              slot.available
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-gray-100 bg-gray-50 text-gray-400"
            }`}
          >
            {slot.time}
            <span className="block text-[10px] opacity-80">
              {slot.available ? "Open" : "Booked"}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isSelectedToday ? "Available today" : "Open on selected day"}
          </p>
          <p className="text-sm font-bold text-blue-600">
            {availableCount} slot{availableCount === 1 ? "" : "s"}
          </p>
        </div>
        {bookedCount > 0 ? (
          <p className="text-xs text-gray-500">
            {bookedCount} booked · {bookedCount + availableCount} total
          </p>
        ) : null}
      </div>
    </div>
  );
}
