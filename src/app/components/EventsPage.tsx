import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, GraduationCap, Search } from "lucide-react";
import { api, type EventCategory, type EventItem } from "../lib/api";
import { ActivityDetailDialog } from "./ActivityDetailDialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PublicNavbar } from "./PublicNavbar";

const EVENTS_PER_PAGE = 6;

const CATEGORY_FILTERS: { id: "all" | EventCategory; label: string }[] = [
  { id: "all", label: "All Events" },
  { id: "workshop", label: "Workshops" },
  { id: "seminar", label: "Seminars" },
  { id: "bootcamp", label: "Bootcamps" },
  { id: "networking", label: "Networking" },
];

const CATEGORY_LABEL: Record<EventCategory, string> = {
  workshop: "Workshop",
  seminar: "Seminar",
  bootcamp: "Bootcamp",
  networking: "Networking",
};

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "Open registration";
  const date = new Date(`${deadline}T12:00:00`);
  return `Deadline: ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

type EventsPageProps = {
  embedded?: boolean;
};

export function EventsPage({ embedded = false }: EventsPageProps) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | EventCategory>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadEvents = () => {
    setLoading(true);
    setError("");
    void api
      .getEvents()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        setItems([]);
        setError(err instanceof Error ? err.message : "Failed to load events.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openDetails = (event: EventItem) => {
    setSelected(event);
    setDetailOpen(true);
  };

  const handleApplied = () => {
    void api.getEvents().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      setSelected((prev) => (prev ? list.find((e) => e.id === prev.id) ?? { ...prev, applied: true } : null));
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesSearch =
        !q ||
        [item.title, item.description, item.location, CATEGORY_LABEL[item.category]]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [items, query, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / EVENTS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * EVENTS_PER_PAGE;
    return filtered.slice(start, start + EVENTS_PER_PAGE);
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
      className={`font-body text-nr-on-surface antialiased ${
        embedded ? "px-8 py-6" : "pt-28 pb-20 px-6 md:px-12 max-w-7xl mx-auto"
      }`}
    >
      {embedded ? (
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nr-on-surface-variant" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-nr-on-surface placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nr-primary/30"
          />
        </div>
      ) : null}

      <header className="mb-12">
        <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-nr-on-surface tracking-tight mb-4">
          Featured Events
        </h1>
        <p className="text-nr-on-surface-variant max-w-2xl text-lg">
          Curated workshops, seminars, and networking sessions designed to accelerate
          your professional growth and technical mastery.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-gray-200/80">
        {CATEGORY_FILTERS.map((filter) => {
          const active = categoryFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategoryFilter(filter.id)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                active
                  ? "bg-nr-primary text-nr-on-primary shadow-md"
                  : "bg-nr-secondary-container text-nr-primary hover:bg-nr-secondary-container/80"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-nr-on-surface-variant">Loading events…</p>
      ) : null}

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="text-nr-on-surface-variant mb-8">No events match your filters.</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginated.map((event) => (
          <article
            key={event.id}
            className="group flex flex-col bg-nr-surface-lowest rounded-xl overflow-hidden border border-gray-200/50 shadow-[0px_12px_32px_rgba(76,48,250,0.06)] transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <ImageWithFallback
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-nr-tertiary-container text-nr-on-tertiary-container text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                  {CATEGORY_LABEL[event.category] ?? event.category}
                </span>
              </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
              <h3 className="font-headline font-bold text-xl text-nr-on-surface mb-3 line-clamp-1">
                {event.title}
              </h3>
              <p className="text-nr-on-surface-variant text-sm leading-relaxed mb-6 flex-grow line-clamp-2">
                {event.description}
              </p>
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-nr-primary shrink-0" />
                <span className="text-xs font-bold text-nr-on-surface-variant uppercase tracking-wider">
                  {formatDeadline(event.application_deadline)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openDetails(event)}
                  className="flex-1 border border-nr-primary/30 text-nr-primary py-3 rounded-lg font-bold text-sm hover:bg-nr-primary/5 transition-colors"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => openDetails(event)}
                  disabled={event.applied}
                  className="flex-1 bg-gradient-to-r from-nr-primary to-nr-primary-dim text-nr-on-primary py-3 rounded-lg font-bold text-sm tracking-wide transition-all hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {event.applied ? "Applied" : "Apply Now"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ActivityDetailDialog
        kind="event"
        item={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApplied={handleApplied}
      />

      {!loading && filtered.length > EVENTS_PER_PAGE ? (
        <div className="mt-16 flex justify-center items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-nr-on-surface-variant hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${
                currentPage === page
                  ? "bg-nr-primary text-nr-on-primary font-bold shadow-sm"
                  : "text-nr-on-surface-variant hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-nr-on-surface-variant hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : null}
    </main>
  );

  if (embedded) {
    return <div className="bg-nr-surface min-h-full">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-nr-surface">
      <PublicNavbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search events..."
      />
      {content}
      <footer className="w-full border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-center py-12 px-6 md:px-12 max-w-7xl mx-auto gap-6">
          <div className="flex items-center gap-2 text-lg font-bold text-nr-on-surface font-headline">
            <div className="w-8 h-8 rounded-lg bg-nr-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span>NewRuz</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-xs font-medium uppercase tracking-widest text-gray-500">
            <a href="#" className="hover:text-nr-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-nr-primary transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-nr-primary transition-colors">
              Support
            </a>
          </div>
          <p className="text-xs text-gray-500">© 2026 NewRuz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
