# T04 — Vocabulary & Labels: Technical Architecture

**Epic:** 3 — Vocabulary & Labels
**Task:** T04 (Size S)
**Type:** Presentation-only change — no API, database, or identifier changes

---

## 1. Current State

Labels are **hardcoded inline strings** throughout .astro pages, React components, and helper functions. There is no i18n framework, no label constants file, and no abstraction layer. Category names (e.g., "Transport System - Time", "Impact - Environment") come from the API and appear in the mock data at `src/lib/api-client/mock-data/categories.json`.

---

## 2. Approach — Centralized Display-Label Map + In-Place Edits

### Why not introduce a full i18n system?

The project has no i18n requirement. Adding one for a vocabulary pass would:
- Introduce a dependency the team doesn't need yet
- Force every component to import a translation hook
- Be overkill for ~30 string replacements

### Recommended approach

1. **Create `src/lib/labels.ts`** — a single source of truth for display labels. Contains:
   - A `CATEGORY_DISPLAY_LABELS` map keyed by the **API category name** (identifier unchanged), returning the new display string.
   - A `displayCategoryName(apiName: string): string` function that looks up the map and falls back to the raw name.
   - Constants for PROMETHEE flow terms: `LABEL_NET_FLOW`, `LABEL_POSITIVE_FLOW`, `LABEL_NEGATIVE_FLOW` with their new display names and tooltip text.
   - Constants for "Score Matrix" -> "Your ratings" replacement.
   - A `GLOSSARY` record mapping each retained technical term to its plain-language explanation (feeds T21 in Epic 12).
   - A `SUM_LIVING_LAB_LABEL` and `CONTRIBUTING_CITY_LABEL` constant pair.

2. **Apply `displayCategoryName()` in components that render category names from API data** — this ensures that even if the API returns "Transport System - Time", the rendered output shows "Travel time".

3. **Direct string replacement** for all other hardcoded labels (MCDA flow labels, Score Matrix title, Living Lab distinction, measures phrasing).

4. **Update mock data** (`categories.json`) display names to match the new labels for local development consistency, while keeping `id` values unchanged.

### Why this works

- Minimal footprint: one new file (~60 lines), the rest are search-and-replace edits.
- The `displayCategoryName()` function acts as a presentation adapter — API identifiers flow through unchanged, only the display layer transforms.
- The glossary record is a data structure, not UI — it can be consumed by T21 later.

---

## 3. Label Mapping — Detailed File-by-File Change Plan

### 3.1 Category Names (API-driven)

**Mapping:**
| API Name (unchanged) | Display Label |
|---|---|
| Transport System - Time | Travel time |
| Transport System - Safety/Comfort | Safety & comfort |
| Transport System - Cost | Cost of travel |
| Impact - Environment | Environment |
| Impact - Society | Social outcomes |
| Impact - Economy | Local economy |

**Files that render category names from API data (need `displayCategoryName()`):**

These files receive category objects with a `.name` property from the API. They need to call `displayCategoryName(category.name)` when rendering:

| File | Lines | What changes |
|---|---|---|
| `src/components/react/ImpactAnalysis/MeasuresImpact.tsx` | 67 | `selectedGroup.name` rendered in warning alert |
| `src/components/react/MCDAAnalysis/ResultsSection.tsx` | 237 | `selectedGroup?.name` in "Results pending" message |
| `src/components/react/ui/DataDashboardFilter.tsx` | various | Category names rendered as filter buttons |
| `src/pages/tools/impact_analysis.astro` | 158 | Step description mentioning "Environment" example |
| Any component rendering `IKpiGroup.name` or `ICategory.name` in UI | various | Wrap in `displayCategoryName()` |

**Mock data update (for dev consistency):**

| File | Lines | Change |
|---|---|---|
| `src/lib/api-client/mock-data/categories.json` | 17, 39, 58, 77, 83, 89 | Update `name` values to new display labels |

### 3.2 PROMETHEE Flow Terms

**Mapping:**
| Current | New (display) | Tooltip text |
|---|---|---|
| Net flow | Overall score | PROMETHEE net flow (phi) |
| Positive flow | Strengths | PROMETHEE positive flow (phi+) |
| Negative flow | Weaknesses | PROMETHEE negative flow (phi-) |

**Note:** Variable names, interface properties, and API field names (`net_flows`, `positive_flows`, `negative_flows`) are **not changed**. Only the rendered text visible to users changes.

