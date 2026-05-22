import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api } from "../lib/api";
import { getAuthRole } from "../lib/auth";

export function GoogleOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Connecting your Google Calendar…");

  useEffect(() => {
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");

    if (getAuthRole() !== "mentor") {
      setMessage("You must be logged in as a mentor to connect Google Calendar.");
      return;
    }

    if (oauthError) {
      setMessage(`Google sign-in was cancelled or failed (${oauthError}).`);
      return;
    }

    if (!code) {
      setMessage("Missing authorization code from Google.");
      return;
    }

    void api
      .connectGoogleCalendar(code)
      .then(() => {
        navigate("/mentor-dashboard/settings?google=connected", { replace: true });
      })
      .catch((err) => {
        const text =
          err instanceof Error && err.message && err.message !== "Request failed."
            ? err.message
            : "Could not connect Google Calendar. Restart the Django server after updating backend/.env, then try Connect again.";
        setMessage(text);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl border p-8 text-center shadow-sm">
        <p className="text-gray-700 mb-6">{message}</p>
        <Link
          to="/mentor-dashboard/settings"
          className="text-blue-600 font-medium hover:underline"
        >
          Back to Settings
        </Link>
      </div>
    </div>
  );
}
