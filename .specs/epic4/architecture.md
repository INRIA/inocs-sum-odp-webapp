# Architecture: Epic 4 — Evidence Qualification & KPI Enrichment

**Tasks:** T05 (M), T07 (M), T08 (S) — can run in parallel within epic
**Wave:** A | **Effort:** 2xM + S | **Stack:** Astro 5 SSR + React 19 islands
**Dependencies:** After Epic 3 (T04 vocabulary) — `src/lib/labels.ts` and `displayCategoryName()` exist

---

## 1. Summary

Epic 4 enriches existing data displays with qualifying metadata that makes the platform's claims honest and specific. Three independent tasks touch different component areas:

**T05 — Evidence-strength badge & "association, not cause" wording.** Every model-derived figure in the impact analysis carries a badge expressing the strength of the underlying evidence (based on a normalized ratio of cities x KPI observations), plus a city count qualifier. The words "impact" and "contribution" are replaced with "statistical association" for regression outputs.

**T07 — Plain-language reading, period & freshness on every KPI.** Each KPI card gains a one-line human-authored reading ("higher means more trips shifted away from private car"), unit, reporting period, city, and "last updated" date. Direction of "good" is stated where one exists. The 28 readings are content-gated: dev builds the rendering shell, then requests content from WP1.

**T08 — Curated default domain set.** The impact analysis page opens on a curated subset of domains relevant to NSM uptake. Remaining domains are available behind a "Show all domains" control. The curated list is defined once in config and reused by Epic 8 (Insights goal pages).

---

## 2. Design Decisions with Rationale

### 2.1 Evidence-strength badge uses a normalized ratio, not absolute counts

With only 9 SUM Living Labs doing very different activities, an absolute threshold ("5+ cities") is misleading. The badge uses a **normalized ratio**:

```
strength = (cities_with_data_for_this_figure × kpi_observations) / (total_living_labs × total_measures_in_group)
```

This yields a 0–1 score. Three badge levels are defined by threshold:

| Level | Normalized ratio | Badge label | Colour |
|-------|-----------------|-------------|--------|
| Low | < 0.2 | Limited evidence | `text-warning` / amber |
| Moderate | 0.2 – 0.5 | Moderate evidence | `text-info` / blue |
| Strong | > 0.5 | Strong evidence | `text-secondary` / green |

**Rationale:** The thresholds are relative to the total possible data, so they remain meaningful as the platform grows. The three levels were the minimum required by the epic spec. Thresholds are defined in a single config constant for later tuning by WP5/T5.2.

### 2.2 Badge and city count derive from `IGroupAnalysisResult`, not re-computed

The impact analysis backend already returns `living_labs_analysis` (array of labs with data) and `measure_coefficients` (array of measures with `times_implemented` counts). The badge inputs are already present in the SSR-serialized `jobRunOutput`:

- **Cities with data for a figure** = `analysisResult.living_labs_analysis.length`
- **KPI observations** = sum of KPI results across those labs (derivable from `IKpiVariationData.livingLabVariations`)
- **Total living labs** = `livingLabsMap.size` (already fetched in `impact_analysis.astro`)
- **Total measures in group** = `analysisResult.measure_coefficients.length`

No new API calls needed. The utility function runs client-side in the React island.

### 2.3 "Statistical association" wording is a search-and-replace, not a label map

Unlike Epic 3's category renames (which needed a function because names come from the API), the "impact" and "contribution" strings in the analysis components are hardcoded inline text. A simple in-place replacement is cleaner than routing them through a label system. The key strings to replace:

- "contributed to" → "associated with"
- "contribution" → "statistical association"
- "impact" (when describing regression output) → "association"
- "level of contribution" → "strength of association"
- "Measures Impact" tab label already changed to "Linked measures" by Epic 3

### 2.4 KPI reading catalogue is a static data file, not database-backed

