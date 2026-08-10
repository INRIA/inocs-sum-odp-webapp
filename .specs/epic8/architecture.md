# Architecture — Epic 8: Insights Goal Experience

**Tasks:** T13 (L) → T15 (L) — sequential
**Wave:** B + C | **Effort:** 2×L | **Stack:** Astro 5 SSR + React 19 islands
**Dependencies:** After Epics 2, 3, 4, 6 (T02 implementation record split, T03 data-sufficiency rule, T04 vocabulary, T05 evidence badges, T08 curated domains, T10 experience mechanism, T12 Insights menu)

---

## 1. Summary

Epic 8 builds the Insights homepage and goal pages — the single most visible expression of the V2 redesign. Both pages are built entirely from data mapping over existing impact-analysis output (rule G5: no new model, no new data class).

**T13 — Insights homepage (goal-led entry).** A new page at `/insights/goals` presenting six goal cards (e.g. "Reduce private car use"), each derived from a confirmed goal→KPI-group mapping. The page includes a hero, goal cards with live measure/city counts, a top-findings block with evidence-strength badges, a city map, and a cross-link to the Data experience.

**T15 — Goal pages.** One template at `/insights/goals/[goalSlug]`, six instances — one per goal. Each page lists measures associated with the goal's KPI groups, ranked by evidence strength from the existing impact-analysis output, with measure cards showing description, city count, outcome, evidence badge, and contributing city links.

---

## 2. Design Decisions with Rationale

### 2.1 Goal→KPI-group mapping is a static configuration, not computed

The six goals and their KPI-group associations are confirmed in the epic spec. This mapping is defined once as a static data structure in a shared module (`src/lib/insights/goals.ts`) and consumed by both T13 and T15. The mapping does not change at runtime — it is a curated editorial decision.

Three orphaned KPI groups (Social outcomes, Local economy, sustainable private modes/NSM) are Data-experience only. No seventh goal is created for them.

### 2.2 Rankings derive from existing impact-analysis output — no recomputation

The impact-analysis API already produces regression coefficients and rankings of measures per KPI group. The goal pages reuse these results by:
1. Fetching impact-analysis results for the KPI groups mapped to each goal
2. Ranking measures by the strength of their statistical association (coefficient magnitude × evidence-strength badge level)
3. Displaying the pre-existing results in a plain-language card format

No new model run, no new regression, no new data structure.

### 2.3 Evidence-strength badges from T05 gate what appears

Every model-derived figure carries an evidence-strength badge (from T05). The Insights experience applies a minimum threshold: only results with badge level ≥ "Moderate" appear on goal pages. Results below threshold are available in the Data experience but excluded from the curated Insights surface.

### 2.4 Top findings are editorially structured sentences, not raw model output

The top-findings block on the Insights homepage shows three plain-language finding sentences. These are generated at render time from the highest-evidence associations across all goals, formatted as: "[Measure] is associated with [direction] in [KPI group plain name] across [N] cities (evidence: [badge level])."

### 2.5 Insights pages are Astro pages with React islands for interactive elements

Following the hard boundary (Astro SSR + React islands):
- Astro pages fetch all data server-side via `ApiClient`
- Goal cards, finding cards, and measure cards are React components receiving serialized props
- No client-side data fetching; no Prisma in React

### 2.6 New routes belong to the Insights experience

Both routes register in the experience registry as `"insights"`:

```typescript
{ pattern: "/insights/goals", experience: "insights" },
```

### 2.7 Curated domain set from T08 drives the goal→KPI-group filtering

The curated domain set (T08) defines which KPI groups are relevant for the Insights experience. The goal→KPI-group mapping is a subset of these curated domains. The mapping reuses the same curated-set definition so both the impact-analysis default and the goal pages stay consistent.

---

## 3. T13 Architecture — Insights Homepage (Goal-Led Entry)

### 3a. New file: `src/pages/insights/goals/index.astro`

