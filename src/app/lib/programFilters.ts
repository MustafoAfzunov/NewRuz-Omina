import type { Program, ProgramCategory } from "./api";

export type ProgramFilterState = {
  query: string;
  category: "all" | ProgramCategory;
};

export function applyProgramFilters(
  items: Program[],
  filters: ProgramFilterState,
): Program[] {
  const q = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCategory =
      filters.category === "all" || item.category === filters.category;
    const matchesSearch =
      !q ||
      [
        item.title,
        item.description,
        item.slug,
        item.mentor_name,
        item.outcomes,
        item.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    return matchesCategory && matchesSearch;
  });
}