T07 requires 28 human-authored plain-language readings (one per KPI definition). These are not auto-generated. The readings are stored in a JSON catalogue (`src/config/kpiReadings.json`) keyed by KPI definition ID. This is a static file because:

- The content is authored by WP1, not computed
- It changes at the pace of KPI definition changes (rare)
- It avoids a database migration for presentation-only data
- The dev builds the rendering shell with placeholder readings, then WP1 fills them in

### 2.5 "Last updated" comes from `IKpiResult.updated_at`, not a new field

Each KPI card already receives result data via `IKpiResultGroup.results[]`. The most recent `updated_at` across a group's results is the "last updated" date. No new API field needed.

### 2.6 Curated domain set is a config constant, shared with Epic 8

The curated list of domain IDs (KPI group IDs relevant to NSM uptake) is defined once in `src/config/curatedDomains.ts`. The impact analysis `AnalysisConditionsFilter` reads it to set a default filter. Epic 8 (Insights goal pages, T13/T15) will import the same constant to determine which domains appear in the goal-led entry.

### 2.7 KPI reading fields extend `IKpi`, not `IKpiResult`

The plain-language reading, direction of "good", and "not applicable" flag are properties of a KPI *definition*, not a result. They go on a new type `IKpiReading` that decorates the existing `IKpi` at render time. The catalogue lookup happens once when the component mounts, not per result.

---

## 3. T05 Architecture — Evidence-Strength Badge

### 3a. New file: `src/config/evidenceStrength.ts`

```typescript
/**
 * Evidence-strength badge configuration.
 *
 * Thresholds define the minimum normalized ratio for each badge level.
 * The ratio is: (labs_with_data × kpi_observations) / (total_labs × total_measures).
 *
 * Thresholds to be confirmed by WP5/T5.2 — current values are initial estimates.
 */

export type EvidenceLevel = "low" | "moderate" | "strong";

export interface EvidenceBadgeConfig {
  level: EvidenceLevel;
  label: string;
  /** Tailwind text colour class */
  colorClass: string;
  /** Tailwind background colour class for pill */
  bgClass: string;
}

export const EVIDENCE_THRESHOLDS: { min: number; config: EvidenceBadgeConfig }[] = [
  {
    min: 0.5,
    config: {
      level: "strong",
      label: "Strong evidence",
      colorClass: "text-secondary",
      bgClass: "bg-secondary/10",
    },
  },
  {
    min: 0.2,
    config: {
      level: "moderate",
      label: "Moderate evidence",
      colorClass: "text-info",
      bgClass: "bg-info/10",
    },
  },
  {
    min: 0,
    config: {
      level: "low",
      label: "Limited evidence",
      colorClass: "text-warning",
      bgClass: "bg-warning/10",
    },
  },
];

/**
 * Returns the evidence badge config for a given normalized strength ratio.
 */
export function getEvidenceBadge(normalizedRatio: number): EvidenceBadgeConfig {
  for (const threshold of EVIDENCE_THRESHOLDS) {
    if (normalizedRatio >= threshold.min) {
      return threshold.config;
    }
  }
  // Fallback — should not happen since min 0 is in the list
  return EVIDENCE_THRESHOLDS[EVIDENCE_THRESHOLDS.length - 1].config;
}

/**
 * Computes the normalized evidence-strength ratio for a group analysis result.
 *
 * ratio = (labsWithData × kpiObservations) / (totalLabs × totalMeasures)
 *
 * @param labsWithData   - Number of labs that contributed data for this figure
 * @param kpiObservations - Total KPI observation count across those labs
 * @param totalLabs       - Total labs on the platform (from livingLabsMap.size)
 * @param totalMeasures   - Total measures in the analysis group
 */
export function computeEvidenceRatio(
  labsWithData: number,
  kpiObservations: number,
  totalLabs: number,
  totalMeasures: number,
): number {
  const denominator = totalLabs * totalMeasures;
  if (denominator === 0) return 0;
  return (labsWithData * kpiObservations) / denominator;
}
```

