import type { ProgramCategory } from "./api";

const CATEGORY_STYLE: Record<
  ProgramCategory,
  { color: string; iconBg: string; emoji: string }
> = {
  design: { color: "bg-blue-50", iconBg: "bg-blue-100", emoji: "🎨" },
  development: { color: "bg-green-50", iconBg: "bg-green-100", emoji: "⚛️" },
  business: { color: "bg-amber-50", iconBg: "bg-amber-100", emoji: "📊" },
  marketing: { color: "bg-purple-50", iconBg: "bg-purple-100", emoji: "📣" },
  data_science: { color: "bg-cyan-50", iconBg: "bg-cyan-100", emoji: "📈" },
};

export function programCardStyle(category: ProgramCategory) {
  return CATEGORY_STYLE[category] ?? CATEGORY_STYLE.development;
}
