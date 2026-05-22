import type { MentorPublic } from "./api";

export type MentorLanguageKey = "english" | "spanish" | "french";

export type MentorFilterState = {
  query: string;
  profession: string;
  languages: Record<MentorLanguageKey, boolean>;
  sessionType: string;
  minRating: number;
  priceRange: [number, number];
  availabilityDate: string;
  availableMentorIds: Set<number> | null;
};

export function applyMentorFilters(
  mentors: MentorPublic[],
  filters: MentorFilterState,
): MentorPublic[] {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const selectedLanguages = (
    Object.entries(filters.languages) as [MentorLanguageKey, boolean][]
  )
    .filter(([, enabled]) => enabled)
    .map(([lang]) => lang);

  return mentors.filter((mentor) => {
    const haystack = [
      mentor.display_name,
      mentor.username,
      mentor.email,
      mentor.title,
      mentor.company,
      mentor.description,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
    const matchesPrice =
      mentor.price >= filters.priceRange[0] && mentor.price <= filters.priceRange[1];
    const matchesRating =
      filters.minRating <= 0 || mentor.rating >= filters.minRating;
    const matchesProfession =
      filters.profession === "all" || mentor.profession === filters.profession;
    const mentorLanguages = mentor.languages ?? ["english"];
    const matchesLanguage =
      selectedLanguages.length === 0 ||
      selectedLanguages.some((lang) => mentorLanguages.includes(lang));
    const mentorSessionTypes = mentor.session_types ?? ["1-on-1"];
    const matchesSessionType = mentorSessionTypes.includes(filters.sessionType);
    const matchesAvailability =
      !filters.availabilityDate ||
      filters.availableMentorIds === null ||
      filters.availableMentorIds.has(mentor.id);

    return (
      matchesSearch &&
      matchesPrice &&
      matchesRating &&
      matchesProfession &&
      matchesLanguage &&
      matchesSessionType &&
      matchesAvailability
    );
  });
}
