# Architecture: Epic 5 — City Identity & Platform Counters

**Tasks:** T06 (M) → T09 (S) — T06 first, then T09
**Wave:** A | **Effort:** M + S | **Stack:** Astro 5 SSR + React 19 islands
**Dependencies:** After Epic 2 (T06 needs T03 data-sufficiency rule; T09 needs T06)

---

## 1. Summary

Epic 5 resolves two presentation problems that generated the PO's very first comment: cities without data look broken, and city counts are ambiguous and inconsistent.

**T06 — City status, map legend & data-pending empty state.** Two independent visual dimensions on the map and in every city listing: **symbol** distinguishes SUM Living Lab from Contributing city (from Epic 3 `displayLabType()`), and **colour** distinguishes has-before/after-data from data-pending. A city with zero published KPIs opens on a "Registered — no data published yet" panel with registration date, instead of an empty dashboard. Status is never carried by colour alone.

**T09 — Split and correct the platform counters.** Every ambiguous "Living Labs" count is replaced by three separately-labelled figures: *SUM Living Labs*, *Contributing cities*, *Cities with before/after data*. All three derive from a single shared helper. A "last data update" value is added. The helper is designed for reuse by Epic 7 (trust strip) and Epic 11 (coverage matrix).

---

## 2. Design Decisions with Rationale

### 2.1 City data status derived from `kpi_results`, not a database flag

A city "has before/after data" if it has at least one `IKpiResultGroup` where both `result_before` and `result_after` are non-null. This is already the condition used by the homepage map data builder (`index.astro` lines 33-34: `.filter((kpi) => kpi.result_before || kpi.result_after)`). T06 formalizes it as a utility function.

No database migration needed — the status is derived from existing KPI result data at SSR time.

### 2.2 City type uses `displayLabType()` from Epic 3, extended for classification

Epic 3 introduced `displayLabType(labId)` in `src/lib/labels.ts`, which returns "SUM Living Lab" or "Contributing city" based on the lab ID threshold (`SUM_PROJECT_MAX_LAB_ID = 9`). T06 reuses this for visual classification. The same function powers the map legend, the city list badges, and the counter helper.

### 2.3 Two visual dimensions: symbol + colour (not colour alone)

Per the epic spec, status must not be carried by colour alone (WCAG accessibility). The map uses:

- **Symbol shape:** Circle for SUM Living Lab, Diamond/square for Contributing city
- **Fill colour:** Green/secondary for "has before/after data", Grey/muted for "data pending"
- **Text label:** Always present in list views, stating both type and status

This yields four combinations, all named in the legend:

| Symbol | Colour | Label |
|--------|--------|-------|
| Circle | Green | SUM Living Lab — data available |
| Circle | Grey | SUM Living Lab — data pending |
| Diamond | Green | Contributing city — data available |
| Diamond | Grey | Contributing city — data pending |

### 2.4 Data-pending city page: panel instead of empty dashboard

When a city has zero published KPIs (`kpi_results` is empty or all results have null values), the current page either renders nothing (if `kpi_results.length === 0`) or renders empty charts. T06 replaces this with a structured panel:

- City name + type badge ("SUM Living Lab" or "Contributing city")
- Registration date (from `livingLabData.created_at`)
- "Registered — no data published yet" message
- Map showing the city's location
- Transport modes and measures (if any exist — these can precede KPI data)

The panel replaces the KPI section only; the rest of the page (map, measures, transport modes) still renders.

### 2.5 Counter helper is a pure function, not a component

The counter logic (count SUM labs, count contributing cities, count cities with data) is a shared utility function that returns plain numbers. It runs SSR-side in every page that needs counters. This is cleaner than a React component because:

- Counters appear in Astro templates (homepage, measures page), not only in React islands
- The function is importable by Epic 7, 11, and 12 without pulling in React
- It accepts the living labs array and returns a typed object — no side effects

### 2.6 "Last data update" derives from the most recent `updated_at` across all KPI results