```astro
---
import Layout from "../../../layouts/Layout.astro";
import { GoalCard } from "../../../components/react/Insights/GoalCard";
import { TopFindings } from "../../../components/react/Insights/TopFindings";
import { InsightsCityMap } from "../../../components/react/Insights/InsightsCityMap";
import { GOALS, type Goal } from "../../../lib/insights/goals";
import ApiClient from "../../../lib/api-client/ApiClient";
import { getUrl } from "../../../lib/helpers";

const api = new ApiClient(Astro.request);

// Fetch impact-analysis results and city/measure data
const impactResults = await api.getImpactAnalysisResults();
const livingLabs = await api.getLivingLabs();
const measures = await api.getMeasures();

// Compute per-goal stats from the mapping
const goalStats = GOALS.map(goal => ({
  ...goal,
  measureCount: countMeasuresForGoal(goal, impactResults, measures),
  cityCount: countCitiesForGoal(goal, impactResults, livingLabs),
  hasEvidence: hasQualifyingEvidence(goal, impactResults),
})).filter(g => g.hasEvidence);

// Compute top 3 findings across all goals
const topFindings = computeTopFindings(impactResults, GOALS, 3);
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Insights", href: "/insights" },
    { label: "What works" },
  ]}
  backHref="/"
>
  <!-- Hero -->
  <section class="bg-gradient-to-b from-primary/5 to-white py-16 px-4 text-center">
    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
      What do you want to achieve in your city?
    </h1>
    <p class="text-lg text-gray-600 max-w-2xl mx-auto">
      Explore evidence from cities across Europe to discover which
      mobility measures are associated with progress on each goal.
    </p>
  </section>

  <!-- Goal cards -->
  <section class="py-12 px-4">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goalStats.map(goal => (
        <GoalCard
          slug={goal.slug}
          title={goal.title}
          description={goal.description}
          measureCount={goal.measureCount}
          cityCount={goal.cityCount}
          href={getUrl(`/insights/goals/${goal.slug}`)}
          client:load
        />
      ))}
    </div>
  </section>

  <!-- Top findings -->
  <section class="bg-gray-50 py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Top findings</h2>
      <TopFindings findings={topFindings} client:load />
    </div>
  </section>

  <!-- City map -->
  <section class="py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Cities with evidence</h2>
      <InsightsCityMap labs={livingLabs} client:load />
    </div>
  </section>

  <!-- Cross-link to Data experience -->
  <section class="py-8 px-4 text-center border-t border-gray-200">
    <p class="text-gray-600 mb-3">Want the full datasets and scientific tools?</p>
    <a href={getUrl("/data/kpis")} class="text-primary font-medium hover:underline">
      Switch to Data & scientific tools →
    </a>
  </section>
</Layout>
```

### 3b. Goal→KPI-group mapping: `src/lib/insights/goals.ts`

```typescript
export interface Goal {
  slug: string;
  title: string;
  description: string;
  kpiGroups: string[];  // KPI group identifiers from the existing data
  icon: string;
}

export const GOALS: Goal[] = [
  {
    slug: "reduce-car-use",
    title: "Reduce private car use",
    description: "Shift trips away from private cars toward shared and public modes.",
    kpiGroups: ["modal_split_private_car", "all_private_modes"],
    icon: "car-off",
  },
  {
    slug: "increase-public-transport",
    title: "Increase public transport use",
    description: "Grow ridership on public transport, including integration with new shared mobility.",
    kpiGroups: ["modal_split_public_transport", "pt_with_nsm"],
    icon: "bus",
  },
  {
    slug: "cut-emissions",
    title: "Cut emissions",
    description: "Reduce transport-related greenhouse gas emissions and air pollutants.",
    kpiGroups: ["environment"],
    icon: "leaf",
  },
  {
    slug: "improve-accessibility",
    title: "Improve accessibility",
    description: "Shorten travel times and improve access to destinations across the city.",
    kpiGroups: ["travel_time"],
    icon: "clock",
  },
  {
    slug: "improve-safety",
    title: "Improve safety & comfort",
    description: "Make journeys safer and more comfortable for all users.",
    kpiGroups: ["safety_comfort"],
    icon: "shield",
  },
  {
    slug: "reduce-cost",
    title: "Reduce travel cost",
    description: "Lower the cost of travel for residents and visitors.",
    kpiGroups: ["cost_of_travel"],
    icon: "wallet",
  },
];
```

