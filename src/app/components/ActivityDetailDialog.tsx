import { useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, Clock, MapPin, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api, type EventItem, type Opportunity, type Program } from "../lib/api";
import { getAuthRole, getAuthToken } from "../lib/auth";

export type ActivityKind = "event" | "program" | "opportunity";

type ActivityDetailDialogProps = {
  kind: ActivityKind;
  item: EventItem | Program | Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityDetailDialog({
  kind,
  item,
  open,
  onOpenChange,
  onApplied,
}: ActivityDetailDialogProps) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const applied = item && "applied" in item ? Boolean(item.applied) : false;

  const handleApply = async () => {
    if (!item) return;
    if (!getAuthToken()) {
      navigate("/login");
      return;
    }
    if (getAuthRole() !== "mentee") {
      setError("Only mentee accounts can apply.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      if (kind === "event") {
        await api.applyToEvent((item as EventItem).id, message);
      } else if (kind === "program") {
        await api.applyToProgram((item as Program).slug, message);
      } else {
        await api.applyToOpportunity((item as Opportunity).id, message);
      }
      setSuccess(true);
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setMessage("");
      setError("");
      setSuccess(false);
    }
    onOpenChange(next);
  };

  if (!item) return null;

  const title = item.title;
  const description = item.description;
  const imageUrl = item.image_url;

  let applyLabel = "Apply Now";
  if (kind === "program") applyLabel = "Enroll Now";
  if (kind === "opportunity") applyLabel = (item as Opportunity).cta_label || "Apply Now";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl pr-8">{title}</DialogTitle>
          <DialogDescription className="sr-only">Details and application</DialogDescription>
        </DialogHeader>

        {imageUrl ? (
          <div className="h-40 rounded-lg overflow-hidden bg-gray-100 -mt-2">
            <ImageWithFallback src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : null}

        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{description}</p>

        <ul className="space-y-2 text-sm text-gray-700">
          {kind === "event" ? (
            <>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <span>
                  <strong>Starts:</strong> {formatDateTime((item as EventItem).starts_at)}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <span>
                  <strong>Ends:</strong> {formatDateTime((item as EventItem).ends_at)}
                </span>
              </li>
              {(item as EventItem).location ? (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  <span>{(item as EventItem).location}</span>
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <span>
                  <strong>Apply by:</strong>{" "}
                  {formatDate((item as EventItem).application_deadline)}
                </span>
              </li>
            </>
          ) : null}

          {kind === "program" ? (
            <>
              <li>
                <strong>Delivery:</strong>{" "}
                {(item as Program).delivery_mode === "online" ? "Online" : "Hybrid"}
              </li>
              <li>
                <strong>Duration:</strong> {(item as Program).duration_weeks} weeks
              </li>
              <li>
                <strong>Price:</strong> ${(item as Program).price.toLocaleString("en-US")}
              </li>
              {(item as Program).mentor_name ? (
                <li>
                  <strong>Mentor:</strong> {(item as Program).mentor_name}
                </li>
              ) : null}
              {(item as Program).outcomes ? (
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{(item as Program).outcomes}</span>
                </li>
              ) : null}
            </>
          ) : null}

          {kind === "opportunity" ? (
            <>
              <li>
                <strong>Deadline:</strong>{" "}
                {(item as Opportunity).is_ongoing
                  ? "Ongoing"
                  : formatDate((item as Opportunity).deadline)}
              </li>
            </>
          ) : null}
        </ul>

        {!applied && !success ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Why you're interested, relevant experience, etc."
            />
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Your application was submitted successfully.
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          {applied || success ? (
            <Button type="button" disabled className="bg-gray-400">
              Applied
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleApply()}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Submitting…" : applyLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
