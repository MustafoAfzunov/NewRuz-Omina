import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  Plus,
  Search,
  Trophy,
  Wallet,
} from "lucide-react";
import { api, type Opportunity, type OpportunityCategory } from "../lib/api";
import { applyOpportunityFilters } from "../lib/opportunityFilters";
import { ActivityDetailDialog } from "./ActivityDetailDialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PublicNavbar } from "./PublicNavbar";

const OPPORTUNITIES_PER_PAGE = 6;

const CATEGORY_FILTERS: {
  id: "all" | OpportunityCategory;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "internship", label: "Internships", icon: Briefcase },
  { id: "scholarship", label: "Scholarships", icon: Wallet },
  { id: "volunteering", label: "Volunteering", icon: HeartHandshake },
  { id: "competition", label: "Competitions", icon: Trophy },
];

const CATEGORY_LABEL: Record<OpportunityCategory, string> = {
  internship: "Internship",
  scholarship: "Scholarship",
  volunteering: "Volunteering",
  competition: "Competition",
};

const CATEGORY_BADGE: Record<OpportunityCategory, string> = {
  internship: "bg-blue-100 text-blue-600",
  scholarship: "bg-green-100 text-green-600",
  volunteering: "bg-purple-100 text-purple-600",
  competition: "bg-orange-100 text-orange-600",
};

function formatDeadline(opportunity: Opportunity): string {
  if (opportunity.is_ongoing) return "Ongoing";
  if (!opportunity.deadline) return "Open";
  const date = new Date(`${opportunity.deadline}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type OpportunitiesPageProps = {
  embedded?: boolean;
};

export function OpportunitiesPage({ embedded = false }: OpportunitiesPageProps) {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | OpportunityCategory>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadOpportunities = () => {
    setLoading(true);
    setError("");
    void api
      .getOpportunities()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        setItems([]);
        setError(err instanceof Error ? err.message : "Failed to load opportunities.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const openDetails = (opportunity: Opportunity) => {
    setSelected(opportunity);
    setDetailOpen(true);
  };

  const handleApplied = () => {
    void api.getOpportunities().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      setSelected((prev) =>
        prev ? list.find((o) => o.id === prev.id) ?? { ...prev, applied: true } : null,
      );
    });
  };

  const filtered = useMemo(
    () => applyOpportunityFilters(items, { query, category: categoryFilter }),
    [items, query, categoryFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / OPPORTUNITIES_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * OPPORTUNITIES_PER_PAGE;
    return filtered.slice(start, start + OPPORTUNITIES_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, categoryFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const content = (
    <main
      className={`flex flex-col flex-1 w-full ${
        embedded ? "px-8 py-6" : "px-6 md:px-20 py-10 max-w-7xl mx-auto"
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-slate-900 text-4xl md:text-5xl font-black leading-tight tracking-tight">
            Explore Opportunities
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Find the perfect next step for your career. We&apos;ve curated the best
            internships, scholarships, and more just for you.
          </p>
        </div>
        <button
          type="button"
          className="bg-opp-primary text-white px-6 py-3 rounded-lg font-bold text-sm tracking-wide hover:shadow-lg hover:shadow-opp-primary/30 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Post Opportunity
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-opp-primary/5 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="flex items-center bg-opp-bg rounded-lg px-4 h-12 focus-within:ring-2 focus-within:ring-opp-primary/50 transition-all">
              <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by job title, keyword, or company..."
                className="bg-transparent border-none focus:ring-0 w-full text-slate-900 placeholder:text-slate-400 outline-none text-sm"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const active = categoryFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setCategoryFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-opp-primary text-white"
                      : "bg-white border border-opp-primary/10 text-slate-600 hover:border-opp-primary hover:text-opp-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? <p className="text-slate-500 mb-6">Loading opportunities…</p> : null}

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="text-slate-500 mb-8">No opportunities match your filters.</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((opportunity) => (
          <article
            key={opportunity.id}
            className="group bg-white rounded-xl overflow-hidden border border-opp-primary/5 hover:border-opp-primary/30 hover:shadow-xl transition-all flex flex-col"
          >
            <div className="h-48 bg-slate-200 overflow-hidden">
              <ImageWithFallback
                src={opportunity.image_url}
                alt={opportunity.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                    CATEGORY_BADGE[opportunity.category]
                  }`}
                >
                  {CATEGORY_LABEL[opportunity.category]}
                </span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-opp-primary transition-colors"
                  aria-label="Bookmark opportunity"
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-opp-primary transition-colors">
                {opportunity.title}
              </h3>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-grow">
                {opportunity.description}
              </p>
              <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-opp-primary/5">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                    Deadline
                  </span>
                  <span className="text-sm font-bold text-red-500">
                    {formatDeadline(opportunity)}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openDetails(opportunity)}
                    className="border border-opp-primary/20 text-opp-primary px-3 py-2 rounded font-bold text-xs hover:bg-opp-primary/5 transition-all"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => openDetails(opportunity)}
                    disabled={opportunity.applied}
                    className="bg-opp-primary/10 text-opp-primary px-4 py-2 rounded font-bold text-xs hover:bg-opp-primary hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {opportunity.applied ? "Applied" : opportunity.cta_label}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ActivityDetailDialog
        kind="opportunity"
        item={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApplied={handleApplied}
      />

      {!loading && filtered.length > OPPORTUNITIES_PER_PAGE ? (
        <nav className="mt-12 flex justify-center items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-opp-primary/10 text-slate-500 hover:bg-opp-primary hover:text-white transition-all disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium text-sm transition-all ${
                currentPage === page
                  ? "bg-opp-primary text-white font-bold"
                  : "border border-opp-primary/10 text-slate-500 hover:bg-opp-primary/10 hover:text-opp-primary"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-opp-primary/10 text-slate-500 hover:bg-opp-primary hover:text-white transition-all disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      ) : null}
    </main>
  );

  if (embedded) {
    return <div className="bg-opp-bg min-h-full font-body">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-opp-bg font-body text-slate-900 flex flex-col">
      <PublicNavbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search opportunities..."
      />
      {content}
      <footer className="bg-white border-t border-opp-primary/10 py-12 px-6 md:px-20 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 text-opp-primary">
            <div className="w-6 h-6 flex items-center justify-center bg-opp-primary rounded text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h2 className="text-slate-900 text-lg font-bold">NewRuz</h2>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-slate-500 text-sm hover:text-opp-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-500 text-sm hover:text-opp-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-slate-500 text-sm hover:text-opp-primary transition-colors">
              Help Center
            </a>
          </div>
          <p className="text-slate-500 text-sm">© 2026 NewRuz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