| File | Lines | What changes |
|---|---|---|
| `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx` | 275 | X-axis label "Net Flow (phi)" -> "Overall score (phi)" |
| `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx` | 343 | Empty state "No net flows data" -> "No overall scores data" |
| `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx` | 377 | Legend button "Net flow" -> "Overall score" |
| `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx` | 394 | Legend button "Positive flow" -> "Strengths" |
| `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx` | 410 | Legend button "Negative flow" -> "Weaknesses" |
| `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx` | 430 | Tooltip "Net Flow (phi):" -> "Overall score (phi):" |
| `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx` | 438 | Tooltip "Positive Flow (phi+):" -> "Strengths (phi+):" |
| `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx` | 446 | Tooltip "Negative Flow (phi-):" -> "Weaknesses (phi-):" |
| `src/components/react/MCDAAnalysis/D3McdaNetworkChart.tsx` | 441 | Tooltip "Net flow:" -> "Overall score:" |
| `src/components/react/MCDAAnalysis/D3McdaNetworkChart.tsx` | 445 | Tooltip "Positive flow:" -> "Strengths:" |
| `src/components/react/MCDAAnalysis/D3McdaNetworkChart.tsx` | 450 | Tooltip "Negative flow:" -> "Weaknesses:" |
| `src/components/react/MCDAAnalysis/D3McdaGaiaPlane.tsx` | 633 | Tooltip "Net Flow:" -> "Overall score:" |
| `src/components/react/MCDAAnalysis/McdaRankingAlternatives.tsx` | 72 | "Net Flow:" -> "Overall score:" |
| `src/lib/helpers/mcda-format.ts` | 456 | Description "Highest PROMETHEE net flow" -> "Highest overall score" |
| `src/lib/helpers/mcda-format.ts` | 460 | Tooltip text: keep technical explanation but lead with "Overall score" |
| `src/lib/helpers/mcda-format.ts` | 480 | Description "highest and lowest net flow" -> "highest and lowest overall score" |

### 3.3 Score Matrix -> "Your ratings"

**Mapping:** "Score Matrix" -> "Your ratings"

| File | Lines | What changes |
|---|---|---|
| `src/components/react/MCDAAnalysis/CustomAnalysisForm.tsx` | 444 | `title="Score Matrix"` -> `title="Your ratings"` |
| `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx` | 33 | Test assertion `screen.getByText(/score matrix/i)` -> `/your ratings/i` |
| `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx` | 36 | Test description "score matrix" -> "ratings table" |

**Note:** The component filename `ScoreMatrix.tsx` and its export name `ScoreMatrix` are internal identifiers and do NOT change.

### 3.4 Living Lab Distinction — "SUM Living Lab" vs "Contributing city"

**Mapping:**
- The 9 SUM project cities: label as "SUM Living Lab"
- Any non-SUM registered city: label as "Contributing city"

**Architecture decision:** The `labs` table has no `is_sum` flag. Two options:

**Option A (Recommended): Frontend constant list.**
Define a `SUM_PROJECT_LAB_IDS: Set<number>` or `SUM_PROJECT_LAB_NAMES: Set<string>` in `src/lib/labels.ts`. The 9 SUM project city names/IDs are fixed and known. The `displayLabType(lab)` function checks membership and returns "SUM Living Lab" or "Contributing city". This avoids a database migration for a presentation-only change.

**Option B: Database flag.**
Add `is_sum_project_lab Boolean @default(false)` to the `labs` model. Requires a migration + data seed. Cleaner long-term but violates the "presentation-only change" constraint of this epic.

Recommendation: **Option A**. The 9 cities are a fixed set defined by the Horizon Europe grant. If the set changes, updating a constant is trivial.

**Files that need the distinction applied:**

| File | Lines | What changes |
|---|---|---|
| `src/components/react/LivingLabsMapSection.tsx` | 67, 102, 113, 152, 200 | Heading: "Living Labs across Europe" -> conditionally show "SUM Living Labs" vs "Contributing cities" grouping; or keep "Cities across Europe" and add type badge per lab |
| `src/pages/index.astro` | 106, 112, 130, 132 | Hero text and stats: add explicit "SUM" qualifier where referring to project labs |
| `src/pages/faq.astro` | 9, 16, 40, 54 | FAQ questions: make SUM vs non-SUM explicit |
| `src/components/FAQsUserAccount.astro` | 8, 22 | Same FAQ in component |
| `src/components/react/form/LivingLabModeOptions.tsx` | 74-76 | Form labels: "Create new Living Lab" -> "Create new Contributing city" (only SUM labs are pre-seeded) |

**Simpler approach for the map section:** Instead of splitting the entire UI, add a visual badge/tag next to each lab name: "[SUM Living Lab]" or "[Contributing city]". This preserves the current layout while making the distinction unambiguous.

