import { Link } from "react-router";
import {
  getBookingStepPath,
  getBookingDraft,
  hasSession,
  isReadyForConfirmation,
  isReadyForDetails,
} from "../lib/bookingDraft";

type BookingProgressNavProps = {
  currentStep: 1 | 2 | 3 | 4;
  variant?: "sidebar" | "bar";
};

const steps = [
  { step: 1 as const, label: "Select Session" },
  { step: 2 as const, label: "Pick Date & Time" },
  { step: 3 as const, label: "Your Details" },
  { step: 4 as const, label: "Confirmation" },
];

function canAccessStep(step: 1 | 2 | 3 | 4): boolean {
  const draft = getBookingDraft();
  if (step === 1) return true;
  if (step === 2) return hasSession(draft);
  if (step === 3) return isReadyForDetails(draft);
  if (step === 4) return isReadyForConfirmation(draft);
  return false;
}

export function BookingProgressNav({ currentStep, variant = "bar" }: BookingProgressNavProps) {
  if (variant === "sidebar") {
    return (
      <div className="space-y-2 text-sm">
        {steps.map(({ step, label }) => {
          const enabled = canAccessStep(step);
          const isCurrent = currentStep === step;
          if (enabled) {
            return (
              <Link
                key={step}
                to={getBookingStepPath(step)}
                className={`block rounded-xl px-3 py-2.5 font-medium ${
                  isCurrent
                    ? "border bg-blue-50 border-blue-200 text-blue-700"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                {step} {label}
              </Link>
            );
          }
          return (
            <span
              key={step}
              className="block rounded-xl px-3 py-2.5 text-gray-300 cursor-not-allowed"
              title="Complete the previous steps first"
            >
              {step} {label}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-sm">
      {steps.map(({ step, label }) => {
        const enabled = canAccessStep(step);
        const isCurrent = currentStep === step;
        if (enabled) {
          return (
            <Link
              key={step}
              to={getBookingStepPath(step)}
              className={`rounded-lg border px-3 py-2 text-center ${
                isCurrent
                  ? "border-blue-300 bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {step} {label}
            </Link>
          );
        }
        return (
          <button
            key={step}
            type="button"
            disabled
            className="rounded-lg border px-3 py-2 text-gray-300 cursor-not-allowed"
            title="Complete the previous steps first"
          >
            {step} {label}
          </button>
        );
      })}
    </div>
  );
}
