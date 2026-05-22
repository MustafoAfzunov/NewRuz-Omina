import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Mail, Lock, Eye, EyeOff, User, GraduationCap } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { register } from "../lib/auth";
import { PublicNavbar } from "./PublicNavbar";

export function SignUp() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<"mentee" | "mentor">("mentee");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const requestedRole = searchParams.get("role");
    if (requestedRole === "mentor" || requestedRole === "mentee") {
      setRole(requestedRole);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms before registration.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");

      const response = await register({
        email: formData.email.trim(),
        password: formData.password,
        role,
        firstName,
        lastName,
      });

      navigate(
        `/check-email?email=${encodeURIComponent(response.email)}&role=${encodeURIComponent(role)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Blue Header */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white/60" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Create Account</h1>
              <p className="text-blue-100 text-sm">Join our professional network today</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8">
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I want to join as a:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("mentee")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md border-2 transition-all ${
                      role === "mentee"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Mentee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("mentor")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md border-2 transition-all ${
                      role === "mentor"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span className="font-medium">Mentor</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="john@example.com"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters long with a mix of letters and numbers.
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className="mb-6">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, agreeToTerms: checked as boolean })
                    }
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                    By creating an account, you agree to our{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
              >
                {isSubmitting ? "Creating account..." : "Complete Registration"}
              </Button>

              <div className="text-center mt-6">
                <span className="text-sm text-gray-600">Already have an account? </span>
                <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-gray-500 space-x-4">
            <a href="#" className="hover:text-gray-700">About</a>
            <a href="#" className="hover:text-gray-700">Mentors</a>
            <a href="#" className="hover:text-gray-700">Success Stories</a>
            <a href="#" className="hover:text-gray-700">Support</a>
          </footer>
        </div>
      </main>
    </div>
  );
}