### 3b. New component: `src/components/react/ImpactAnalysis/EvidenceBadge.tsx`

```typescript
import type { EvidenceBadgeConfig } from "../../../config/evidenceStrength";

interface EvidenceBadgeProps {
  badge: EvidenceBadgeConfig;
  cityCount: number;
}

export function EvidenceBadge({ badge, cityCount }: EvidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bgClass} ${badge.colorClass}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-current" />
      {badge.label}
      <span className="text-gray-500 font-normal">
        ({cityCount} {cityCount === 1 ? "city" : "cities"})
      </span>
    </span>
  );
}
```

Renders as a compact pill: `[*] Moderate evidence (5 cities)`

### 3c. SSR change: pass `totalLabs` to `ImpactAnalysisDashboard`

File: `src/pages/tools/impact_analysis.astro`

The dashboard needs the total number of labs to compute the normalized ratio. This is already available as `livingLabsMap.size`.

```astro
<!-- BEFORE -->
<ImpactAnalysisDashboard
  kpiGroups={kpiGroups}
  jobRunOutput={jobRunOutput}
  kpiVariationsData={kpiVariationsData}
  variationsByKpis={variationsByKpis}
  client:load
/>

<!-- AFTER -->
<ImpactAnalysisDashboard
  kpiGroups={kpiGroups}
  jobRunOutput={jobRunOutput}
  kpiVariationsData={kpiVariationsData}
  variationsByKpis={variationsByKpis}
  totalPlatformLabs={livingLabsMap.size}
  client:load
/>
```

### 3d. `ImpactAnalysisDashboard` prop addition

File: `src/components/react/ImpactAnalysis/ImpactAnalysisDashboard.tsx`

```typescript
interface ImpactAnalysisDashboardProps {
  kpiGroups: IKpiGroup[];
  jobRunOutput: IJobRunOutputData | null;
  kpiVariationsData: Record<number, IKpiVariationData>;
  variationsByKpis: Record<number, IKpiVariationData>;
  totalPlatformLabs: number;  // NEW
}
```

Thread `totalPlatformLabs` down to `MeasuresImpact`:

```typescript
<MeasuresImpact
  selectedGroup={selectedGroup}
  analysisResult={analysisResult}
  kpiCount={selectedVariationsData?.allKpiVariations.length || 0}
  totalPlatformLabs={totalPlatformLabs}  // NEW
  variationsData={selectedVariationsData}  // NEW — needed for kpiObservations count
/>
```

### 3e. `MeasuresImpact` changes

File: `src/components/react/ImpactAnalysis/MeasuresImpact.tsx`

1. **Add props:** `totalPlatformLabs: number` and `variationsData: IKpiVariationData | null`

2. **Compute badge** using the analysis result data:

```typescript
import { computeEvidenceRatio, getEvidenceBadge } from "../../../config/evidenceStrength";
import { EvidenceBadge } from "./EvidenceBadge";

// Inside the component, after confirming analysisResult exists:
const labsWithData = analysisResult.living_labs_analysis.length;
const kpiObservations = variationsData
  ? variationsData.livingLabVariations.reduce(
      (sum, lab) => sum + lab.kpis.length, 0
    )
  : 0;
const totalMeasures = measures.length;
const evidenceRatio = computeEvidenceRatio(
  labsWithData, kpiObservations, totalPlatformLabs, totalMeasures,
);
const evidenceBadgeConfig = getEvidenceBadge(evidenceRatio);
```

3. **Render badge** alongside the stat cards:

```typescript
{/* Evidence badge — below the stat cards */}
<div className="mt-4 flex justify-center">
  <EvidenceBadge badge={evidenceBadgeConfig} cityCount={labsWithData} />
</div>
```

4. **Replace wording** in rendered text (in-place string changes):

