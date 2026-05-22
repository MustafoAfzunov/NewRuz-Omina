import type { Opportunity, OpportunityCategory } from "./api";

export type OpportunityFilterState = {
  query: string;
  category: "all" | OpportunityCategory;
};

export function applyOpportunityFilters(
  items: Opportunity[],
  filters: OpportunityFilterState,
): Opportunity[] {
  const q = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCategory =
      filters.category === "all" || item.category === filters.category;
    const matchesSearch =
      !q ||
      [item.title, item.description, item.category, item.cta_label]
        .join(" ")
        .toLowerCase()
        .includes(q);
    return matchesCategory && matchesSearch;
  });
}