### 3.5 Policy Measures Phrasing — "Measures linked to better <X>"

**Mapping:** "Policy measures driving improvements for KPIs in group X" -> "Measures linked to better <plain-language X>"

This pattern appears in the Impact Analysis dashboard where measures are ranked per KPI group.

| File | Lines | What changes |
|---|---|---|
| `src/components/react/ImpactAnalysis/MeasuresImpact.tsx` | 29 | Section title: "Measures Impact" -> dynamically constructed "Measures linked to better {displayCategoryName(group)}" |
| `src/components/react/ImpactAnalysis/MeasuresImpact.tsx` | 182 | "Top N policy measures estimated to have..." -> "Top N measures linked to better {displayCategoryName(group)}" |
| `src/components/react/ImpactAnalysis/MeasuresImpact.tsx` | 217 | Same pattern for bottom measures |
| `src/components/react/ImpactAnalysis/ImpactAnalysisDashboard.tsx` | 79 | Tab label "Measures Impact" -> "Measures linked to outcomes" |

### 3.6 SUM/SUMP Disambiguation

**Context:** "SUM measures" = project-level interventions; "SUMP measures" = Sustainable Urban Mobility Plan measures (city-level). Currently the codebase uses "policy measures" generically.

| File | Lines | What changes |
|---|---|---|
| `src/components/react/KpisFrameworkDiagram.tsx` | 84 | "Level of completion of SUMP measures" -> "Level of completion of SUMP (city plan) measures" |
| `src/lib/api-client/mock-data/kpis.json` | 5-6 | KPI name/description: add "(city plan)" qualifier to SUMP |
| `src/pages/tools/impact_analysis.astro` | 226 | "Sustainable Urban Mobility Plan (SUMP)" -> already explicit, verify tooltip |
| `src/pages/lab-admin/measures.astro` | 36 | "SUMP" reference -> add context "(city-level mobility plan)" |

---

## 4. New File: `src/lib/labels.ts`

```typescript
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
 * The 9 SUM Horizon Europe project cities.
 * Add lab names (or IDs once stable) here.
 * Every other registered lab is a "Contributing city".
 */
export const SUM_PROJECT_LAB_NAMES = new Set<string>([
  // Populate with actual 9 SUM city names
]);

export const SUM_LIVING_LAB_LABEL = "SUM Living Lab";
export const CONTRIBUTING_CITY_LABEL = "Contributing city";

export function displayLabType(labName: string): string {
  return SUM_PROJECT_LAB_NAMES.has(labName)
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
```

---

## 5. Files That Must NOT Change

These contain identifiers, API field names, or CSV column names that must remain stable:

- `src/types/JobRun.ts` — `net_flows`, `positive_flows`, `negative_flows` properties
- `src/bff/services/csv-export.service.ts` — CSV column keys
- `prisma/schema.prisma` — all model/field names
- `src/types/*.ts` — interface property names
- Component filenames and export names (e.g., `ScoreMatrix.tsx`, `D3McdaNetFlowsChart.tsx`)
- Internal variable names (`netFlow`, `positiveFlow`, `negativeFlow` etc.)

---

## 6. Testing Strategy

### Automated verification
- Run `grep -rn` for each old string (left column of the mapping table) across `src/` — zero matches expected in rendered output (JSX text content and string literals that are user-facing).
- Existing tests in `CustomAnalysisForm.test.tsx` need assertion updates for "Your ratings".
- Existing tests in `mcda-format.test.ts` need assertion updates for flow term labels.
- `analytics.test.ts` assertions for "Living Labs" label remain valid (not changing that label globally).

### Manual verification
- Visual sweep of every public page:
  - Home page (`/`)
  - Living Lab city pages (`/living-lab-city/[id]`)
  - Data pages (`/data/kpis`, `/data/modal-split`, `/data/measures`, `/data/collection-plan`)
  - Impact analysis (`/tools/impact_analysis`)
  - MCDA analysis pages (qualitative, quantitative, personalized)
  - Resources (`/tools/resources`)
  - FAQ (`/faq`)
  - Lab admin pages (measures, modal-split, analytics, home, signup, set-lab)

---

## 7. Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Category names from API don't match map keys | Low | `displayCategoryName()` falls back to raw name; no breakage |
| SUM project lab list needs updating | Low | Single constant to update |
| Tooltip text too long | Low | Keep tooltip concise; test on mobile |
| Test failures from string changes | Certain | Update test assertions as part of this task |
| Confusion between internal identifiers and display | Low | Architecture doc explicitly states what changes and what doesn't |
