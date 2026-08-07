# Architecture: Epic 2 — KPI Data Integrity & Separation

**Tasks:** T03 (data-sufficiency display rule) → T02 (implementation record split)
**Wave:** A | **Effort:** 2 × M | **Stack:** Astro 5 SSR + React 19 islands

---

## 1. Summary

Epic 2 fixes two foundational display problems that make the platform misleading.

**T03 — Data-sufficiency gate.** A Chart.js or D3 line chart drawn from a single data point is visually indistinguishable from a trend, but conveys false confidence. The rule is: a KPI card renders as a chart only when a city has two or more *validated* estimations for that KPI. "Validated" means the living lab's `validated_at` timestamp is strictly after the KPI result's `updated_at` timestamp. A city with exactly one validated estimation instead renders a lightweight table row tagged "Baseline only — no follow-up yet". A city with zero validated estimations is silently omitted (empty-state handling belongs to Epic 5 / T06).

**T02 — Implementation record split.** Four KPIs that describe implementation progress (e.g. level of SUMP measure completion) are not outcome metrics and do not belong in the trend-chart grid. They move to a dedicated "Implementation Record" table that is shared between the global `/data/kpis` page and each city's `/living-lab-city/[labId]` page. The chart section is then free of these KPIs entirely.

Both changes share a single utility file introduced in T03. No database schema changes are required: `validated_at` (on `ILivingLab`) and `updated_at` (on `IKpiResult`) already exist.

---

## 2. Design Decisions with Rationale

### 2.1 Sufficiency check in a shared utility

The check `lab.validated_at > kpiresult.updated_at` appears in at least four call-sites (KpiCard, KpiMultiple, KpiLivingLabsSingleCard, dashboard `buildLabTimelines`). Duplicating it would make future rule changes error-prone. A single function in `src/lib/utils/kpiSufficiency.ts` is the only source of truth.

### 2.2 `validated_at` flows into `ILivingLabKpiData` via the SSR transform

`ILivingLabKpiData` (in `src/components/react/KPIsDashboard/types.ts`) is built in the SSR layer of `kpis.astro` and is the shape serialised into the Astro island prop. It currently drops `validated_at`. Adding it here is the minimal-surface change: one field on one interface, one extra line in the `.map()` call in each SSR page. React components downstream receive it without needing an additional fetch.

For the single-lab page (`[labId].astro`), `validated_at` lives on `livingLabData` (the `ILivingLabPopulated` already has it). It is forwarded as a new prop to `LivingLabKPIsView`.

### 2.3 Implementation KPI IDs in a config constant

The four KPI IDs are not yet confirmed by the WP1 leader (see section 7). They must live in a single constant — `IMPLEMENTATION_KPI_IDS` in `src/config/implementationKpis.ts` — so that updating the list is a one-line change when WP1 confirms. Both SSR pages import it to split the KPI lists before they pass props to React.

### 2.4 No database schema changes

`living_labs.validated_at` and `kpiresults.updated_at` are already in the Prisma schema and returned by the existing API endpoints. T03 and T02 are purely display-layer changes.

### 2.5 Baseline labs in the global multi-lab view

When a KPI card in the global dashboard has some labs with two or more validated estimations and other labs with exactly one, the chart renders for the sufficient labs and a compact table appears **below the chart** listing the baseline-only labs. If every selected lab for a KPI has exactly one validated estimation (no chart at all), the card renders as a standalone baseline-only table without a chart. The `KpiLivingLabsSingleCard` component owns both modes.

### 2.6 `ImplementationRecordTable` is a shared component

The T02 table must render in both the global page (`KPIsDashboard`) and the single-lab page (`LivingLabKPIsView`). Rather than duplicating JSX, a new `ImplementationRecordTable` component handles both column sets via a `view` prop (`"global"` | `"lab"`). The global view adds a "City" column; the lab view omits it.

---

## 3. T03 Architecture

### 3a. New file: `src/lib/utils/kpiSufficiency.ts`

This is the first file to create. Everything else in T03 depends on it.

```typescript
import type { IKpiResult } from "../../types/KPIs";

/**
 * The minimum number of validated estimations required to render a KPI as a chart.
 */
export const CHART_THRESHOLD = 2;

/**
 * Returns true if a KPI result is considered "validated" for a given lab.
 *
 * Validation rule:
 *   lab_validated_at > kpi_result.updated_at
 *
 * If either timestamp is absent the result is treated as NOT validated
 * (conservative default: do not promote data whose freshness cannot be confirmed).
 */
export function isResultValidated(
  result: IKpiResult,
  labValidatedAt: Date | null | undefined,
): boolean {
  if (!labValidatedAt || !result.updated_at) return false;
  const labTs = new Date(labValidatedAt).getTime();
  const kpiTs = new Date(result.updated_at).getTime();
  return labTs > kpiTs;
}

/**
 * Counts how many results in the array are validated for the given lab.
 */
export function countValidatedResults(
  results: IKpiResult[],
  labValidatedAt: Date | null | undefined,
): number {
  return results.filter((r) => isResultValidated(r, labValidatedAt)).length;
}

/**
 * Describes the display mode for a KPI result group.
 *
 * - "chart"    → >= CHART_THRESHOLD validated results  → render as chart
 * - "baseline" → exactly 1 validated result            → render as baseline row
 * - "hidden"   → 0 validated results                   → do not render
 */
export type KpiDisplayMode = "chart" | "baseline" | "hidden";

export function getKpiDisplayMode(
  results: IKpiResult[],
  labValidatedAt: Date | null | undefined,
): KpiDisplayMode {
  const count = countValidatedResults(results, labValidatedAt);
  if (count >= CHART_THRESHOLD) return "chart";
  if (count === 1) return "baseline";
  return "hidden";
}
```

