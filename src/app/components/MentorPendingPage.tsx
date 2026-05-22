import { Link } from "react-router";
import { Clock } from "lucide-react";
import { Button } from "./ui/button";
import { PublicNavbar } from "./PublicNavbar";
import { clearAuth, getAuthUser } from "../lib/auth";

export function MentorPendingPage() {
  const user = getAuthUser();

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application under review</h1>
          <p className="text-sm text-gray-600 mb-6">
            Thanks for registering as a mentor{user?.email ? ` (${user.email})` : ""}. An
            administrator will review your application and approve your account. You&apos;ll be
            able to use the mentor dashboard once approved.
          </p>
          <Button type="button" variant="outline" className="w-full mb-3" onClick={handleLogout}>
            Sign out
          </Button>
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