| Current text | New text |
|---|---|
| "Policy Measures estimated to have contributed to **KPIs improvements**" | "Policy Measures statistically associated with **KPI improvements**" |
| "Policy Measures estimated to have contributed to **KPI decline or had adverse effects**" | "Policy Measures statistically associated with **KPI decline**" |
| "Total Living Labs Compared" | "Cities with data" |
| "level of contribution to KPIs improvement" | "strength of association with KPI improvement" |
| "level of contribution to KPIs decline" | "strength of association with KPI decline" |
| "Measures estimated to have contributed to KPI improvements" | "Measures statistically associated with KPI improvements" |
| "Measures estimated to have contributed negatively or had adverse effects" | "Measures statistically associated with KPI decline" |
| "Coefficients represent the estimated contribution of each measure to KPI changes" | "Coefficients represent the estimated statistical association of each measure with KPI changes" |
| "Positive levels indicate the policy measures that most likely contributed to the improvement..." | "Positive values indicate measures most strongly associated with improvement..." |
| "Level of contribution from external conditions..." | "Association strength from external conditions..." |

### 3f. `MeasureImpactCard` changes

File: `src/components/react/ImpactAnalysis/MeasureImpactCard.tsx`

Add optional `badge` and `cityCount` props. When provided, render the `EvidenceBadge` inside the card:

```typescript
interface MeasureImpactCardProps {
  measure: IMeasureCoefficient;
  rank: number;
  size?: "large" | "small";
  badge?: EvidenceBadgeConfig;  // NEW — optional, from parent
  cityCount?: number;           // NEW
}
```

The badge renders below the coefficient value. The `times_implemented` field on `IMeasureCoefficient` provides a per-measure city count:

```typescript
<small className="text-sm text-dark">
  strength of association with KPI {isPositive ? "improvement" : "decline"}
</small>
{measure.times_implemented > 0 && (
  <small className="text-xs text-gray-400">
    Implemented in {measure.times_implemented} {measure.times_implemented === 1 ? "city" : "cities"}
  </small>
)}
```

### 3g. `KpiGroupVariationDataTable` and `KpiVariations` changes

The KPI variations views also show model-derived figures. Each needs:

1. The group-level `EvidenceBadge` rendered in the header
2. Wording changes: "contributed" → "associated", "impact" → "association"

`KpiVariations` receives the badge from `ImpactAnalysisDashboard` via new props and renders it in the `AnalysisSectionDivider` area.

`KpiGroupVariationDataTable` receives the badge as a prop and renders it next to the group name header.

### 3h. Page-bottom disclaimer preservation

The existing `PageNavigation` component in `ImpactAnalysisDashboard` already renders a disclaimer:

```typescript
disclaimer="The impact levels reported by this assessment tool are algorithmic estimates..."
```

Update the text to align with "association" language:

```typescript
disclaimer="The associations reported by this assessment tool are algorithmic estimates derived from implemented measures and observed KPI changes. They indicate statistical associations, not proven causal relationships. Results may not exactly reflect real-world outcomes."
```

---

## 4. T07 Architecture — KPI Reading, Period & Freshness

### 4a. New file: `src/config/kpiReadings.json`

A JSON catalogue keyed by KPI definition ID. The dev creates the file with placeholder entries for all 28 KPIs; WP1 fills in the actual readings.

```json
{
  "1": {
    "reading": "PLACEHOLDER — awaiting WP1 content",
    "direction": "up_is_good",
    "unit": "%"
  },
  "2": {
    "reading": "PLACEHOLDER — awaiting WP1 content",
    "direction": "down_is_good",
    "unit": "ratio"
  },
  "3": {
    "reading": "PLACEHOLDER — awaiting WP1 content",
    "direction": "not_applicable",
    "unit": "score"
  }
}
```

### 4b. New file: `src/config/kpiReadings.ts`