**Reasoning for conservative default in `isResultValidated`:** if `updated_at` is missing (older records, data migration gaps), promoting the result to "chart-worthy" without confirmation could reintroduce the misleading single-point chart problem in disguise. Treat missing timestamps as unvalidated.

---

### 3b. Type change: add `validated_at` to `ILivingLabKpiData`

File: `src/components/react/KPIsDashboard/types.ts`

```typescript
// BEFORE
export interface ILivingLabKpiData {
  id: number;
  name: string;
  kpiResults: IKpiResultGroup[];
}

// AFTER
export interface ILivingLabKpiData {
  id: number;
  name: string;
  kpiResults: IKpiResultGroup[];
  validated_at?: Date | null;  // lab-level validation timestamp; used by sufficiency check
}
```

---

### 3c. SSR changes

#### `src/pages/data/kpis.astro`

The `livingLabsForDashboard` map currently drops `validated_at`. Add it:

```typescript
// BEFORE
const livingLabsForDashboard = filteredLivingLabs.map((lab) => ({
  id: Number(lab.id),
  name: lab.name,
  kpiResults: lab.kpi_results ?? [],
}));

// AFTER
const livingLabsForDashboard = filteredLivingLabs.map((lab) => ({
  id: Number(lab.id),
  name: lab.name,
  kpiResults: lab.kpi_results ?? [],
  validated_at: lab.validated_at ?? null,
}));
```

No other changes in this file for T03. The prop passed to `<KPIsDashboard>` is already `livingLabsForDashboard`, so the additional field serialises automatically.

#### `src/pages/living-lab-city/[labId].astro`

`LivingLabKPIsView` does not currently receive `validated_at`. Add a new prop:

```astro
<!-- BEFORE -->
<LivingLabKPIsView
  categories={kpiResultsByCategory}
  kpis={nonModalSplitKpis}
  client:load
/>

<!-- AFTER -->
<LivingLabKPIsView
  categories={kpiResultsByCategory}
  kpis={nonModalSplitKpis}
  lab_validated_at={livingLabData?.validated_at ?? null}
  client:load
/>
```

`livingLabData` is already fetched as `ILivingLabPopulated` which has `validated_at`. No additional API calls needed.

---

### 3d. `LivingLabKPIsView` changes

File: `src/components/react/LivingLabKPIsView.tsx`

Add `lab_validated_at` to the Props type and thread it down to `KpiCard` and `KpiMultiple`:

```typescript
type Props = {
  kpis?: IKpi[];
  categories?: IKpiResultsByCategory[];
  living_lab_id?: number;
  lab_validated_at?: Date | null;  // NEW
  modalSplitKpis?: { ... };
};
```

Inside `getKpiSection`, pass the new prop:

```typescript
const getKpiSection = (
  parentKpi: IKpi,
  resultKpis: IKpiResultGroup[] = [],
) => {
  if (resultKpis.length === 1) {
    return (
      <KpiCard
        kpi={parentKpi}
        kpiResults={resultKpis[0]}
        lab_validated_at={lab_validated_at}  // NEW
      />
    );
  }
  if (resultKpis.length > 1) {
    return (
      <KpiMultiple
        parentKpi={parentKpi}
        kpis={kpis ?? []}
        results={resultKpis}
        lab_validated_at={lab_validated_at}  // NEW
      />
    );
  }
};
```

---

### 3e. `KpiCard` + `KpiDefault` changes

File: `src/components/react/KpiCards/KpiCard.tsx`

```typescript
// New prop
type Props = {
  kpi: IKpi;
  kpiResults?: IKpiResultGroup;
  lab_validated_at?: Date | null;  // NEW
};

export function KpiCard({ kpi, kpiResults, lab_validated_at }: Props) {
  const displayMode = kpiResults
    ? getKpiDisplayMode(kpiResults.results, lab_validated_at)
    : "hidden";

  // ...existing badge and title JSX unchanged...

  if (displayMode === "hidden" || !kpiResults) return null;  // 0 validated → omit

  if (displayMode === "baseline") {
    return (
      <div className="p-1 lg:p-2">
        <div className="p-2 relative rounded-2xl border-primary-light border">
          {/* badge unchanged */}
          {/* title unchanged */}
          <KpiBaselineValue
            kpiResults={kpiResults}
            metricType={kpi.metric}
          />
        </div>
      </div>
    );
  }

  // displayMode === "chart" — original render path unchanged
  return (
    <div className="p-1 lg:p-2">
      <div className="p-2 relative rounded-2xl border-primary-light border">
        {/* badge and title unchanged */}
        <KpiDefault ... />
        <div className="flex justify-end mt-2">
          <TriggerDownloadCsv ... />
        </div>
      </div>
    </div>
  );
}
```

