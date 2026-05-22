import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  Award,
  GraduationCap,
  ListFilter,
  Clock,
  Send,
} from "lucide-react";
import { api, type Program, type ProgramCategory } from "../lib/api";
import { applyProgramFilters } from "../lib/programFilters";
import { ActivityDetailDialog } from "./ActivityDetailDialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PublicNavbar } from "./PublicNavbar";

const PROGRAMS_PAGE_SIZE = 6;

const CATEGORY_FILTERS: { id: "all" | ProgramCategory; label: string }[] = [
  { id: "all", label: "All Programs" },
  { id: "design", label: "Design" },
  { id: "development", label: "Development" },
  { id: "business", label: "Business" },
  { id: "marketing", label: "Marketing" },
  { id: "data_science", label: "Data Science" },
];

const DELIVERY_BADGE: Record<Program["delivery_mode"], string> = {
  online: "bg-prog-primary/10 text-prog-primary",
  hybrid: "bg-orange-100 text-orange-600",
};

function formatPrice(price: number): string {
  return `$${price.toLocaleString("en-US")}`;
}

type ProgramsPageProps = {
  embedded?: boolean;
};

export function ProgramsPage({ embedded = false }: ProgramsPageProps) {
  const [items, setItems] = useState<Program[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ProgramCategory>("all");
  const [visibleCount, setVisibleCount] = useState(PROGRAMS_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Program | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadPrograms = () => {
    setLoading(true);
    setError("");
    void api
      .getPrograms()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        setItems([]);
        setError(err instanceof Error ? err.message : "Failed to load programs.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const openDetails = (program: Program) => {
    setSelected(program);
    setDetailOpen(true);
  };

  const handleApplied = () => {
    void api.getPrograms().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      setSelected((prev) =>
        prev ? list.find((p) => p.id === prev.id) ?? { ...prev, applied: true } : null,
      );
    });
  };

  const filtered = useMemo(
    () => applyProgramFilters(items, { query, category: categoryFilter }),
    [items, query, categoryFilter],
  );

  const visiblePrograms = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(PROGRAMS_PAGE_SIZE);
  }, [query, categoryFilter]);

  const content = (
    <main
      className={`w-full ${
        embedded
          ? "px-8 py-6"
          : "px-6 md:px-20 lg:px-40 py-8 max-w-[1440px] mx-auto"
      }`}
    >
      <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
        <div className="flex min-w-72 flex-col gap-3">
          <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">
            Our Programs
          </h1>
          <p className="text-slate-600 text-lg font-normal max-w-2xl">
            Upskill with industry experts through our structured learning paths designed
            for career growth.
          </p>
        </div>
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-4 text-sm font-medium shadow-sm text-slate-700"
        >
          <ListFilter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="flex gap-3 pb-6 overflow-x-auto">
        {CATEGORY_FILTERS.map((filter) => {
          const active = categoryFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategoryFilter(filter.id)}
              className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors ${
                active
                  ? "bg-prog-primary text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {loading ? <p className="text-slate-500 mb-6">Loading programs…</p> : null}

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="text-slate-500 mb-8">No programs match your filters.</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visiblePrograms.map((program) => (
          <article
            key={program.id}
            className="flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-full aspect-video overflow-hidden bg-slate-100">
              <ImageWithFallback
                src={program.image_url}
                alt={program.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    DELIVERY_BADGE[program.delivery_mode]
                  }`}
                >
                  {program.delivery_mode === "online" ? "Online" : "Hybrid"}
                </span>
                <span className="text-prog-primary font-bold text-lg">
                  {formatPrice(program.price)}
                </span>
              </div>
              <h3 className="text-slate-900 text-xl font-bold mb-2">{program.title}</h3>
              <div className="flex items-center gap-2 mb-4">
                {program.mentor_image_url ? (
                  <div
                    className="size-6 rounded-full bg-cover bg-center shrink-0"
                    style={{ backgroundImage: `url("${program.mentor_image_url}")` }}
                  />
                ) : null}
                <p className="text-slate-600 text-sm">
                  Mentor:{" "}
                  <span className="font-semibold text-slate-900">{program.mentor_name}</span>
                </p>
              </div>
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Clock className="w-4 h-4 text-prog-primary shrink-0" />
                  <span>Duration: {program.duration_weeks} weeks</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600 text-sm">
                  <Award className="w-4 h-4 text-prog-primary shrink-0 mt-0.5" />
                  <span>Outcomes: {program.outcomes}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openDetails(program)}
                  disabled={program.applied}
                  className="flex-1 bg-prog-primary hover:bg-prog-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {program.applied ? "Enrolled" : "Enroll Now"}
                </button>
                <button
                  type="button"
                  onClick={() => openDetails(program)}
                  className="px-4 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-lg transition-colors text-sm hover:bg-slate-200"
                >
                  Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ActivityDetailDialog
        kind="program"
        item={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApplied={handleApplied}
      />

      {!loading && hasMore ? (
        <div className="flex justify-center mt-12">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PROGRAMS_PAGE_SIZE)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            Load More Programs
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      ) : null}
    </main>
  );

  if (embedded) {
    return <div className="bg-prog-bg min-h-full font-display">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-prog-bg font-display text-slate-900 flex flex-col">
      <PublicNavbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search programs..."
      />
      {content}
      <footer className="bg-white border-t border-slate-200 mt-20 py-12 px-6 md:px-20">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-prog-primary mb-4">
              <GraduationCap className="w-7 h-7" />
              <span className="text-slate-900 font-bold text-xl">NewRuz</span>
            </div>
            <p className="text-slate-600 text-sm">
              Leading the way in digital education and career-focused learning paths.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-prog-primary">
                  All Programs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-prog-primary">
                  For Mentors
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-prog-primary">
                  Enterprise
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-prog-primary">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-prog-primary">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-prog-primary">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-prog-primary">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-prog-primary">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Newsletter</h4>
            <p className="text-xs text-slate-600 mb-4">Get the latest updates on new programs.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email address"
                className="bg-slate-100 border-none rounded-l-lg w-full text-xs px-3 py-2 outline-none"
              />
              <button
                type="button"
                className="bg-prog-primary text-white px-3 py-2 rounded-r-lg"
                aria-label="Subscribe"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
