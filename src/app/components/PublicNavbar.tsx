import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { GraduationCap, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { NavigationDropdown } from "./NavigationDropdown";
import { clearAuth, getAuthToken, getAuthUser, getDashboardPath } from "../lib/auth";

type PublicNavbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
};

export function PublicNavbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search mentors...",
}: PublicNavbarProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const navigate = useNavigate();
  const value = searchValue ?? internalSearch;
  const token = getAuthToken();
  const user = getAuthUser();
  const dashboardPath = user ? getDashboardPath(user) : "/mentee-dashboard";

  const handleSearchChange = (next: string) => {
    if (onSearchChange) {
      onSearchChange(next);
      return;
    }
    setInternalSearch(next);
  };

  const handleSearchSubmit = () => {
    const term = value.trim();
    if (!term) return;
    navigate(`/mentors?q=${encodeURIComponent(term)}`);
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/platform" className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-semibold">NewRuz</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/platform" className="text-sm text-gray-700 hover:text-blue-600">
              Platform
            </Link>
            <Link to="/mentors" className="text-sm text-gray-700 hover:text-blue-600">
              Mentors
            </Link>
            <Link to="/platform#how-it-works" className="text-sm text-gray-700 hover:text-blue-600">
              About us
            </Link>
          </div>
          <NavigationDropdown />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              value={value}
              onChange={(event) => handleSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchSubmit();
                }
              }}
              placeholder={searchPlaceholder}
              className="pl-9 w-64"
            />
          </div>
          {token ? (
            <>
              <Link to={dashboardPath}>
                <Button variant="outline">My Dashboard</Button>
              </Link>
              <Button
                type="button"
                variant="ghost"
                className="text-gray-600"
                onClick={handleLogout}
              >
                Sign out
              </Button>
              {user ? (
                <span className="hidden lg:inline text-sm text-gray-500 max-w-[140px] truncate">
                  {user.username}
                </span>
              ) : null}
            </>
          ) : (
            <Link to="/login">
              <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