```typescript
import readingsData from "./kpiReadings.json";

export type KpiDirection = "up_is_good" | "down_is_good" | "not_applicable";

export interface IKpiReading {
  /** One-line plain-language reading, e.g. "higher means more trips shifted away from private car" */
  reading: string;
  /** Whether an increase is good, bad, or not applicable */
  direction: KpiDirection;
  /** Display unit, e.g. "%", "trips/day", "score 1-5" */
  unit: string;
}

const readings = readingsData as Record<string, IKpiReading>;

/**
 * Looks up the human-authored reading for a KPI definition.
 * Returns null if no reading is catalogued (should not happen for the 28 KPIs).
 */
export function getKpiReading(kpiDefinitionId: number): IKpiReading | null {
  return readings[String(kpiDefinitionId)] ?? null;
}

/**
 * Returns a human-readable direction label.
 */
export function formatDirection(direction: KpiDirection): string {
  switch (direction) {
    case "up_is_good": return "Higher is better";
    case "down_is_good": return "Lower is better";
    case "not_applicable": return "No inherent direction";
  }
}

/**
 * Returns true if any reading in the catalogue is still a placeholder.
 * Use in development to flag incomplete content.
 */
export function hasPlaceholderReadings(): boolean {
  return Object.values(readings).some(
    (r) => r.reading.startsWith("PLACEHOLDER"),
  );
}
```

### 4c. KPI card enrichment — `KpiCard` changes

File: `src/components/react/KpiCards/KpiCard.tsx`

Below the existing `title` JSX block, add a reading/metadata block:

```typescript
import { getKpiReading, formatDirection } from "../../../config/kpiReadings";

// Inside KpiCard, after the title:
const kpiReading = getKpiReading(kpi.id);

const readingBlock = kpiReading ? (
  <div className="text-xs text-gray-500 text-center space-y-0.5 mb-2">
    <p className="italic">{kpiReading.reading}</p>
    <p>
      Unit: <span className="font-medium">{kpiReading.unit}</span>
      {" | "}
      {formatDirection(kpiReading.direction)}
    </p>
  </div>
) : null;
```

This renders between the title and the chart/baseline value.

### 4d. Freshness and period on KPI cards

The `IKpiResultGroup` already contains `results: IKpiResult[]` where each result has `date` and `updated_at`.

Add a metadata footer inside `KpiCard` (both chart and baseline modes):

```typescript
// Derive freshness from results
const latestResult = kpiResults
  ? [...kpiResults.results].sort(
      (a, b) => Date.parse(b.date) - Date.parse(a.date)
    )[0]
  : null;

const metadataFooter = latestResult ? (
  <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-1 px-1">
    <span>Period: {formatMonthYear(kpiResults.results[0]?.date)} – {formatMonthYear(latestResult.date)}</span>
    {latestResult.updated_at && (
      <span>Last updated: {formatMonthYear(latestResult.updated_at as unknown as string)}</span>
    )}
  </div>
) : null;
```

This renders below the chart/baseline and above the CSV download button.

### 4e. `KpiMultiple` changes

File: `src/components/react/KpiCards/KpiMultiple.tsx`

Same pattern: look up reading for the parent KPI, render reading block and metadata footer. For child KPIs in multi-mode, the reading is per child (each child KPI has its own ID in the catalogue).

### 4f. Dashboard-level KPI cards (`KpiLivingLabsSingleCard`, `KpiLivingLabsMultipleCard`)

These multi-lab cards in `/data/kpis` also need reading and freshness. The reading lookup uses the KPI's definition ID which is already available. The freshness derives from the `ILabKpiTimeline` data points (or `ILabPartition.baselineLabs[].result`).

Add the same reading block and metadata footer pattern. The city name is implicit (multi-lab view), so only period and freshness are shown.

### 4g. Impact on existing components — no structural change

The reading block and metadata footer are additive. No existing prop signatures change. The `getKpiReading()` call is a pure lookup with no side effects. Components that don't receive a KPI ID (e.g., bare charts) are unaffected.

