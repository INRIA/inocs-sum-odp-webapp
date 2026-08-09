export interface RouteEntry {
  pattern: string;
  experience: "data" | "insights" | "shared" | "landing";
}

export const ROUTES: RouteEntry[] = [
  { pattern: "/", experience: "landing" },
  { pattern: "/join", experience: "shared" },
  { pattern: "/data/*", experience: "data" },
  { pattern: "/tools/*", experience: "data" },
  { pattern: "/insights/*", experience: "insights" },
];

export const DATA_MENU = {
  items: [
    { href: "/data/kpis", label: "KPI dashboard" },
    { href: "/tools/impact_analysis", label: "Impact analysis" },
    { href: "/tools/mcda_analysis/", label: "Multi-criteria decision tool" },
    { href: "/join", label: "Join the project" },
  ],
};

export const INSIGHTS_MENU = {
  items: [
    { href: "/insights/goals", label: "What works" },
    { href: "/insights/cities", label: "City profiles" },
    { href: "/insights/plan", label: "Plan for my city" },
    { href: "/join", label: "Join the project" },
  ],
};
