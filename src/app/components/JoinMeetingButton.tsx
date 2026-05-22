import { useState } from "react";
import { Video } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "../lib/api";

type JoinMeetingButtonProps = {
  bookingId: number;
  meetingUrl?: string | null;
  size?: "sm" | "default";
  className?: string;
  label?: string;
  onMeetingReady?: (url: string) => void;
};

export function JoinMeetingButton({
  bookingId,
  meetingUrl,
  size = "sm",
  className = "bg-blue-600 hover:bg-blue-700",
  label = "Join Call",
  onMeetingReady,
}: JoinMeetingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openMeeting = (url: string) => {
    onMeetingReady?.(url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleJoin = async () => {
    setError("");
    if (meetingUrl) {
      openMeeting(meetingUrl);
      return;
    }
    setLoading(true);
    try {
      const result = await api.createOrGetMeeting(bookingId);
      openMeeting(result.meeting_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the meeting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        size={size}
        className={className}
        disabled={loading}
        onClick={() => void handleJoin()}
      >
        <Video className="w-3.5 h-3.5 mr-1.5" />
        {loading ? "Opening…" : meetingUrl ? "Join Call" : label}
      </Button>
      {error ? <span className="text-xs text-red-600 max-w-xs">{error}</span> : null}
    </div>
  );
}
