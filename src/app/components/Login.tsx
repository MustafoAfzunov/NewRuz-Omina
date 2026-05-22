import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, Key } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  EmailNotVerifiedError,
  getDashboardPath,
  login,
  setAuthRole,
  setAuthToken,
  setAuthUser,
} from "../lib/auth";
import { PublicNavbar } from "./PublicNavbar";

export function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError("");
    setUnverifiedEmail(null);

    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      setAuthToken(response.token);
      setAuthUser(response.user);
      setAuthRole(response.user.role);

      const fromPath = (location.state as { from?: string } | null)?.from;
      if (fromPath) {
        navigate(fromPath);
        return;
      }

      navigate(getDashboardPath(response.user));
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        setError(err.message);
        setUnverifiedEmail(err.email);
      } else {
        setError(err instanceof Error ? err.message : "Login failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <PublicNavbar />

      <main className="flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Blue Header */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            <div className="relative w-20 h-20 mx-auto mb-4 bg-blue-400/40 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                <Lock className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Secure Login</h1>
            <p className="text-blue-100">Access your professional dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  to="/password-recovery"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                />
                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>
            </div>

            {/* Submit Button */}
            {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
            {unverifiedEmail ? (
              <p className="text-sm text-gray-600 mb-3">
                <Link
                  to={`/check-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Resend verification email
                </Link>
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="text-sm text-blue-600 hover:underline font-medium">
                Create account
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p className="mb-2">© 2024 SecureLogin Inc. Protected by 256-bit SSL encryption.</p>
          <div className="space-x-4">
            <a href="#" className="hover:text-gray-700">Support</a>
            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
            <a href="#" className="hover:text-gray-700">Terms of Service</a>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}