The `IKpiResult.updated_at` field (already used by Epic 2's sufficiency check) provides the "last updated" timestamp per result. The most recent `updated_at` across all labs' KPI results is the platform-wide "last data update". The counter helper computes this alongside the counts.

### 2.7 Map legend is always visible, not behind a toggle

The current map has a "Show N Living Labs" button that opens a list panel. The legend is a separate, always-visible element positioned at the bottom-left of the map (standard cartographic placement). It does not overlap with the list panel (top-right) or the detail panel (bottom).

---

## 3. T06 Architecture — City Status, Map Legend & Empty State

### 3a. New file: `src/lib/utils/cityStatus.ts`

```typescript
import type { IKpiResultGroup } from "../../types/KPIs";
import type { ILivingLabPopulated } from "../../types/LivingLab";
import { SUM_PROJECT_MAX_LAB_ID } from "../labels";

export type CityType = "sum_living_lab" | "contributing_city";
export type CityDataStatus = "has_data" | "data_pending";

export interface CityStatus {
  type: CityType;
  dataStatus: CityDataStatus;
  typeLabel: string;
  statusLabel: string;
}

/**
 * Determines the city type based on its lab ID.
 */
export function getCityType(labId: number): CityType {
  return labId <= SUM_PROJECT_MAX_LAB_ID
    ? "sum_living_lab"
    : "contributing_city";
}

/**
 * Determines whether a city has published before/after KPI data.
 *
 * A city "has data" if it has at least one KPI result group where
 * both result_before and result_after are non-null.
 */
export function getCityDataStatus(
  kpiResults: IKpiResultGroup[] | undefined | null,
): CityDataStatus {
  if (!kpiResults || kpiResults.length === 0) return "data_pending";

  const hasBeforeAfter = kpiResults.some(
    (group) => group.result_before != null && group.result_after != null,
  );

  return hasBeforeAfter ? "has_data" : "data_pending";
}

/**
 * Returns the full city status (type + data status) with display labels.
 */
export function getFullCityStatus(
  labId: number,
  kpiResults: IKpiResultGroup[] | undefined | null,
): CityStatus {
  const type = getCityType(labId);
  const dataStatus = getCityDataStatus(kpiResults);

  const typeLabel = type === "sum_living_lab"
    ? "SUM Living Lab"
    : "Contributing city";

  const statusLabel = dataStatus === "has_data"
    ? "Data available"
    : "Data pending";

  return { type, dataStatus, typeLabel, statusLabel };
}

/**
 * Map legend entries — all four combinations.
 */
export const MAP_LEGEND_ENTRIES = [
  { type: "sum_living_lab" as CityType, dataStatus: "has_data" as CityDataStatus,
    label: "SUM Living Lab — data available", symbol: "circle", color: "secondary" },
  { type: "sum_living_lab" as CityType, dataStatus: "data_pending" as CityDataStatus,
    label: "SUM Living Lab — data pending", symbol: "circle", color: "gray" },
  { type: "contributing_city" as CityType, dataStatus: "has_data" as CityDataStatus,
    label: "Contributing city — data available", symbol: "diamond", color: "secondary" },
  { type: "contributing_city" as CityType, dataStatus: "data_pending" as CityDataStatus,
    label: "Contributing city — data pending", symbol: "diamond", color: "gray" },
] as const;
```

### 3b. Extend `LivingLab` type in `LivingLabsMapSection`

File: `src/components/react/LivingLabsMapSection.tsx`

The `LivingLab` local type currently has a `status` field (`"complete" | "incomplete" | "in-progress"`) that is partially used. Replace it with the new city status fields:

```typescript
// BEFORE
type LivingLab = {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  status: "complete" | "incomplete" | "in-progress";
  totalMeasures: number;
  kpisCollected: number;
  yearsCollected: number[];
  transportModes: number;
  sustainablePercentage: number;
};

// AFTER
type LivingLab = {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  cityType: CityType;
  dataStatus: CityDataStatus;
  totalMeasures: number;
  kpisCollected: number;
  yearsCollected: number[];
  transportModes: number;
};
```

### 3c. SSR change: compute city status in `index.astro`

File: `src/pages/index.astro`

```typescript
import { getCityType, getCityDataStatus, type CityType, type CityDataStatus } from "../lib/utils/cityStatus";

const labs = livingLabsData?.map((lab) => {
  // ... existing kpiSet/yearsSet logic ...
  return {
    id: lab.id,
    name: lab.name,
    coordinates: { lat: lab.lat, lng: lab.lng },
    radius: lab.radius ?? 50,
    cityType: getCityType(Number(lab.id)),         // NEW
    dataStatus: getCityDataStatus(lab.kpi_results as IKpiResultGroup[]),  // NEW
    totalMeasures: lab.projects?.length,
    kpisCollected: kpiSet.size,
    yearsCollected: Array.from(yearsSet),
    transportModes: lab.transport_modes?.filter((tm) => tm.type === "NSM").length,
  };
});
```

### 3d. Map legend component

New file: `src/components/react/MapLegend.tsx`

```typescript
import { MAP_LEGEND_ENTRIES } from "../../lib/utils/cityStatus";

export function MapLegend() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">Legend</p>
      <div className="flex flex-col gap-1.5">
        {MAP_LEGEND_ENTRIES.map((entry) => (
          <div key={entry.label} className="flex items-center gap-2">
            {/* Symbol */}
            <span
              className={`inline-block w-3 h-3 ${
                entry.symbol === "circle" ? "rounded-full" : "rotate-45"
              } ${
                entry.color === "secondary" ? "bg-secondary" : "bg-gray-300"
              }`}
            />
            {/* Label */}
            <span className="text-gray-600">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3e. `LivingLabsMapSection` changes

File: `src/components/react/LivingLabsMapSection.tsx`

1. **Import** `MapLegend` and city status types
2. **Render legend** as an always-visible overlay at bottom-left of the map:

```tsx
{/* Map Legend — always visible, bottom-left */}
<div className="absolute bottom-4 left-4 z-10">
  <MapLegend />
</div>
```

3. **Update marker colours** based on `dataStatus`:

```typescript
const markers: MarkerData[] = labs.map((lab) => ({
  id: lab.id,
  name: lab.name,
  coordinates: lab.coordinates,
  radius: lab.radius * 1000,
  meta: { lab },
  color: lab.dataStatus === "has_data" ? "secondary" : "gray",  // NEW
}));
```

4. **Update the list panel** to show type and data status per lab:

```tsx
{labs.map((lab) => (
  <div key={lab.id} onClick={() => setSelectedLab(lab)}
    className={`cursor-pointer p-2 rounded shadow-sm bg-white hover:bg-primary-light transition
      ${lab.dataStatus === "has_data" ? "border-l-4 border-secondary" : "border-l-4 border-gray-300"}`}
  >
    <div className="flex items-center gap-2">
      {/* Symbol */}
      <span className={`inline-block w-2.5 h-2.5 ${
        lab.cityType === "sum_living_lab" ? "rounded-full" : "rotate-45"
      } ${lab.dataStatus === "has_data" ? "bg-secondary" : "bg-gray-300"}`} />
      <h6 className="font-semibold text-primary">{lab.name}</h6>
    </div>
    <p className="text-xs text-gray-500 ml-4.5">
      {lab.cityType === "sum_living_lab" ? "SUM Living Lab" : "Contributing city"}
      {" — "}
      {lab.dataStatus === "has_data" ? "data available" : "data pending"}
    </p>
  </div>
))}
```

5. **Update toggle button text** — replace "Living Labs" with "Cities":

```tsx
<span className="text-sm font-medium text-primary">
  Show {labs.length} cities
</span>
```

6. **Update section heading** — replace "Living Labs across Europe" with "Cities across Europe":

```tsx
<h2 className="text-3xl font-bold text-dark mb-2">
  Cities across Europe
</h2>
```

### 3f. Data-pending empty state on city page

File: `src/pages/living-lab-city/[labId].astro`

Replace the conditional KPI section (lines 182-207) with a status-aware branch:

```astro
---
import { getCityDataStatus } from "../../lib/utils/cityStatus";

const cityDataStatus = getCityDataStatus(
  livingLabData?.kpi_results as IKpiResultGroup[] | undefined,
);
---

<!-- KPIs Section -->
{
  cityDataStatus === "has_data" ? (
    <section class="flex flex-col gap-4">
      <h3 class="text-center">Key Performance Indicators (KPIs)</h3>
      {/* ... existing KPI rendering (unchanged) ... */}
    </section>
  ) : (
    <section class="flex flex-col items-center gap-6 py-12">
      <div class="max-w-lg text-center bg-gray-50 border border-gray-200 rounded-xl p-8">
        <div class="text-5xl mb-4">📋</div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">
          Registered — no data published yet
        </h3>
        <p class="text-gray-600 mb-4">
          This city is registered on the SUM Open Data Platform but has not yet
          published KPI data with before and after measurements.
        </p>
        {livingLabData?.created_at && (
          <p class="text-sm text-gray-500">
            Registered on {new Date(livingLabData.created_at).toLocaleDateString("en-GB", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        )}
      </div>
    </section>
  )
}
```

**Key behaviour:**
- The map, transport modes, and measures sections still render (they may have data even if KPIs don't)
- Only the KPI section is replaced with the data-pending panel
- No empty charts are ever rendered
- The city page never returns a 404 (existing redirect logic is preserved)

### 3g. City page heading update

The heading already uses `displayLabType()` from Epic 3. No change needed — it correctly shows "SUM Living Lab" or "Contributing city".

---

## 4. T09 Architecture — Platform Counter Helper

### 4a. New file: `src/lib/utils/platformCounters.ts`

```typescript
import type { IKpiResultGroup } from "../../types/KPIs";
import type { ILivingLabPopulated } from "../../types/LivingLab";
import { getCityType, getCityDataStatus } from "./cityStatus";

export interface PlatformCounters {
  /** Number of the 9 SUM Horizon Europe project cities */
  sumLivingLabs: number;
  /** Number of non-SUM registered cities */
  contributingCities: number;
  /** Number of cities (any type) with before/after KPI data */
  citiesWithData: number;
  /** Total registered cities (sum of the above two type counts) */
  totalCities: number;
  /** Most recent KPI result updated_at across all labs, or null */
  lastDataUpdate: Date | null;
}

/**
 * Computes the three platform counter figures from a populated living labs array.
 *
 * Single source of truth for every page that displays city counts.
 * Consumed by: homepage, /data/measures, /data/kpis, impact analysis,
 * and future Epic 7 (trust strip), Epic 11 (coverage matrix).
 */
export function computePlatformCounters(
  livingLabs: ILivingLabPopulated[],
): PlatformCounters {
  let sumLivingLabs = 0;
  let contributingCities = 0;
  let citiesWithData = 0;
  let lastDataUpdate: Date | null = null;

  livingLabs.forEach((lab) => {
    const type = getCityType(Number(lab.id));
    if (type === "sum_living_lab") {
      sumLivingLabs++;
    } else {
      contributingCities++;
    }

    const dataStatus = getCityDataStatus(lab.kpi_results as IKpiResultGroup[] | undefined);
    if (dataStatus === "has_data") {
      citiesWithData++;
    }

    // Find the most recent updated_at across all KPI results for this lab
    (lab.kpi_results as IKpiResultGroup[] | undefined)?.forEach((group) => {
      group.results?.forEach((result) => {
        if (result.updated_at) {
          const resultDate = new Date(result.updated_at);
          if (!lastDataUpdate || resultDate > lastDataUpdate) {
            lastDataUpdate = resultDate;
          }
        }
      });
    });
  });

  return {
    sumLivingLabs,
    contributingCities,
    citiesWithData,
    totalCities: sumLivingLabs + contributingCities,
    lastDataUpdate,
  };
}
```

### 4b. Homepage counter changes

File: `src/pages/index.astro`

Replace the current `StatsSection` stats array with the counter helper output:

```astro
---
import { computePlatformCounters } from "../lib/utils/platformCounters";

const counters = computePlatformCounters(livingLabsData ?? []);
---

<StatsSection
  titleHighlight="SEAMLESS"
  title="Shared Urban Mobility"
  subtitle="The SUM Open Data Platform collects and delivers data and analytical tools..."
  stats={[
    { id: 1, name: "SUM Living Labs", value: String(counters.sumLivingLabs) },
    { id: 2, name: "Contributing cities", value: String(counters.contributingCities) },
    { id: 3, name: "Cities with before/after data", value: String(counters.citiesWithData) },
    {
      id: 4,
      name: "Measures implemented for Seamless Urban Shared Mobility",
      value: measures?.length.toString() ?? "0",
    },
    {
      id: 5,
      name: "Shared Mobility integrated",
      value: transportModes?.length.toString() ?? "0",
    },
    {
      id: 6,
      name: "Key Performance Indicators (KPIs) monitored",
      value: parentKpis?.length.toString() ?? "0",
    },
  ]}
/>
```

The ambiguous "Living labs" count (line 132 in current code) is replaced by three specific counts. The KPI/measures/transport mode counts remain unchanged.

If `counters.lastDataUpdate` is available, add it to the hero or a subtitle line:

```astro
{counters.lastDataUpdate && (
  <p class="text-sm text-gray-500 mt-2">
    Last data update: {counters.lastDataUpdate.toLocaleDateString("en-GB", {
      year: "numeric", month: "long", day: "numeric",
    })}
  </p>
)}
```

### 4c. Measures page counter changes

File: `src/pages/data/measures.astro`

Replace the "Living Labs implementing measures" feature (line 37) with a labeled count:

```astro
---
import { computePlatformCounters } from "../../lib/utils/platformCounters";
import type { ILivingLabPopulated } from "../../types";

const livingLabsData = (await api.getLivingLabs()) as ILivingLabPopulated[];
const counters = computePlatformCounters(livingLabsData ?? []);
---

// In measuresFeatures:
{
  title: uniqueLabsIds.size,
  description: `Cities implementing measures (${counters.sumLivingLabs} SUM Living Labs, ${counters.contributingCities} Contributing cities)`,
  icon: `...`,
},
```

### 4d. KPIs page counter changes

File: `src/pages/data/kpis.astro`

The KPIs page currently shows lab counts in the dashboard filter/legend. The existing `livingLabsForDashboard` array is used for the filter panel. Add the counter helper at SSR time and pass figures where needed:

```astro
---
import { computePlatformCounters } from "../../lib/utils/platformCounters";

const counters = computePlatformCounters(filteredLivingLabs ?? []);
---
```

Any header or intro text that says "Living Labs" should be replaced with the specific count labels. The exact locations depend on what text currently exists on the page — the principle is: no public page displays a city count without saying which of the three categories it is.

### 4e. Impact analysis intro text

File: `src/pages/tools/impact_analysis.astro`

The info card at line 285-289 currently shows:

```astro
<InfoCard
  title={livingLabsMap.size > 0 ? `${livingLabsMap.size} Living Labs` : "Living Labs"}
  description="Cities participating in the SUM Open Data Platform..."
/>
```

Replace with:

```astro
---
import { computePlatformCounters } from "../../lib/utils/platformCounters";

// livingLabsResponse is already fetched above
const counters = computePlatformCounters(livingLabsResponse ?? []);
---

<InfoCard
  title={`${counters.citiesWithData} cities with data`}
  description={`${counters.sumLivingLabs} SUM Living Labs and ${counters.contributingCities} Contributing cities participate in the SUM Open Data Platform. ${counters.citiesWithData} have published before/after KPI data used in this analysis.`}
  showIcon={false}
  textAlign="center"
/>
```

---

## 5. Full File Change List

| File | Status | Task | What changes |
|------|--------|------|--------------|
| `src/lib/utils/cityStatus.ts` | **new** | T06 | `CityType`, `CityDataStatus`, `CityStatus`, `getCityType()`, `getCityDataStatus()`, `getFullCityStatus()`, `MAP_LEGEND_ENTRIES` |
| `src/components/react/MapLegend.tsx` | **new** | T06 | Always-visible map legend component |
| `src/lib/utils/platformCounters.ts` | **new** | T09 | `PlatformCounters`, `computePlatformCounters()` |
| `src/components/react/LivingLabsMapSection.tsx` | **modify** | T06 | Replace `status` with `cityType`/`dataStatus` on local type; add legend overlay; update marker colours; update list panel with type+status badges; update heading |
| `src/pages/index.astro` | **modify** | T06, T09 | Compute city status per lab (T06); replace stats array with counter helper output (T09); add `lastDataUpdate` |
| `src/pages/living-lab-city/[labId].astro` | **modify** | T06 | Add data-pending empty state panel when no KPI data; keep map/measures/transport sections |
| `src/pages/data/measures.astro` | **modify** | T09 | Replace "Living Labs implementing measures" with labeled city counts |
| `src/pages/data/kpis.astro` | **modify** | T09 | Replace any ambiguous lab count with labeled figures from counter helper |
| `src/pages/tools/impact_analysis.astro` | **modify** | T09 | Replace "Living Labs" info card with specific counter labels |
| `src/components/react/MapViewer.tsx` | **modify** | T06 | Accept optional `color` prop on `MarkerData` for per-marker colouring (if not already supported) |

---

## 6. Implementation Order

### Phase 1 — T06 (implement first)

1. **Create `src/lib/utils/cityStatus.ts`** — utility functions, no dependencies beyond types and `labels.ts`
2. **Create `src/components/react/MapLegend.tsx`** — depends on step 1 for `MAP_LEGEND_ENTRIES`
3. **Modify `src/pages/index.astro`** — compute `cityType` and `dataStatus` per lab; pass to `LivingLabsMapSection`
4. **Modify `src/components/react/LivingLabsMapSection.tsx`** — update local `LivingLab` type; add legend overlay; update marker colours; update list panel; update heading text
5. **Check `MapViewer`** — verify it supports per-marker colour. If not, add an optional `color` field to `MarkerData` and use it in the rendering logic
6. **Modify `src/pages/living-lab-city/[labId].astro`** — add data-pending empty state panel
7. **Manual smoke-test:**
   - Verify map legend shows all four combinations
   - Verify city list shows type + status in text
   - Navigate to a city with zero KPI data — confirm data-pending panel, no empty charts
   - Navigate to a city with data — confirm normal rendering unchanged
   - No city page returns 404

### Phase 2 — T09 (after T06 is merged and green)

1. **Create `src/lib/utils/platformCounters.ts`** — depends on `cityStatus.ts` from T06
2. **Modify `src/pages/index.astro`** — replace `StatsSection` stats with counter helper output; add `lastDataUpdate`
3. **Modify `src/pages/data/measures.astro`** — replace lab count description
4. **Modify `src/pages/data/kpis.astro`** — replace any ambiguous lab count text
5. **Modify `src/pages/tools/impact_analysis.astro`** — replace "Living Labs" info card
6. **Manual smoke-test:**
   - Every page that displays a city count says which category
   - No hard-coded numbers remain (search for `"9"`, `"11"`, `"Living Labs"` without qualifier)
   - Counter figures are consistent across all pages
   - `lastDataUpdate` date appears and is plausible

---

## 7. Open Questions

| # | Question | Owner | Blocks |
|---|----------|-------|--------|
| OQ-1 | Confirm the "data available" condition: is `result_before AND result_after both non-null` correct? Or should any non-empty `results[]` array count? | WP1 / data | T06 `getCityDataStatus()` logic |
| OQ-2 | For the map, should marker **shape** differ (circle vs diamond), or should a different visual encoding be used (e.g., pin vs circle)? | UX / product | T06 `MapViewer` + `MapLegend` symbol styling |
| OQ-3 | Should the data-pending panel include a CTA like "Contribute data" or "Contact the SUM team"? | Product | T06 empty state panel content |
| OQ-4 | The `StatsSection` component currently renders exactly 4 stat items in a 2x2 or 1x4 grid. With T09 we have 6 items. Does the layout need to adapt to a 3x2 or 2x3 grid? | UX / product | T09 homepage `StatsSection` layout |
| OQ-5 | Should the "last data update" appear per page (using only the data visible on that page), or be a platform-wide value (most recent across all labs)? | Product | T09 `lastDataUpdate` scope |
| OQ-6 | The measures page currently fetches only measures (no living labs). T09 needs living labs data to compute counters. Is the additional API call acceptable, or should counters be passed from a layout-level fetch? | Architect | T09 `measures.astro` performance |

---

## 8. Out of Scope

The following are explicitly excluded from this epic:

- **Deleting any city or page.** Per G2, pages may be split, retitled, or relabelled, but not removed. Cities with no data get the pending panel, not a 404.
- **Database schema changes.** `CityType` and `CityDataStatus` are derived from existing data. No new fields, no migrations.
- **City administration pages.** Lab-admin routes (`/lab-admin/*`) are out of scope per G4.
- **Counter caching or real-time updates.** Counters are computed at SSR time per page load. No client-side polling, no cache layer. This matches the platform's existing SSR-first pattern.
- **Trust strip component.** Epic 7 (T11) builds the homepage trust strip that consumes `computePlatformCounters()`. The helper is designed for that, but the component is not in scope here.
- **Coverage matrix.** Epic 11 (T19) builds the data console with the full coverage matrix. It will import `computePlatformCounters()` and `getCityDataStatus()`. Not in scope here.
- **Changes to the `MapViewer` library internals.** If the map library (Leaflet via `react-leaflet`) does not natively support per-marker shapes, T06 uses colour + CSS styling on the marker container. A full custom marker layer is deferred unless essential.

---

## 9. Downstream Dependencies

| Consumer | What it uses | When |
|---|---|---|
| Epic 7 / T11 (Landing homepage trust strip) | `computePlatformCounters()` for the 6 labelled figures | Phase 3 |
| Epic 7 / T11 (Landing homepage) | `getCityDataStatus()` for map teaser | Phase 3 |
| Epic 9 / T14 (Insights city profile) | `getFullCityStatus()` for city type badge and data-pending handling | Phase 4 |
| Epic 11 / T19 (Data console, coverage matrix) | `computePlatformCounters()` for status tiles; `getCityDataStatus()` per cell | Phase 4 |
| Epic 12 / T21 (Methods & quality) | Counter definitions documented on the quality page | Phase 3–4 |