The exact KPI group identifiers (`kpiGroups` values) must be confirmed against the existing impact-analysis data model during implementation. The slugs above are placeholders derived from the epic spec's goal→KPI-group mapping table.

### 3c. Helper functions for goal stats

```typescript
// In src/lib/insights/goalHelpers.ts

import type { Goal } from "./goals";

export function countMeasuresForGoal(
  goal: Goal,
  impactResults: ImpactResults,
  measures: Measure[]
): number {
  // Count unique measures that have a statistical association 
  // with any KPI group in this goal's mapping
  const associatedMeasureIds = new Set<number>();
  for (const group of goal.kpiGroups) {
    const groupResults = impactResults.byKpiGroup[group];
    if (groupResults) {
      for (const result of groupResults) {
        if (result.evidenceLevel >= MINIMUM_EVIDENCE_THRESHOLD) {
          associatedMeasureIds.add(result.measureId);
        }
      }
    }
  }
  return associatedMeasureIds.size;
}

export function countCitiesForGoal(
  goal: Goal,
  impactResults: ImpactResults,
  livingLabs: LivingLab[]
): number {
  // Count cities contributing evidence for this goal's KPI groups
  const cityIds = new Set<number>();
  for (const group of goal.kpiGroups) {
    const groupResults = impactResults.byKpiGroup[group];
    if (groupResults) {
      for (const result of groupResults) {
        result.contributingCityIds.forEach(id => cityIds.add(id));
      }
    }
  }
  return cityIds.size;
}

export function hasQualifyingEvidence(
  goal: Goal,
  impactResults: ImpactResults
): boolean {
  return goal.kpiGroups.some(group => {
    const groupResults = impactResults.byKpiGroup[group];
    return groupResults?.some(r => r.evidenceLevel >= MINIMUM_EVIDENCE_THRESHOLD);
  });
}

export function computeTopFindings(
  impactResults: ImpactResults,
  goals: Goal[],
  count: number
): Finding[] {
  // Collect all associations across all goals, sort by evidence strength,
  // take top N, format as plain-language sentences
  const allAssociations: Finding[] = [];
  
  for (const goal of goals) {
    for (const group of goal.kpiGroups) {
      const groupResults = impactResults.byKpiGroup[group];
      if (!groupResults) continue;
      for (const result of groupResults) {
        if (result.evidenceLevel >= MINIMUM_EVIDENCE_THRESHOLD) {
          allAssociations.push({
            measureName: result.measurePlainName,
            direction: result.coefficient > 0 ? "improvement" : "decline",
            kpiGroupName: result.kpiGroupPlainName,
            cityCount: result.contributingCityIds.length,
            evidenceLevel: result.evidenceLevel,
            evidenceLabel: result.evidenceBadgeLabel,
            goalSlug: goal.slug,
          });
        }
      }
    }
  }

  return allAssociations
    .sort((a, b) => b.evidenceLevel - a.evidenceLevel)
    .slice(0, count);
}
```

### 3d. GoalCard component: `src/components/react/Insights/GoalCard.tsx`

```typescript
interface GoalCardProps {
  slug: string;
  title: string;
  description: string;
  measureCount: number;
  cityCount: number;
  href: string;
}

export function GoalCard({ title, description, measureCount, cityCount, href }: GoalCardProps) {
  return (
    <a href={href} className="block rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="flex gap-4 text-sm text-gray-500">
        <span>{measureCount} measures</span>
        <span>{cityCount} cities</span>
      </div>
    </a>
  );
}
```

### 3e. TopFindings component: `src/components/react/Insights/TopFindings.tsx`

Each finding renders as a plain-language sentence with an evidence badge:

