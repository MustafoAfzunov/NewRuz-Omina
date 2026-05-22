import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowRight, ChevronLeft, KeyRound, CheckCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { PublicNavbar } from "./PublicNavbar";
import { requestPasswordReset } from "../lib/auth";

export function PasswordRecovery() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(trimmed);
      setSuccess(result.detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-12 text-white text-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
              <div className="relative w-20 h-20 mx-auto mb-4 bg-blue-400/40 rounded-full flex items-center justify-center">
                <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold">Password Recovery</h1>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-700 text-sm mb-6">{success}</p>
                <p className="text-xs text-gray-500 mb-6">
                  Check your inbox and spam folder. The link expires in 1 hour.
                </p>
                <Link to="/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Back to sign in</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  Forgot your password?
                </h2>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Enter your registered email address below and we&apos;ll send you a link to reset
                  your password.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Sending…" : "Send Reset Link"}
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <div className="mt-8 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p className="mb-2">© 2024 Security Center. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
