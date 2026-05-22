import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Star, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PublicNavbar } from "./PublicNavbar";
import { api, type MentorPublic } from "../lib/api";
import { applyMentorFilters, type MentorLanguageKey } from "../lib/mentorFilters";

const MENTORS_PER_PAGE = 6;

type MentorsPageProps = {
  embedded?: boolean;
};

export function MentorsPage({ embedded = false }: MentorsPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profession, setProfession] = useState("all");
  const [languages, setLanguages] = useState<Record<MentorLanguageKey, boolean>>({
    english: true,
    spanish: false,
    french: false,
  });
  const [sessionType, setSessionType] = useState("1-on-1");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([20, 150]);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [availableMentorIds, setAvailableMentorIds] = useState<Set<number> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [mentors, setMentors] = useState<MentorPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError("");
    void api
      .getMentors()
      .then((data) => setMentors(Array.isArray(data) ? data : []))
      .catch((err) => {
        setMentors([]);
        setError(err instanceof Error ? err.message : "Failed to load mentors.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!availabilityDate || mentors.length === 0) {
      setAvailableMentorIds(null);
      setAvailabilityLoading(false);
      return;
    }

    let cancelled = false;
    setAvailabilityLoading(true);

    void Promise.all(
      mentors.map(async (mentor) => {
        try {
          const data = await api.getMentorAvailability(mentor.id, availabilityDate, 60);
          const hasOpenSlot = data.slots.some((slot) => slot.available);
          return hasOpenSlot ? mentor.id : null;
        } catch {
          return null;
        }
      }),
    ).then((ids) => {
      if (cancelled) return;
      setAvailableMentorIds(
        new Set(ids.filter((id): id is number => id !== null)),
      );
      setAvailabilityLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [availabilityDate, mentors]);

  const filteredMentors = useMemo(
    () =>
      applyMentorFilters(mentors, {
        query,
        profession,
        languages,
        sessionType,
        minRating,
        priceRange,
        availabilityDate,
        availableMentorIds,
      }),
    [
      mentors,
      query,
      profession,
      languages,
      sessionType,
      minRating,
      priceRange,
      availabilityDate,
      availableMentorIds,
    ],
  );

  const totalPages = Math.max(1, Math.ceil(filteredMentors.length / MENTORS_PER_PAGE));

  const paginatedMentors = useMemo(() => {
    const start = (currentPage - 1) * MENTORS_PER_PAGE;
    return filteredMentors.slice(start, start + MENTORS_PER_PAGE);
  }, [filteredMentors, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    profession,
    languages,
    sessionType,
    minRating,
    priceRange,
    availabilityDate,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleLanguage = (lang: MentorLanguageKey) => {
    setLanguages((prev) => ({
      ...prev,
      [lang]: !prev[lang],
    }));
  };

  const toggleMinRating = (star: number) => {
    setMinRating((prev) => (prev === star ? 0 : star));
  };

  const pageBody = (
    <>
      <div className="flex">
        <aside className="w-56 bg-white border-r p-5 min-h-[calc(100vh-65px)] sticky top-[65px]">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold mb-2.5 block text-gray-900">
                Profession
              </label>
              <Select value={profession} onValueChange={setProfession}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All Professions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Professions</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="data">Data Science</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2.5 block text-gray-900">
                Language
              </label>
              <div className="space-y-2.5">
                {(["english", "spanish", "french"] as MentorLanguageKey[]).map((lang) => (
                  <div key={lang} className="flex items-center gap-2">
                    <Checkbox
                      id={lang}
                      checked={languages[lang]}
                      onCheckedChange={() => toggleLanguage(lang)}
                    />
                    <Label htmlFor={lang} className="cursor-pointer text-sm capitalize">
                      {lang}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2.5 block text-gray-900">
                Session Type
              </label>
              <RadioGroup value={sessionType} onValueChange={setSessionType}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="1-on-1" id="1-on-1" />
                  <Label htmlFor="1-on-1" className="cursor-pointer text-sm">
                    1:1 Session
                  </Label>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <RadioGroupItem value="workshop" id="workshop" />
                  <Label htmlFor="workshop" className="cursor-pointer text-sm">
                    Group Workshop
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2.5 block text-gray-900">
                Availability
              </label>
              <Input
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                className="text-sm text-gray-700"
              />
              {availabilityDate && availabilityLoading ? (
                <p className="text-xs text-gray-500 mt-1.5">Checking open slots…</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-semibold mb-2.5 block text-gray-900">
                Minimum Rating
              </label>
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => toggleMinRating(star)}
                    className="focus:outline-none transition-colors"
                    aria-label={`Minimum ${star} stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        minRating > 0 && star <= minRating
                          ? "fill-blue-600 text-blue-600"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {minRating > 0 ? `${minRating}+ stars` : "Any rating"}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2.5 block text-gray-900">
                Price Range
              </label>
              <div className="text-sm text-gray-600 mb-3">
                ${priceRange[0]} - ${priceRange[1]}
              </div>
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange([value[0], value[1]])}
                min={0}
                max={200}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </aside>

        <main className="flex-1 px-8 py-6">
          {embedded ? (
            <div className="relative max-w-md mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or keyword"
                className="pl-9"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between mb-7">
            <h1 className="text-2xl font-bold text-gray-900">Recommended Mentors</h1>
            <p className="text-sm text-gray-500">
              {loading
                ? "Loading mentors..."
                : availabilityLoading
                  ? "Checking availability…"
                  : `${filteredMentors.length} mentors found`}
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-5 mb-10">
            {paginatedMentors.map((mentor) => (
              <div key={mentor.id}>
                <div
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/mentors/${mentor.id}`)}
                >
                  <div className={`${mentor.bg_color} h-44 relative`}>
                    <div className="absolute top-3 right-3 bg-white rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        {mentor.rating}
                      </span>
                    </div>
                    <ImageWithFallback
                      src={mentor.image}
                      alt={mentor.display_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-0.5 text-gray-900">
                      {mentor.display_name}
                    </h3>
                    <p className="text-sm text-blue-600 mb-3">
                      {mentor.title} @ {mentor.company}
                    </p>
                    <p className="text-sm text-gray-600 mb-5 leading-relaxed line-clamp-2">
                      {mentor.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-gray-900">${mentor.price}</span>
                        <span className="text-sm text-gray-500">/hr</span>
                      </div>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/mentors/${mentor.id}`);
                        }}
                      >
                        Book Session
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && !error && filteredMentors.length === 0 ? (
            <p className="text-sm text-gray-500 mb-6">
              No mentors match your filters. Try widening the price range or clearing the
              availability date.
            </p>
          ) : null}

          {filteredMentors.length > MENTORS_PER_PAGE ? (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : null}
        </main>
      </div>

      {!embedded ? (
        <footer className="bg-white border-t mt-16 py-8">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">NewRuz</span>
              </div>

              <div className="flex gap-8 text-sm text-gray-600">
                <a href="#" className="hover:text-gray-900 transition-colors">
                  About
                </a>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-gray-900 transition-colors">
                  Support
                </a>
              </div>

              <p className="text-sm text-gray-500">
                © 2026 NewRuz Inc. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="bg-gray-50 min-h-full">{pageBody}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by name or keyword"
      />
      {pageBody}
    </div>
  );
}