```typescript
interface Finding {
  measureName: string;
  direction: string;
  kpiGroupName: string;
  cityCount: number;
  evidenceLabel: string;
  goalSlug: string;
}

export function TopFindings({ findings }: { findings: Finding[] }) {
  return (
    <div className="space-y-4">
      {findings.map((f, i) => (
        <div key={i} className="bg-white rounded-lg p-5 border border-gray-200">
          <p className="text-gray-800">
            <strong>{f.measureName}</strong> is associated with{" "}
            <em>{f.direction}</em> in {f.kpiGroupName} across{" "}
            <strong>{f.cityCount} cities</strong>.
          </p>
          <span className="inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
            Evidence: {f.evidenceLabel}
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

## 4. T15 Architecture — Goal Pages

### 4a. New file: `src/pages/insights/goals/[goalSlug].astro`

A dynamic route page — one template producing six instances, one per goal.

```astro
---
import Layout from "../../../layouts/Layout.astro";
import { MeasureCard } from "../../../components/react/Insights/MeasureCard";
import { GOALS } from "../../../lib/insights/goals";
import { getMeasuresForGoal } from "../../../lib/insights/goalHelpers";
import ApiClient from "../../../lib/api-client/ApiClient";
import { getUrl } from "../../../lib/helpers";

const { goalSlug } = Astro.params;
const goal = GOALS.find(g => g.slug === goalSlug);

if (!goal) {
  return Astro.redirect("/insights/goals");
}

const api = new ApiClient(Astro.request);
const impactResults = await api.getImpactAnalysisResults();
const livingLabs = await api.getLivingLabs();
const measures = await api.getMeasures();

// Get measures ranked by evidence strength for this goal
const rankedMeasures = getMeasuresForGoal(goal, impactResults, measures, livingLabs);
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Insights", href: "/insights" },
    { label: "What works", href: "/insights/goals" },
    { label: goal.title },
  ]}
  backHref="/insights/goals"
>
  <!-- Goal header -->
  <section class="bg-gradient-to-b from-primary/5 to-white py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-3">{goal.title}</h1>
      <p class="text-lg text-gray-600">{goal.description}</p>
    </div>
  </section>

  <!-- Ranked measures -->
  <section class="py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-xl font-bold text-gray-900 mb-6">
        Measures associated with this goal
      </h2>
      <div class="space-y-4">
        {rankedMeasures.map((m, index) => (
          <MeasureCard
            rank={index + 1}
            measureName={m.plainName}
            description={m.description}
            cityCount={m.cityCount}
            cities={m.contributingCities}
            outcome={m.outcomeDescription}
            evidenceLabel={m.evidenceBadgeLabel}
            client:load
          />
        ))}
      </div>
    </div>
  </section>

  <!-- Cross-link to Data experience impact analysis -->
  <section class="py-8 px-4 text-center border-t border-gray-200">
    <p class="text-gray-600 mb-3">
      Explore the full statistical analysis for these KPI domains.
    </p>
    <a href={getUrl("/tools/impact_analysis")} class="text-primary font-medium hover:underline">
      Open in Data & scientific tools →
    </a>
  </section>
</Layout>
```

### 4b. `getMeasuresForGoal` helper

```typescript
// In src/lib/insights/goalHelpers.ts

export interface RankedMeasure {
  measureId: number;
  plainName: string;
  description: string;
  cityCount: number;
  contributingCities: { id: number; name: string; slug: string }[];
  outcomeDescription: string;
  evidenceLevel: number;
  evidenceBadgeLabel: string;
}

export function getMeasuresForGoal(
  goal: Goal,
  impactResults: ImpactResults,
  measures: Measure[],
  livingLabs: LivingLab[]
): RankedMeasure[] {
  const measureMap = new Map<number, RankedMeasure>();

  for (const group of goal.kpiGroups) {
    const groupResults = impactResults.byKpiGroup[group];
    if (!groupResults) continue;

    for (const result of groupResults) {
      if (result.evidenceLevel < MINIMUM_EVIDENCE_THRESHOLD) continue;

      const existing = measureMap.get(result.measureId);
      if (!existing || result.evidenceLevel > existing.evidenceLevel) {
        const cities = result.contributingCityIds.map(id => {
          const lab = livingLabs.find(l => l.id === id);
          return lab ? { id: lab.id, name: lab.name, slug: lab.slug } : null;
        }).filter(Boolean);

        measureMap.set(result.measureId, {
          measureId: result.measureId,
          plainName: result.measurePlainName,
          description: result.measureDescription ?? "",
          cityCount: cities.length,
          contributingCities: cities,
          outcomeDescription: formatOutcome(result),
          evidenceLevel: result.evidenceLevel,
          evidenceBadgeLabel: result.evidenceBadgeLabel,
        });
      }
    }
  }

  return Array.from(measureMap.values())
    .sort((a, b) => b.evidenceLevel - a.evidenceLevel);
}