`KpiDefault` itself does not change: it only renders when `displayMode === "chart"`, so it always has at least two points. No guard is needed inside `KpiDefault`.

---

### 3f. `KpiMultiple` changes

File: `src/components/react/KpiCards/KpiMultiple.tsx`

`KpiMultiple` receives an array of `IKpiResultGroup`, one per child KPI. The sufficiency check runs per child:

```typescript
type Props = {
  parentKpi: IKpi;
  kpis: IKpi[];
  results: IKpiResultGroup[];
  lab_validated_at?: Date | null;  // NEW
};

export function KpiMultiple({ parentKpi, kpis, results, lab_validated_at }: Props) {
  // Partition child results by display mode
  const chartResults = results.filter(
    (r) => getKpiDisplayMode(r.results, lab_validated_at) === "chart"
  );
  const baselineResults = results.filter(
    (r) => getKpiDisplayMode(r.results, lab_validated_at) === "baseline"
  );
  // "hidden" results (0 validated) are dropped silently

  // If no child has chart-worthy data and none is baseline → render nothing
  if (chartResults.length === 0 && baselineResults.length === 0) return null;

  return (
    <div className="p-1 lg:p-2">
      <div className="p-2 relative rounded-2xl border-primary-light border">
        {/* badge and title unchanged */}

        {/* Chart section — only children with >=2 validated estimations */}
        {chartResults.length > 0 && (
          <>
            {/* existing per-child value grid (chartResults only) */}
            {/* existing Line chart (chartResults only) */}
          </>
        )}

        {/* Baseline rows — children with exactly 1 validated estimation */}
        {baselineResults.length > 0 && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            {baselineResults.map((r) => {
              const kpiData = kpis.find((k) => k.id === r.kpidefinition_id);
              return (
                <KpiBaselineValue
                  key={r.kpidefinition_id}
                  kpiResults={r}
                  metricType={kpiData?.metric}
                  label={kpiData?.name}
                />
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-2">
          <TriggerDownloadCsv ... />
        </div>
      </div>
    </div>
  );
}
```

The chart datasets must be rebuilt using only `chartResults` — the existing `results.forEach(...)` loop is replaced with `chartResults.forEach(...)`.

---

### 3g. Dashboard: `buildLabTimelines` and `KpiLivingLabsSingleCard`

#### New helper: `partitionLabsBySufficiency`

Add to `src/components/react/KPIsDashboard/utils.ts`:

```typescript
import { getKpiDisplayMode, type KpiDisplayMode } from "../../../lib/utils/kpiSufficiency";

export interface ILabPartition {
  chartLabs: ILabKpiTimeline[];
  baselineLabs: Array<{
    labId: number;
    labName: string;
    color: string;
    // The single validated result for display in the baseline row
    result: IKpiResult;
  }>;
}

/**
 * Splits living lab data for a single KPI into chart-eligible labs and
 * baseline-only labs according to the data-sufficiency rule.
 *
 * Labs with 0 validated estimations are excluded from both partitions.
 */
export function partitionLabsBySufficiency(
  kpi: IKpi,
  livingLabs: ILivingLabKpiData[],
  filter: KpiLivingLabsCardsFilter,
  colorMap: Map<number, string>,
  fallbackColor: string,
): ILabPartition {
  const chartLabs: ILabKpiTimeline[] = [];
  const baselineLabs: ILabPartition["baselineLabs"] = [];

  livingLabs.forEach((lab) => {
    if (!filter.selectedLabIds?.includes(lab.id)) return;

    const kpiResult = lab.kpiResults.find((r) => r.kpidefinition_id === kpi.id);
    if (!kpiResult) return;

    const mode = getKpiDisplayMode(kpiResult.results, lab.validated_at);

    if (mode === "chart") {
      const dataPoints = filter.selectedYears
        ? processKpiResults(kpiResult, filter.selectedYears)
        : [];
      if (dataPoints.length > 0) {
        chartLabs.push({
          labId: lab.id,
          labName: lab.name,
          color: colorMap.get(lab.id) || fallbackColor,
          dataPoints,
        });
      }
    } else if (mode === "baseline") {
      // Find the single validated result to display
      const validatedResult = kpiResult.results.find(
        (r) => isResultValidated(r, lab.validated_at)
      );
      if (validatedResult) {
        baselineLabs.push({
          labId: lab.id,
          labName: lab.name,
          color: colorMap.get(lab.id) || fallbackColor,
          result: validatedResult,
        });
      }
    }
    // mode === "hidden" → skip
  });

  return { chartLabs, baselineLabs };
}
```

