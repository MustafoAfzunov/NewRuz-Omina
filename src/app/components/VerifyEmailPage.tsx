import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { PublicNavbar } from "./PublicNavbar";
import {
  getDashboardPath,
  resendVerificationEmail,
  setAuthRole,
  setAuthToken,
  setAuthUser,
  verifyEmail,
} from "../lib/auth";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const emailHint = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Use the link from your email or request a new one.");
      return;
    }

    let cancelled = false;
    verifyEmail(token)
      .then((result) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(result.detail);
        if (result.token && result.user) {
          setAuthToken(result.token);
          setAuthUser(result.user);
          setAuthRole(result.user.role);
          window.setTimeout(() => {
            navigate(getDashboardPath(result.user!));
          }, 2000);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      });

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const handleResend = async () => {
    if (!emailHint.trim()) {
      setMessage("Open the link from your email, or go to sign in and use resend from the check-email page.");
      return;
    }
    setIsResending(true);
    try {
      const result = await resendVerificationEmail(emailHint.trim());
      setMessage(result.detail);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not resend email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          {status === "loading" ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900">Verifying your email…</h1>
            </>
          ) : null}
          {status === "success" ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified</h1>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
              <p className="text-xs text-gray-500">Redirecting to your dashboard…</p>
              <Link to="/login" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
                Or sign in manually
              </Link>
            </>
          ) : null}
          {status === "error" ? (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
              {emailHint ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-3"
                  disabled={isResending}
                  onClick={() => void handleResend()}
                >
                  {isResending ? "Sending…" : "Resend verification email"}
                </Button>
              ) : null}
              <Link
                to={emailHint ? `/check-email?email=${encodeURIComponent(emailHint)}` : "/check-email"}
                className="block text-sm text-blue-600 hover:underline font-medium mb-2"
              >
                Go to check email page
              </Link>
              <Link to="/login" className="text-sm text-gray-500 hover:underline">
                Back to sign in
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