---

## 5. T08 Architecture — Curated Default Domain Set

### 5a. New file: `src/config/curatedDomains.ts`

```typescript
/**
 * Curated set of KPI group IDs relevant to NSM (New Shared Mobility) uptake.
 *
 * These domains open by default on the impact analysis page.
 * All other domains remain accessible via "Show all domains".
 *
 * This list is consumed by:
 * - /tools/impact_analysis (T08 — default filter)
 * - Insights goal pages (T13/T15 in Epic 8 — goal-to-domain mapping)
 *
 * !! TO BE CONFIRMED by WP1 + WP5 jointly !!
 * Replace placeholder IDs with the confirmed values.
 */
export const CURATED_DOMAIN_IDS: Set<number> = new Set([
  // TODO: replace with confirmed KPI group IDs
  // Candidates based on NSM relevance:
  // - Environment
  // - Travel time
  // - Safety & comfort
  // - Modal split groups that include NSM
  -1,  // placeholder — causes empty set until confirmed
]);

export function isCuratedDomain(groupId: number): boolean {
  return CURATED_DOMAIN_IDS.has(groupId);
}
```

### 5b. `AnalysisConditionsFilter` changes

File: `src/components/react/ImpactAnalysis/AnalysisConditionsFilter.tsx`

Add state for whether the filter shows all domains or just curated ones:

```typescript
import { isCuratedDomain, CURATED_DOMAIN_IDS } from "../../../config/curatedDomains";

interface AnalysisConditionsFilterProps {
  kpiGroups: IKpiGroup[];
  selectedGroupId?: number;
  onGroupSelect: (groupId: number) => void;
  kpiVariationsData?: Record<number, IKpiVariationData>;
  variationsByKpis?: Record<number, IKpiVariationData>;
}

export const AnalysisConditionsFilter: React.FC<AnalysisConditionsFilterProps> = ({
  kpiGroups, selectedGroupId, onGroupSelect, kpiVariationsData, variationsByKpis,
}) => {
  const [showAll, setShowAll] = useState(false);

  const hasCuratedSet = CURATED_DOMAIN_IDS.size > 0 &&
    kpiGroups.some((g) => isCuratedDomain(g.id));

  const visibleGroups = hasCuratedSet && !showAll
    ? kpiGroups.filter((g) => isCuratedDomain(g.id))
    : kpiGroups;

  const hiddenCount = kpiGroups.length - visibleGroups.length;

  return (
    <div>
      <AnalysisSectionDivider ... />

      <div className="mt-6 flex flex-col items-center gap-2 lg:gap-4 content-center">
        <CardFilter
          groups={visibleGroups.map((group) => ({
            id: group.id,
            name: group.name,
            kpis: group.kpis ?? [],
          }))}
          selectedGroupId={selectedGroupId}
          onGroupSelect={onGroupSelect}
          variant="detailed"
          kpiVariationsData={kpiVariationsData}
          variationsByKpis={variationsByKpis}
        />

        {/* Show all / Show curated toggle */}
        {hasCuratedSet && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-primary hover:underline mt-2"
          >
            {showAll
              ? "Show recommended domains"
              : `Show all domains (${hiddenCount} more)`}
          </button>
        )}
      </div>
    </div>
  );
};
```

**Behaviour:**
- Default: only curated domains shown
- "Show all domains (N more)" link reveals the rest
- Once a non-curated domain is selected, it stays visible
- If `CURATED_DOMAIN_IDS` contains only the placeholder (-1), `hasCuratedSet` is false and all domains show (graceful degradation until WP1 confirms the list)

---

## 6. Full File Change List