function formatOutcome(result: AssociationResult): string {
  const direction = result.coefficient > 0 ? "improvement" : "decline";
  return `Associated with ${direction} in ${result.kpiGroupPlainName}`;
}
```

### 4c. MeasureCard component: `src/components/react/Insights/MeasureCard.tsx`

```typescript
interface MeasureCardProps {
  rank: number;
  measureName: string;
  description: string;
  cityCount: number;
  cities: { id: number; name: string; slug: string }[];
  outcome: string;
  evidenceLabel: string;
}

export function MeasureCard({
  rank, measureName, description, cityCount, cities, outcome, evidenceLabel
}: MeasureCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <span className="text-2xl font-bold text-gray-300">#{rank}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{measureName}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <p className="text-sm text-gray-700 mt-2">{outcome}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
              Evidence: {evidenceLabel}
            </span>
            <span className="text-xs text-gray-500">
              {cityCount} {cityCount === 1 ? "city" : "cities"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {cities.map(city => (
              <a
                key={city.id}
                href={`/insights/city/${city.slug}`}
                className="text-xs text-primary hover:underline"
              >
                {city.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. File Change Summary

| File | Status | Task | What changes |
|---|---|---|---|
| `src/pages/insights/goals/index.astro` | **New** | T13 | Insights homepage with goal cards, top findings, city map |
| `src/pages/insights/goals/[goalSlug].astro` | **New** | T15 | Goal page template — one per goal |
| `src/lib/insights/goals.ts` | **New** | T13 | Goal→KPI-group mapping definition |
| `src/lib/insights/goalHelpers.ts` | **New** | T13+T15 | Helper functions for goal stats, measure ranking, top findings |
| `src/components/react/Insights/GoalCard.tsx` | **New** | T13 | Goal card React component |
| `src/components/react/Insights/TopFindings.tsx` | **New** | T13 | Top findings React component |
| `src/components/react/Insights/InsightsCityMap.tsx` | **New** | T13 | City map filtered to cities with evidence |
| `src/components/react/Insights/MeasureCard.tsx` | **New** | T15 | Measure card React component |
| `src/components/react/Insights/index.ts` | **New** | T13 | Barrel export for Insights components |
| `src/lib/experiences/registry.ts` | **Modify** | T13 | Add `/insights/goals` route entry as `"insights"` |
| `src/lib/experiences/registry.test.ts` | **Modify** | T13 | Add test for `/insights/goals` route resolution |

Total: **9 new files**, **2 modified files**. One PR covering both T13 and T15.

---

## 6. Implementation Order

### T13 — Insights homepage (implement first)

1. **Create `src/lib/insights/goals.ts`** with the `GOALS` array defining the six goals and their KPI-group mappings
2. **Create `src/lib/insights/goalHelpers.ts`** with `countMeasuresForGoal`, `countCitiesForGoal`, `hasQualifyingEvidence`, and `computeTopFindings`
3. **Create React components** — `GoalCard`, `TopFindings`, `InsightsCityMap` under `src/components/react/Insights/`
4. **Create `src/pages/insights/goals/index.astro`** — the Insights homepage
5. **Register route** — add `/insights/goals` to the experience registry as `"insights"`
6. **Add tests** for goal helpers and registry route resolution
7. **Verify** — navigate to `/insights/goals`, confirm goal cards render with live data, top findings display, map shows cities, cross-link works

**Verification checkpoint:** Goal cards display with live measure/city counts. No card renders for a goal with no evidence. Top findings show three sentences with evidence badges. Map shows cities with evidence.

### T15 — Goal pages (implement second, needs T13)

1. **Create `getMeasuresForGoal`** in `goalHelpers.ts` — ranked measure list per goal
2. **Create `MeasureCard` component** under `src/components/react/Insights/`
3. **Create `src/pages/insights/goals/[goalSlug].astro`** — dynamic goal page
4. **Verify** — navigate from each goal card to its page, confirm measures are ranked by evidence, every measure has a plain-language name, cross-link to Data experience works
5. **Add tests** for `getMeasuresForGoal`

---

## 7. Testing Strategy

### Manual verification (per PR checklist in epic.md)

| Check | How |
|---|---|
| Every goal card links to its page with live counts | Click each card, verify measure/city counts are non-zero |
| No goal card for a goal with no evidence | Verify against the coverage matrix |
| Top findings carry strength badges and city counts | Read each finding sentence |
| No implementation-record indicator | Search page for T02 indicator terms |
| No single-estimation series | Search for single-point data |
| No untranslated technical term | Read all visible text for PROMETHEE/regression jargon |
| Rankings derive from existing output | Compare goal page rankings with impact analysis rankings |
| Every measure uses a plain-language name | Cross-check against T04 vocabulary |
| Counterpart link opens Data experience | Click cross-link, verify experience switch |

### Unit tests

```typescript
// src/lib/insights/goalHelpers.test.ts
describe("countMeasuresForGoal", () => {
  it("counts unique measures across KPI groups", () => { ... });
  it("excludes measures below evidence threshold", () => { ... });
});

describe("computeTopFindings", () => {
  it("returns top N findings sorted by evidence strength", () => { ... });
  it("excludes findings below threshold", () => { ... });
  it("formats finding sentences correctly", () => { ... });
});

describe("getMeasuresForGoal", () => {
  it("ranks measures by evidence strength descending", () => { ... });
  it("deduplicates measures appearing in multiple KPI groups", () => { ... });
  it("includes contributing city links", () => { ... });
});
```

```typescript
// Add to src/lib/experiences/registry.test.ts
it("resolves /insights/goals to insights experience", () => {
  const state = resolveExperience("/insights/goals", new URLSearchParams());
  expect(state.active).toBe("insights");
});

it("resolves /insights/goals/reduce-car-use to insights experience", () => {
  const state = resolveExperience("/insights/goals/reduce-car-use", new URLSearchParams());
  expect(state.active).toBe("insights");
});
```

---

## 8. Open Questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| OQ-1 | What are the exact KPI group identifiers in the impact-analysis data model? The `kpiGroups` values in `goals.ts` must match exactly. | WP5/Dev | T13 data fetching |
| OQ-2 | What is the minimum evidence-strength threshold for Insights? The spec says "none below the T05 threshold" — confirm exact level. | WP5/T5.2 | T13 filtering |
| OQ-3 | Should the city map on the Insights homepage reuse `LivingLabsMapSection` (existing) or a filtered version showing only cities with evidence? | Product/UX | T13 map section |
| OQ-4 | Should goal page city links go to `/insights/city/[labId]` (Epic 9, not yet built) or to the existing Data city page? | Product | T15 city links |
| OQ-5 | Should the InsightsCityMap component filter by T06 classification (has before/after data) or by evidence availability per goal? | Product | T13 map rendering |

---

## 9. Out of Scope

- **New data models or tables** — All data comes from existing impact-analysis output (rule G5)
- **Recomputation of rankings** — Rankings derive from existing coefficients
- **Implementation-record indicators** — Excluded by T02 rules
- **Single-estimation series** — Excluded by T03 rules
- **MCDA results** — MCDA is a separate tool; goal pages use impact-analysis output only
- **Insights city profile pages** — Created in Epic 9
- **The Insights menu itself** — Created in Epic 6/T12; this epic creates content for it

---

## 10. Downstream Impact

| Epic | How it interacts |
|---|---|
| 9 (Insights Cities) | Goal page city links point to the Insights city profiles once created |
| 10 (Guided Tool) | "Plan for my city" may cross-link from goal pages |
| 11 (Data Console) | Coverage matrix (T19) uses the same KPI-group identifiers |
| 12 (Methods) | Goal pages may link to the models page for methodology context |
