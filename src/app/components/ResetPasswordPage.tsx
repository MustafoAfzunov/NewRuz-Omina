import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { PublicNavbar } from "./PublicNavbar";
import { confirmPasswordReset } from "../lib/auth";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing reset token. Use the link from your email or request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await confirmPasswordReset(token, password);
      setSuccess(result.detail);
      window.setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-10 text-white text-center">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Set new password</h1>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="p-8">
            {!token ? (
              <p className="text-sm text-red-600 mb-4">
                Invalid reset link.{" "}
                <Link to="/password-recovery" className="underline font-medium">
                  Request a new one
                </Link>
                .
              </p>
            ) : null}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10"
                  minLength={8}
                  required
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
            {success ? <p className="text-sm text-green-700 mb-3">{success}</p> : null}

            <Button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
            >
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