| File | Status | Task | What changes |
|------|--------|------|--------------|
| `src/config/evidenceStrength.ts` | **new** | T05 | Badge config, thresholds, `getEvidenceBadge()`, `computeEvidenceRatio()` |
| `src/components/react/ImpactAnalysis/EvidenceBadge.tsx` | **new** | T05 | Badge pill component |
| `src/config/kpiReadings.json` | **new** | T07 | Static catalogue of 28 KPI readings (placeholder content) |
| `src/config/kpiReadings.ts` | **new** | T07 | `IKpiReading` type, `getKpiReading()`, `formatDirection()` |
| `src/config/curatedDomains.ts` | **new** | T08 | `CURATED_DOMAIN_IDS`, `isCuratedDomain()` |
| `src/pages/tools/impact_analysis.astro` | **modify** | T05 | Add `totalPlatformLabs` prop to `ImpactAnalysisDashboard` |
| `src/components/react/ImpactAnalysis/ImpactAnalysisDashboard.tsx` | **modify** | T05 | Accept `totalPlatformLabs`; thread to `MeasuresImpact` and `KpiVariations`; update disclaimer wording |
| `src/components/react/ImpactAnalysis/MeasuresImpact.tsx` | **modify** | T05 | Compute evidence ratio; render `EvidenceBadge`; replace "contribution"/"impact" wording |
| `src/components/react/ImpactAnalysis/MeasureImpactCard.tsx` | **modify** | T05 | Add `times_implemented` city count display; replace "contribution" wording |
| `src/components/react/ImpactAnalysis/KpiVariations.tsx` | **modify** | T05 | Accept and render evidence badge prop |
| `src/components/react/ImpactAnalysis/KpiGroupVariationDataTable.tsx` | **modify** | T05 | Accept and render evidence badge; replace "contributed" wording |
| `src/components/react/ImpactAnalysis/KpiVariationCard.tsx` | **modify** | T05 | Replace any "impact"/"contribution" wording in rendered text |
| `src/components/react/ImpactAnalysis/AnalysisConditionsFilter.tsx` | **modify** | T08 | Add curated/all toggle state; filter `kpiGroups` by curated set |
| `src/components/react/KpiCards/KpiCard.tsx` | **modify** | T07 | Add reading block (from `getKpiReading`); add metadata footer (period, freshness) |
| `src/components/react/KpiCards/KpiMultiple.tsx` | **modify** | T07 | Same reading + metadata pattern for parent and child KPIs |
| `src/components/react/KpiCards/KpiBaselineValue.tsx` | **modify** | T07 | Add reading block and metadata for baseline-only display |
| `src/components/react/KPIsDashboard/KpiLivingLabsSingleCard.tsx` | **modify** | T07 | Add reading block and freshness metadata |
| `src/components/react/KPIsDashboard/KpiLivingLabsMultipleCard.tsx` | **modify** | T07 | Add reading block for parent KPI |

---

## 7. Implementation Order

All three tasks can run in parallel. Within each task, steps are sequential.

### T05 — Evidence-strength badge (implement first if sequencing needed)

1. **Create `src/config/evidenceStrength.ts`** — self-contained, no local dependencies
2. **Create `src/components/react/ImpactAnalysis/EvidenceBadge.tsx`** — depends on step 1
3. **Modify `impact_analysis.astro`** — add `totalPlatformLabs` prop
4. **Modify `ImpactAnalysisDashboard`** — accept prop, thread to children
5. **Modify `MeasuresImpact`** — compute ratio, render badge, replace wording
6. **Modify `MeasureImpactCard`** — add city count, replace wording
7. **Modify `KpiVariations` + `KpiGroupVariationDataTable`** — accept badge, replace wording
8. **Update disclaimer** in `ImpactAnalysisDashboard`
9. **Manual smoke-test** on `/tools/impact_analysis` — confirm badges appear on every coefficient/variation view, wording is consistent

### T07 — KPI reading & freshness

