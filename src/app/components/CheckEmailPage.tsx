import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Mail } from "lucide-react";
import { Button } from "./ui/button";
import { PublicNavbar } from "./PublicNavbar";
import { resendVerificationEmail } from "../lib/auth";

export function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email.trim()) {
      setError("No email address on file. Register again or contact support.");
      return;
    }
    setIsResending(true);
    setError("");
    setMessage("");
    try {
      const result = await resendVerificationEmail(email.trim());
      setMessage(result.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 px-8 py-8 text-center text-white">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-blue-100 text-sm mt-2">We sent you a verification link</p>
          </div>
          <div className="p-8 text-center">
            <p className="text-gray-600 text-sm mb-4">
              Click the link in the email we sent
              {email ? (
                <>
                  {" "}
                  to <span className="font-semibold text-gray-900">{email}</span>
                </>
              ) : (
                " to your inbox"
              )}{" "}
              to verify your account. Mentees and mentors must verify before signing in.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Check your spam folder. On the live site, the server must have Gmail SMTP configured
              in Render (newruz-api environment variables).
            </p>
            {message ? <p className="text-sm text-green-700 mb-4">{message}</p> : null}
            {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-3"
              disabled={isResending || !email}
              onClick={() => void handleResend()}
            >
              {isResending ? "Sending…" : "Resend verification email"}
            </Button>
            <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
