/**
 * Centralized display-label map for the SUM ODP frontend.
 *
 * API identifiers, variable names, and CSV column names are UNCHANGED.
 * This module translates API-facing names to user-facing display labels.
 */

// --- KPI Category display names ---

const CATEGORY_DISPLAY_LABELS: Record<string, string> = {
  "Transport System - Time": "Travel time",
  "Transport System - Safety/Comfort": "Safety & comfort",
  "Transport System - Cost": "Cost of travel",
  "Impact - Environment": "Environment",
  "Impact - Society": "Social outcomes",
  "Impact - Economy": "Local economy",
};

export function displayCategoryName(apiName: string): string {
  return CATEGORY_DISPLAY_LABELS[apiName] ?? apiName;
}

// --- PROMETHEE flow display labels ---

export const FLOW_LABELS = {
  net: { display: "Overall score", symbol: "phi", tooltipPrefix: "PROMETHEE net flow" },
  positive: { display: "Strengths", symbol: "phi+", tooltipPrefix: "PROMETHEE positive flow" },
  negative: { display: "Weaknesses", symbol: "phi-", tooltipPrefix: "PROMETHEE negative flow" },
} as const;

// --- Score Matrix ---

export const SCORE_MATRIX_DISPLAY = "Your ratings";

// --- Living Lab type distinction ---

/**
 * The 9 SUM Horizon Europe project cities have IDs 1–9 (seeded in order).
 * Any lab with id > 9 is a "Contributing city".
 */
export const SUM_PROJECT_MAX_LAB_ID = 9;

export const SUM_LIVING_LAB_LABEL = "SUM Living Lab";
export const CONTRIBUTING_CITY_LABEL = "Contributing city";

export function displayLabType(labId: number): string {
  return labId <= SUM_PROJECT_MAX_LAB_ID
    ? SUM_LIVING_LAB_LABEL
    : CONTRIBUTING_CITY_LABEL;
}

// --- Glossary (feeds T21 / Epic 12) ---

export const GLOSSARY: Record<string, string> = {
  "PROMETHEE": "Preference Ranking Organization Method for Enrichment Evaluations — a multi-criteria decision analysis method.",
  "GAIA": "Geometrical Analysis for Interactive Aid — a visual tool that projects PROMETHEE results onto a 2D plane.",
  "Net flow (phi)": "The overall PROMETHEE score: positive flow minus negative flow. Higher is better.",
  "Positive flow (phi+)": "How much an alternative outperforms all others. Higher means more strengths.",
  "Negative flow (phi-)": "How much an alternative is outperformed by others. Lower means fewer weaknesses.",
  "SUMP": "Sustainable Urban Mobility Plan — a city-level strategic plan for sustainable transport.",
  "KPI": "Key Performance Indicator — a measurable value demonstrating progress toward objectives.",
  "NSM": "New Shared Mobility — shared transport modes such as bike-sharing, e-scooters, car-sharing.",
  "Ridge regression": "A regression technique used here to estimate each measure's contribution to KPI changes, handling collinearity when measures outnumber cities.",
  "Modal split": "The distribution of trips across transport modes (e.g., car, bus, bike, walking).",
};
