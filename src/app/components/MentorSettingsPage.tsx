import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Settings, LogOut, Video, Link2, Unlink } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "../lib/api";
import { clearAuth, getAuthUser } from "../lib/auth";

export function MentorSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getAuthUser();
  const [googleStatus, setGoogleStatus] = useState<{
    oauth_configured: boolean;
    connected: boolean;
  } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleMessage, setGoogleMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("google") === "connected") {
      setGoogleMessage("Google Calendar connected successfully. You can create Meet links for sessions.");
    }
    void api
      .getGoogleCalendarStatus()
      .then(setGoogleStatus)
      .catch(() => setGoogleStatus({ oauth_configured: false, connected: false }));
  }, [searchParams]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    setGoogleMessage("");
    try {
      const { auth_url } = await api.getGoogleCalendarAuthUrl();
      window.location.href = auth_url;
    } catch (err) {
      setGoogleMessage(
        err instanceof Error
          ? err.message
          : "Could not start Google sign-in. Ask your administrator to configure Google OAuth.",
      );
      setGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setGoogleLoading(true);
    setGoogleMessage("");
    try {
      await api.disconnectGoogleCalendar();
      setGoogleStatus((s) => (s ? { ...s, connected: false } : s));
      setGoogleMessage("Google Calendar disconnected.");
    } catch (err) {
      setGoogleMessage(err instanceof Error ? err.message : "Could not disconnect.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Your mentor account on NewRuz.</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="bg-white rounded-xl border p-6 space-y-5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Username</p>
            <p className="text-lg font-semibold text-gray-900">{user?.username ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
            <p className="text-lg font-semibold text-gray-900">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{user?.role ?? "mentor"}</p>
          </div>
          <div className="pt-4 border-t flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Google Meet for sessions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Connect your Google account so &quot;Join Call&quot; creates a real Google Meet
                link for approved mentorship sessions. Mentees receive the same link on their
                dashboard and calendar invite when applicable.
              </p>
            </div>
          </div>

          {googleStatus ? (
            <p className="text-sm">
              Status:{" "}
              <span
                className={
                  googleStatus.connected
                    ? "text-green-700 font-semibold"
                    : "text-amber-700 font-semibold"
                }
              >
                {googleStatus.connected ? "Connected" : "Not connected"}
              </span>
              {!googleStatus.oauth_configured ? (
                <span className="block text-gray-500 mt-1">
                  Server OAuth is not configured yet (GOOGLE_OAUTH_CLIENT_ID / SECRET).
                </span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Checking Google connection…</p>
          )}

          {googleMessage ? (
            <p className="text-sm rounded-lg bg-blue-50 text-blue-900 px-3 py-2">{googleMessage}</p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {googleStatus?.connected ? (
              <Button
                type="button"
                variant="outline"
                disabled={googleLoading}
                onClick={() => void handleDisconnectGoogle()}
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect Google
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={googleLoading || googleStatus?.oauth_configured === false}
                onClick={() => void handleConnectGoogle()}
              >
                <Link2 className="w-4 h-4 mr-2" />
                {googleLoading ? "Redirecting…" : "Connect Google Calendar"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
