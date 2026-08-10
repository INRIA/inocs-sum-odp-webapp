export interface Goal {
  slug: string;
  title: string;
  description: string;
  kpiGroupPatterns: string[];
  icon: string;
}

export const GOALS: Goal[] = [
  {
    slug: "reduce-car-use",
    title: "Reduce private car use",
    description: "Shift trips away from private cars toward shared and public modes.",
    kpiGroupPatterns: ["private car", "private mode", "modal split"],
    icon: "car",
  },
  {
    slug: "increase-public-transport",
    title: "Increase public transport use",
    description: "Grow ridership on public transport, including integration with new shared mobility.",
    kpiGroupPatterns: ["public transport", "pt ", "transit"],
    icon: "bus",
  },
  {
    slug: "cut-emissions",
    title: "Cut emissions",
    description: "Reduce transport-related greenhouse gas emissions and air pollutants.",
    kpiGroupPatterns: ["emission", "environment", "co2", "carbon"],
    icon: "leaf",
  },
  {
    slug: "improve-accessibility",
    title: "Improve accessibility",
    description: "Shorten travel times and improve access to destinations across the city.",
    kpiGroupPatterns: ["accessibility", "travel time"],
    icon: "clock",
  },
  {
    slug: "improve-safety",
    title: "Improve safety",
    description: "Make journeys safer and more comfortable for all users.",
    kpiGroupPatterns: ["safety"],
    icon: "shield",
  },
  {
    slug: "improve-mobility-service",
    title: "Improve mobility service",
    description: "Enhance overall mobility service quality and multimodality.",
    kpiGroupPatterns: ["mobility service", "multimodal"],
    icon: "route",
  },
];