`buildLabTimelines` (existing function) is **unchanged** — it is not called on the chart path anymore; `KpiLivingLabsSingleCard` will call `partitionLabsBySufficiency` instead. However, to avoid a breaking change in any test that imports `buildLabTimelines`, keep the function. The call-site in `buildKpiDataMap` is replaced.

#### `buildKpiDataMap` update

The existing function only stores `ILabKpiTimeline[]` per KPI. After T03 it must also store baseline data. Two approaches are possible:

1. Replace `Map<number, ILabKpiTimeline[]>` with `Map<number, ILabPartition>` — cleaner but touches more type sites.
2. Keep `buildKpiDataMap` returning `ILabKpiTimeline[]` for chart labs only and call `partitionLabsBySufficiency` directly from the card component.

**Decision: option 2.** `KpiLivingLabsSingleCard` receives the full `livingLabs` array (which now includes `validated_at`) plus the current `filter` and `colorMap`, calls `partitionLabsBySufficiency` internally, and decides what to render. This avoids threading a new map type through `KpiLivingLabsCards`.

This means `KpiLivingLabsSingleCard` needs new props:

```typescript
// BEFORE
export interface KpiLivingLabsCardProps {
  kpi: IKpi;
  labTimelines: ILabKpiTimeline[];
}

// AFTER
export interface KpiLivingLabsCardProps {
  kpi: IKpi;
  labTimelines: ILabKpiTimeline[];  // kept for backward compat; used only if partition not available
  livingLabs: ILivingLabKpiData[];  // NEW — to run partitionLabsBySufficiency
  filter: KpiLivingLabsCardsFilter; // NEW
  colorMap: Map<number, string>;    // NEW
}
```

`KpiLivingLabsCards.renderKpiGroup` passes the extra props when constructing `KpiLivingLabsSingleCard`.

#### `KpiLivingLabsSingleCard` render logic