1. **Create `src/config/kpiReadings.json`** with placeholder entries for all 28 KPIs. Get actual KPI definition IDs from the database or from `src/lib/api-client/mock-data/kpis.json`
2. **Create `src/config/kpiReadings.ts`** — type + lookup function
3. **Modify `KpiCard`** — add reading block + metadata footer
4. **Modify `KpiBaselineValue`** — same pattern
5. **Modify `KpiMultiple`** — same pattern for parent + children
6. **Modify `KpiLivingLabsSingleCard`** — add reading + freshness
7. **Modify `KpiLivingLabsMultipleCard`** — add reading for parent KPI
8. **Request 28 readings from WP1** — provide the JSON file template and key format
9. **Manual smoke-test** — verify placeholder readings appear on every KPI card on `/data/kpis` and city pages

### T08 — Curated default domain set

1. **Create `src/config/curatedDomains.ts`** with placeholder IDs
2. **Modify `AnalysisConditionsFilter`** — add toggle state, filter logic
3. **Request curated domain list from WP1 + WP5** — populate `CURATED_DOMAIN_IDS`
4. **Manual smoke-test** — verify default shows curated set, "Show all" reveals the rest, count is correct

---

## 8. Open Questions

| # | Question | Owner | Blocks |
|---|----------|-------|--------|
| OQ-1 | Confirm the normalized ratio thresholds for the three evidence badge levels (currently 0.2 / 0.5). Are two thresholds enough, or does WP5/T5.2 want a fourth level? | WP5 / T5.2 | T05 threshold constants in `evidenceStrength.ts` |
| OQ-2 | Should the evidence badge also appear on the D3 horizontal bar chart tooltip (per measure), or only at the group level? | UX / product | T05 `D3HorizontalBarChart.tsx` — currently not planned for individual bar tooltips |
| OQ-3 | The 28 KPI plain-language readings: who in WP1 authors them, and what is the delivery format? JSON file vs spreadsheet? | WP1 | T07 `kpiReadings.json` content |
| OQ-4 | Which KPI group IDs form the curated domain set for NSM uptake? | WP1 + WP5 | T08 `curatedDomains.ts` — placeholder IDs until confirmed |
| OQ-5 | Should the curated domain set exclude domains where no analysis result exists (group has no data), or show them greyed out? | UX / product | T08 `AnalysisConditionsFilter` — currently filters them out entirely |
| OQ-6 | For the `MeasureImpactCard`, should the per-measure city count (`times_implemented`) be rendered as a mini evidence badge, or just as text? | UX / product | T05 `MeasureImpactCard` rendering |

---

## 9. Out of Scope

The following are explicitly excluded from this epic:

- **Model changes.** The regression model and its parameters are unchanged. T05 qualifies the output; it does not alter the computation.
- **Auto-generated readings.** T07 readings are human-authored. The dev builds the shell; WP1 fills the content. No LLM or template-based generation.
- **KPI definition schema changes.** The readings catalogue is a static file, not a database field. No migrations.
- **Insights experience pages.** Epic 8 (T13/T15) will consume `CURATED_DOMAIN_IDS` and the evidence badge config. The consumption code belongs to Epic 8, not here.
- **Rebuilding the impact analysis page layout.** The page structure stays the same. Only content, badges, and wording change.
- **Removing existing disclaimers.** The page-bottom disclaimer is updated, not removed. The badge supplements it.

---

## 10. Downstream Dependencies

| Consumer | What it uses | When |
|---|---|---|
| Epic 8 / T13 (Insights goal pages) | `CURATED_DOMAIN_IDS` from `curatedDomains.ts` | Phase 4 |
| Epic 8 / T15 (Goal pages) | `getEvidenceBadge()` + `EvidenceBadge` component for findings | Phase 4 |
| Epic 12 / T21 (Methods & quality) | Badge thresholds documented on the Methods page | Phase 3–4 |
| Epic 9 / T14 (Insights city profile) | `getKpiReading()` for curated KPI cards | Phase 4 |