```typescript
export const KpiLivingLabsSingleCard: React.FC<KpiLivingLabsCardProps> = ({
  kpi,
  livingLabs,
  filter,
  colorMap,
}) => {
  const { chartLabs, baselineLabs } = partitionLabsBySufficiency(
    kpi, livingLabs, filter, colorMap, COLOR_GRAY
  );

  const hasChart = chartLabs.length > 0;
  const hasBaseline = baselineLabs.length > 0;

  if (!hasChart && !hasBaseline) return null;

  return (
    <div className="p-2">
      <div className="p-4 relative rounded-2xl border-primary-light border bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* badge and title — unchanged */}

        {/* Chart — only when there are chart-eligible labs */}
        {hasChart && (
          <div className="mt-4">
            <D3TimelineChart
              data={chartLabs}
              metricType={kpi.metric}
              height={280}
              showLegend={false}
            />
          </div>
        )}

        {/* Baseline table — labs with exactly 1 validated estimation */}
        {hasBaseline && (
          <div className={`mt-3 ${hasChart ? "pt-3 border-t border-gray-100" : ""}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-1">City</th>
                  <th className="pb-1">Value</th>
                  <th className="pb-1">Reporting date</th>
                  <th className="pb-1"></th>
                </tr>
              </thead>
              <tbody>
                {baselineLabs.map((bl) => (
                  <tr key={bl.labId} className="border-t border-gray-50">
                    <td className="py-1 font-medium" style={{ color: bl.color }}>
                      {bl.labName}
                    </td>
                    <td className="py-1">
                      {formatValue(bl.result.value, kpi.metric)}
                    </td>
                    <td className="py-1 text-gray-400">
                      {formatMonthYear(bl.result.date)}
                    </td>
                    <td className="py-1">
                      <span className="text-xs italic text-gray-400">
                        Baseline only — no follow-up yet
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer — unchanged */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex w-full items-center justify-between">
          ...
        </div>
      </div>
    </div>
  );
};
```

---

### 3h. New component: `KpiBaselineValue`

**File:** `src/components/react/KpiCards/KpiBaselineValue.tsx`

Used by `KpiCard` (single-lab page, single KPI with 1 validated result) and by `KpiMultiple` (single-lab page, child KPI with 1 validated result). It is **not** used in the global dashboard; the dashboard handles baseline display inline in `KpiLivingLabsSingleCard`.

```typescript
import type { IKpiResultGroup, EnumKpiMetricType } from "../../../types/KPIs";
import {
  formatValue,
  formatMonthYear,
  getFormattedValueString,
} from "../../../lib/helpers";

type Props = {
  kpiResults: IKpiResultGroup;
  metricType: EnumKpiMetricType | undefined;
  label?: string;  // optional override for child KPI name in KpiMultiple context
};

export function KpiBaselineValue({ kpiResults, metricType, label }: Props) {
  // There is exactly one validated result; display it
  const result = kpiResults.results[0];
  if (!result) return null;

  const formattedValue = formatValue(result.value, metricType);
  const displayDate = formatMonthYear(result.date);

  return (
    <div className="flex flex-col gap-2 py-4">
      {label && (
        <p className="text-sm text-gray-600">{label}</p>
      )}
      <div className="flex items-end gap-3">
        <h3 className="text-4xl font-extrabold text-gray-900 leading-none">
          {getFormattedValueString(formattedValue, metricType)}
        </h3>
        <p className="text-lg text-muted mb-0.5">{displayDate}</p>
      </div>
      <span className="text-xs italic text-gray-400">
        Baseline only — no follow-up yet
      </span>
    </div>
  );
}
```

**What it renders:**
- Large current value (same typographic weight as `KpiDefault`)
- Reporting date (month/year)
- Tag line: "Baseline only — no follow-up yet" in italic gray

**What it does not render:**
- No chart
- No before/after comparison
- No change arrow

---

## 4. T02 Architecture

T02 starts only after T03 is merged. It re-uses `IMPLEMENTATION_KPI_IDS` as the gate everywhere.

### 4a. New file: `src/config/implementationKpis.ts`

```typescript
/**
 * KPI definition IDs for implementation indicators.
 *
 * These KPIs describe process completion, not outcome trends.
 * They render in the Implementation Record table, not in the chart grid.
 *
 * !! TO BE CONFIRMED BY WP1 LEADER before T02 starts !!
 * Replace placeholder IDs with the confirmed values.
 */
export const IMPLEMENTATION_KPI_IDS: number[] = [
  // TODO: replace with confirmed IDs
  // - Level of completion of SUMP measures
  // - Community involvement
  // - Balance of planned/implemented pull–push measures
  // - Number of NSM integrated in the system
  -1, // placeholder — causes zero matches until confirmed
];

export function isImplementationKpi(kpiId: number): boolean {
  return IMPLEMENTATION_KPI_IDS.includes(kpiId);
}
```

Using `-1` as a placeholder means the code ships and tests pass with no visual change until real IDs are inserted. A comment blocks an accidental silent no-op.

---

### 4b. SSR changes in both pages

#### `src/pages/data/kpis.astro`

```typescript
import { IMPLEMENTATION_KPI_IDS, isImplementationKpi } from "../../config/implementationKpis";

// Existing split: remove modal-split KPIs (kpi_number starts with "15")
// New second split: separate implementation KPIs from outcome KPIs
const nonModalSplitKpis = allKpis.filter(
  (kpi) => !kpi.kpi_number.startsWith("15")
);
const outcomeKpis = nonModalSplitKpis.filter(
  (kpi) => !isImplementationKpi(kpi.id)
);
const implementationKpis = nonModalSplitKpis.filter(
  (kpi) => isImplementationKpi(kpi.id)
);
```

Pass both to `KPIsDashboard`:

```astro
<KPIsDashboard
  livingLabs={livingLabsForDashboard}
  kpis={outcomeKpis}
  implementationKpis={implementationKpis}
  availableYears={sortedYears}
  categories={categories}
  modalSplitData={[]}
  transportModes={[]}
  client:load
/>
```

#### `src/pages/living-lab-city/[labId].astro`

```typescript
import { isImplementationKpi } from "../../config/implementationKpis";

const outcomeKpis = nonModalSplitKpis.filter(
  (kpi) => !isImplementationKpi(kpi.id)
);
const implementationKpis = nonModalSplitKpis.filter(
  (kpi) => isImplementationKpi(kpi.id)
);
```

Pass to `LivingLabKPIsView`:

```astro
<LivingLabKPIsView
  categories={kpiResultsByCategory}
  kpis={outcomeKpis}
  implementationKpis={implementationKpis}
  lab_validated_at={livingLabData?.validated_at ?? null}
  living_lab_id={Number(livingLabData.id)}
  client:load
/>
```

---

### 4c. Prop additions

#### `KPIsDashboardProps` (in `src/components/react/KPIsDashboard/types.ts`)

```typescript
export interface KPIsDashboardProps {
  livingLabs: ILivingLabKpiData[];
  kpis: IKpi[];              // outcome KPIs only (after T02 filter)
  implementationKpis: IKpi[]; // NEW — the 4 implementation KPIs
  availableYears: number[];
  categories: ICategory[];
  modalSplitData?: IModalSplitKpiData[];
  transportModes?: ITransportMode[];
}
```

#### `LivingLabKPIsView` Props (in `src/components/react/LivingLabKPIsView.tsx`)

```typescript
type Props = {
  kpis?: IKpi[];                  // outcome KPIs only
  implementationKpis?: IKpi[];    // NEW
  categories?: IKpiResultsByCategory[];
  living_lab_id?: number;
  lab_validated_at?: Date | null;
  modalSplitKpis?: { ... };
};
```

---

### 4d. New component: `ImplementationRecordTable`

**File:** `src/components/react/KPIsDashboard/ImplementationRecordTable.tsx`

This component is shared between the global and single-lab views. A `view` prop selects the column set.

```typescript
import type { IKpi } from "../../../types";
import type { ILivingLabKpiData } from "./types";
import type { IKpiResultGroup } from "../../../types/KPIs";
import { formatValue, formatMonthYear, getFormattedValueString } from "../../../lib/helpers";
import { TriggerDownloadCsv } from "../TriggerDownloadCsv/TriggerDownloadCsv";

interface GlobalRow {
  kpiId: number;
  kpiName: string;
  kpiNumber: string;
  metric: string;
  labId: number;
  labName: string;
  value: number;
  date: string;
}

interface LabRow {
  kpiId: number;
  kpiName: string;
  kpiNumber: string;
  metric: string;
  labId: number;
  value: number;
  date: string;
}

type Props =
  | {
      view: "global";
      kpis: IKpi[];
      livingLabs: ILivingLabKpiData[];
    }
  | {
      view: "lab";
      kpis: IKpi[];
      kpiResults: IKpiResultGroup[];
      living_lab_id: number;
    };

export function ImplementationRecordTable(props: Props) {
  if (props.view === "global") {
    const rows: GlobalRow[] = [];
    props.kpis.forEach((kpi) => {
      props.livingLabs.forEach((lab) => {
        const group = lab.kpiResults.find(
          (r) => r.kpidefinition_id === kpi.id
        );
        if (!group || group.results.length === 0) return;
        // Show most recent result
        const latest = [...group.results].sort(
          (a, b) => Date.parse(b.date) - Date.parse(a.date)
        )[0];
        rows.push({
          kpiId: kpi.id,
          kpiName: kpi.name,
          kpiNumber: kpi.kpi_number,
          metric: kpi.metric,
          labId: lab.id,
          labName: lab.name,
          value: latest.value,
          date: latest.date,
        });
      });
    });

    if (rows.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        {/* Explanatory text — placeholder, confirmed by WP1 (see section 7) */}
        <p className="text-sm text-gray-600 italic">
          {/* TODO: replace with confirmed text from WP1 */}
          These indicators track the progress of SUMP implementation across living labs.
        </p>
        <div className="overflow-x-auto rounded-xl border border-primary-light">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">KPI</th>
                <th className="px-3 py-2 text-left">City</th>
                <th className="px-3 py-2 text-right">Value</th>
                <th className="px-3 py-2 text-left">Reporting date</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.kpiId}-${row.labId}`}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-3 py-2">
                    <span className="font-medium">{row.kpiName}</span>
                    <span className="ml-1 text-xs text-gray-400">
                      KPI {row.kpiNumber}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.labName}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {getFormattedValueString(
                      formatValue(row.value, row.metric as any),
                      row.metric as any
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {formatMonthYear(row.date)}
                  </td>
                  <td className="px-3 py-2">
                    <TriggerDownloadCsv
                      type="kpi-results-definition"
                      size="sm"
                      kpidefinition_id={row.kpiId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // view === "lab"
  const rows: LabRow[] = [];
  props.kpis.forEach((kpi) => {
    const group = props.kpiResults.find(
      (r) => r.kpidefinition_id === kpi.id
    );
    if (!group || group.results.length === 0) return;
    const latest = [...group.results].sort(
      (a, b) => Date.parse(b.date) - Date.parse(a.date)
    )[0];
    rows.push({
      kpiId: kpi.id,
      kpiName: kpi.name,
      kpiNumber: kpi.kpi_number,
      metric: kpi.metric,
      labId: props.living_lab_id,
      value: latest.value,
      date: latest.date,
    });
  });

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600 italic">
        {/* TODO: confirmed text from WP1 */}
        These indicators track the progress of SUMP implementation for this city.
      </p>
      <div className="overflow-x-auto rounded-xl border border-primary-light">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">KPI</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2 text-left">Reporting date</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.kpiId}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-3 py-2">
                  <span className="font-medium">{row.kpiName}</span>
                  <span className="ml-1 text-xs text-gray-400">
                    KPI {row.kpiNumber}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {getFormattedValueString(
                    formatValue(row.value, row.metric as any),
                    row.metric as any
                  )}
                </td>
                <td className="px-3 py-2 text-gray-500">
                  {formatMonthYear(row.date)}
                </td>
                <td className="px-3 py-2">
                  <TriggerDownloadCsv
                    type="kpi-results-lab"
                    size="sm"
                    living_lab_id={row.labId}
                    kpidefinition_id={row.kpiId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Column mapping:**

| Column | Global view | Lab view |
|--------|-------------|----------|
| KPI name + number | yes | yes |
| City | yes | no (implied) |
| Value | yes | yes |
| Reporting date | yes | yes |
| CSV button | per KPI-definition | per KPI+lab |

**Where it renders:**

- **Global page:** Inside `KPIsDashboard`, immediately after (below) the `KpiLivingLabsCards` section but before the `PageNavigation` sentinel. Wrapped in a section heading "Implementation Record". Navigation item added if the section is non-empty.
- **Single-lab page:** Inside `LivingLabKPIsView`, rendered as a sibling block after the category `ExpansionPanel` list. Wrapped in a heading at the same hierarchy as category headers.

---

### 4e. Filtering: exclude implementation KPIs from chart rendering

`KpiLivingLabsCards` receives `kpis={outcomeKpis}` from the updated SSR (section 4b), so it never sees implementation KPI IDs. No further filtering logic is needed inside `KpiLivingLabsCards`.

`LivingLabKPIsView` receives `kpis={outcomeKpis}`. Inside `getCategorySection`, the existing filter `kpis?.some((k) => k.id === kr.kpidefinition_id)` already gates which results produce a card. Because `outcomeKpis` excludes the four implementation KPIs, their results fall through the filter and are never rendered as charts. No other change needed in `getCategorySection`.

The implementation KPI results that belong to the category's `kpiResults` array must however still reach `ImplementationRecordTable`. The table in `LivingLabKPIsView` is fed directly from the raw `categories` prop (all `kpiResults` across categories) filtered by `implementationKpis`, not from the chart path.

Concretely, `LivingLabKPIsView` derives the table's result set as follows:

```typescript
// Collect all kpiResults across categories that match an implementationKpi
const implementationResults: IKpiResultGroup[] = (implementationKpis ?? []).length > 0
  ? categories.flatMap((cat) =>
      (cat.kpiResults ?? []).filter((kr) =>
        (implementationKpis ?? []).some((k) => k.id === kr.kpidefinition_id)
      )
    )
  : [];
```

---

## 5. Full File Change List

| File | Status | Task | What changes |
|------|--------|------|--------------|
| `src/lib/utils/kpiSufficiency.ts` | **new** | T03 | `isResultValidated`, `countValidatedResults`, `getKpiDisplayMode`, `KpiDisplayMode`, `CHART_THRESHOLD` |
| `src/config/implementationKpis.ts` | **new** | T02 | `IMPLEMENTATION_KPI_IDS`, `isImplementationKpi` |
| `src/components/react/KpiCards/KpiBaselineValue.tsx` | **new** | T03 | Baseline-only display: value, date, tag line |
| `src/components/react/KPIsDashboard/ImplementationRecordTable.tsx` | **new** | T02 | Shared table component, `view="global"` and `view="lab"` |
| `src/components/react/KPIsDashboard/types.ts` | **modify** | T03, T02 | Add `validated_at` to `ILivingLabKpiData`; add `implementationKpis` to `KPIsDashboardProps`; add `livingLabs`, `filter`, `colorMap` to `KpiLivingLabsCardProps` |
| `src/components/react/KPIsDashboard/utils.ts` | **modify** | T03 | Add `partitionLabsBySufficiency`; import `isResultValidated`, `getKpiDisplayMode` |
| `src/components/react/KPIsDashboard/KPIsDashboard.tsx` | **modify** | T02 | Accept `implementationKpis` prop; render `ImplementationRecordTable` below chart section |
| `src/components/react/KPIsDashboard/KpiLivingLabsCards.tsx` | **modify** | T03 | Pass `livingLabs`, `filter`, `colorMap` to `KpiLivingLabsSingleCard` |
| `src/components/react/KPIsDashboard/KpiLivingLabsSingleCard.tsx` | **modify** | T03 | Call `partitionLabsBySufficiency`; render chart section (chartLabs) + baseline table (baselineLabs); return null when both empty |
| `src/components/react/LivingLabKPIsView.tsx` | **modify** | T03, T02 | Add `lab_validated_at` prop (T03); add `implementationKpis` prop (T02); pass `lab_validated_at` to `KpiCard`/`KpiMultiple`; render `ImplementationRecordTable` (T02) |
| `src/components/react/KpiCards/KpiCard.tsx` | **modify** | T03 | Add `lab_validated_at` prop; call `getKpiDisplayMode`; branch to `KpiBaselineValue`, null, or original render |
| `src/components/react/KpiCards/KpiMultiple.tsx` | **modify** | T03 | Add `lab_validated_at` prop; partition `results` by display mode; rebuild chart datasets from `chartResults` only; render `KpiBaselineValue` rows for `baselineResults` |
| `src/pages/data/kpis.astro` | **modify** | T03, T02 | Add `validated_at` to lab map (T03); split `outcomeKpis`/`implementationKpis` (T02); pass `implementationKpis` to `KPIsDashboard` (T02) |
| `src/pages/living-lab-city/[labId].astro` | **modify** | T03, T02 | Pass `lab_validated_at` to `LivingLabKPIsView` (T03); split KPI lists and pass `implementationKpis` (T02) |

---

## 6. Implementation Order

### Phase 1 — T03

Execute in this order. Each step depends on the previous.

1. **Create `src/lib/utils/kpiSufficiency.ts`** — the utility is self-contained, has no local imports beyond types. Write unit tests here before continuing.

2. **Modify `ILivingLabKpiData` in `types.ts`** — add `validated_at?: Date | null`. TypeScript will flag all construction sites at compile time; fix them in the next step.

3. **Modify `kpis.astro`** — add `validated_at` to the `livingLabsForDashboard` map. Resolves the TS error from step 2 on the global-page construction site.

4. **Modify `[labId].astro`** — add `lab_validated_at` prop to the `LivingLabKPIsView` call.

5. **Modify `LivingLabKPIsView`** — add `lab_validated_at` to Props; thread it to `KpiCard` and `KpiMultiple`.

6. **Create `KpiBaselineValue`** — no dependencies other than types and helpers.

7. **Modify `KpiCard`** — add prop, import `getKpiDisplayMode`, branch render logic.

8. **Modify `KpiMultiple`** — add prop, partition results, rebuild chart datasets, add baseline rows.

9. **Add `partitionLabsBySufficiency` to `utils.ts`** — imports from `kpiSufficiency.ts` (step 1) and existing `processKpiResults`.

10. **Modify `KpiLivingLabsCardProps` in `types.ts`** — add `livingLabs`, `filter`, `colorMap`.

11. **Modify `KpiLivingLabsCards`** — pass new props when constructing `KpiLivingLabsSingleCard`.

12. **Modify `KpiLivingLabsSingleCard`** — call `partitionLabsBySufficiency`, branch render logic.

13. **Manual smoke-test on `/data/kpis` and a city page** — confirm no single-point charts, baseline rows appear correctly, zero-point labs are absent.

### Phase 2 — T02 (only after T03 is merged and green)

1. **Confirm `IMPLEMENTATION_KPI_IDS` with WP1 leader.** Do not write production code until this is confirmed.

2. **Create `src/config/implementationKpis.ts`** — even with placeholder IDs, this unblocks type-checking the rest.

3. **Create `ImplementationRecordTable`** — self-contained component; no changes to other files needed yet.

4. **Modify `KPIsDashboardProps`** — add `implementationKpis`.

5. **Modify `kpis.astro`** — split KPI lists; pass `implementationKpis` to `KPIsDashboard`.

6. **Modify `KPIsDashboard`** — accept `implementationKpis`; render `ImplementationRecordTable` with `view="global"` below the chart section.

7. **Modify `LivingLabKPIsView` Props** — add `implementationKpis`.

8. **Modify `[labId].astro`** — split KPI lists; pass `implementationKpis` to `LivingLabKPIsView`.

9. **Modify `LivingLabKPIsView`** — collect implementation results from categories; render `ImplementationRecordTable` with `view="lab"`.

10. **Replace placeholder IDs with confirmed IDs in `implementationKpis.ts`.**

11. **Manual smoke-test** — confirm 4 KPIs appear only in the table, not in any chart section, on both page types. Confirm CSV downloads work from the new table location.

---

## 7. Open Questions

| # | Question | Owner | Blocks |
|---|----------|-------|--------|
| OQ-1 | What are the exact KPI definition IDs (database IDs) for the 4 implementation indicators? | WP1 leader | T02 phase step 10 — placeholder is safe for code structure but the feature is invisible until IDs are real |
| OQ-2 | What is the confirmed explanatory sentence to display above the Implementation Record table? | WP1 leader | `ImplementationRecordTable` placeholder text (two `TODO` comments in section 4d) |
| OQ-3 | Visual design for the baseline table in the global dashboard: should it share the card's border-and-shadow container, or appear as a separate flat strip? | UX / product | `KpiLivingLabsSingleCard` baseline section styling in section 3g |
| OQ-4 | When a KPI has chart labs and baseline labs simultaneously in the global view, should baseline labs still appear in the sticky legend? | UX / product | `TopStickyLegend` fed from `legendItems` in `KpiLivingLabsCards` — currently includes all selected labs regardless of sufficiency |
| OQ-5 | Does the `isResultValidated` conservative default (missing `updated_at` → not validated) match WP1 data quality expectations, or should missing `updated_at` be treated as always-validated for legacy records? | WP1 / data | `kpiSufficiency.ts` `isResultValidated` logic |

---

## 8. Out of Scope

The following are explicitly excluded from this epic and must not be added during T03/T02 implementation:

- **Empty state for zero-estimation KPIs.** When `displayMode === "hidden"`, the result is silently omitted. The designed empty state (placeholder card, "No data yet" message) is delivered in Epic 5 / T06.
- **Changes to chart libraries.** `KpiDefault` (Chart.js), `KpiMultiple` (Chart.js), and `D3TimelineChart` (D3) are unchanged except for which datasets are fed into them. No library upgrades, no chart type changes.
- **API or Prisma schema changes.** `validated_at` and `updated_at` are already in the schema. No migrations, no endpoint changes.
- **CSV endpoint changes.** The download URLs (`/csv/kpiresults?...`) are unchanged. Only the UI component that triggers the download moves (from the chart card to the implementation table row).
- **Filtering the Implementation Record table.** The global-page filter panel (lab, year, category) applies only to the chart section. The Implementation Record table is unfiltered — it shows all data from all labs.
- **Validation of the `validated_at` field itself.** If a living lab's `validated_at` is in the future or is a data-entry error, that is a data governance problem, not a display problem. The rule is applied as-is.
- **Per-transport-mode sufficiency checks.** `IKpiResultGroup` has a `transport_mode_id` field. Sufficiency is checked against the group's `results` array as a whole, not per transport mode. Modal split KPIs are already excluded from both chart and implementation sections via the `kpi_number.startsWith("15")` filter that predates this epic.
