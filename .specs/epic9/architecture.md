# Architecture — Epic 9: Insights City Experience

**Tasks:** T14 (L) → T17 (M) — sequential
**Wave:** C | **Effort:** L + M | **Stack:** Astro 5 SSR + React 19 islands
**Dependencies:** After Epics 2, 4, 5, 6 (T02 implementation record split, T03 data-sufficiency rule, T06 city status, T07 plain-language readings, T10 experience mechanism)

---

## 1. Summary

Epic 9 builds the Insights city profile — the decision-maker view of a city. The existing Data city page (`/living-lab-city/[labId]`) is **unchanged** (rule G3). Counterpart routing between the two views is already wired in the experience registry.

**T14 — Insights city profile at `/insights/city/[labId]`.** A curated four-section page: Overview, What they did, Results at a glance, Lessons & documents. Shows outcome KPIs only (no implementation-record indicators, no single-estimation charts). Cities without data show the T06 "Registered — no data published yet" panel. Every figure carries its T07 plain-language reading.

**T17 — Lessons & documents from Resources library.** Uses existing resource→Living-Lab / measure / KPI-definition associations (D1.4 §4.3.8) from the `items` table. No new field, no migration, no schema change. Renders on the Insights city profile as a "Lessons & documents" section, and beside relevant charts where the association is to a KPI. Absence renders as nothing, not an empty section.

---

## 2. Design Decisions with Rationale

### 2.1 Insights city profile replaces the placeholder — does not modify the Data city page

The placeholder at `/insights/city/[labId].astro` already exists and has counterpart routing wired to `/living-lab-city/[labId]`. T14 replaces the placeholder content with the full curated profile. The existing Data city page (`/living-lab-city/[labId].astro`) is untouched.

### 2.2 Outcome KPIs only — implementation record excluded

The epic spec is explicit: "Contains no implementation-record indicator and no single-estimation chart." The implementation record KPIs (identified by `IMPLEMENTATION_KPIS` in `src/config/implementationKpis.ts`, from T02) are filtered out. The `kpiSufficiency` utility (from T03, `src/lib/utils/kpiSufficiency.ts`) gates rendering — only KPIs with ≥2 validated estimations render as charts.

### 2.3 Server-side data fetching, React islands for charts

Following the Astro SSR + React islands pattern:
- Astro page fetches lab data, KPI results, measures, and resources via `ApiClient`
- Data is filtered and shaped in the Astro frontmatter
- React chart components receive serialized props — no client-side fetching
- `LivingLabKPIsView` is NOT reused directly (it includes implementation records); instead, a new `InsightsCityKPIs` component renders only outcome KPIs

### 2.4 City status from `getFullCityStatus()` determines empty state

The existing `getFullCityStatus()` utility (`src/lib/utils/cityStatus.ts`) classifies cities. Cities with `status === "data-pending"` show the T06 panel ("Registered — no data published yet") with registration date. No empty charts, no empty sections.

### 2.5 Resources come from existing `items` associations — no schema change

The `items` table has optional foreign keys: `living_lab_id`, `project_id` (measures), and `kpi_definition_id`. These associations (D1.4 §4.3.8) are the data source for T17. The query uses `ItemsRepository` to find items where `category.type === "RESOURCES"` and the association matches the current city, its measures, or its KPIs.

### 2.6 Plain-language readings from `kpiReadings` config

The T07 readings are stored in `src/config/kpiReadings.ts` (or `kpiReadings.json`). Each KPI definition has a `reading` string (e.g. "higher means more trips shifted away from private car"), a `goodDirection`, and display metadata. The Insights city profile renders these on every chart.

---

## 3. T14 Architecture — Insights City Profile

### 3a. Modified file: `src/pages/insights/city/[labId].astro`

Replace the current placeholder with the full curated profile:

```astro
---
import Layout from "../../../layouts/Layout.astro";
import { InsightsCityOverview } from "../../../components/react/Insights/InsightsCityOverview";
import { InsightsCityMeasures } from "../../../components/react/Insights/InsightsCityMeasures";
import { InsightsCityKPIs } from "../../../components/react/Insights/InsightsCityKPIs";
import { InsightsCityLessons } from "../../../components/react/Insights/InsightsCityLessons";
import { CityDataPending } from "../../../components/react/Insights/CityDataPending";
import ApiClient from "../../../lib/api-client/ApiClient";
import { getFullCityStatus } from "../../../lib/utils/cityStatus";
import { IMPLEMENTATION_KPIS } from "../../../config/implementationKpis";
import { KPI_READINGS } from "../../../config/kpiReadings";
import { isChartable } from "../../../lib/utils/kpiSufficiency";
import { getUrl } from "../../../lib/helpers";

const { labId } = Astro.params;
const api = new ApiClient(Astro.request);

const lab = await api.getLivingLab(Number(labId));
if (!lab) return Astro.redirect("/insights");

const cityStatus = getFullCityStatus(lab);
const hasData = cityStatus.status !== "data-pending";

// Fetch data only if city has published data
let outcomeKpis = [];
let measures = [];
let resources = [];

if (hasData) {
  const allKpiResults = lab.kpi_results ?? [];
  
  // Filter: exclude implementation-record KPIs (T02)
  outcomeKpis = allKpiResults.filter(
    kr => !IMPLEMENTATION_KPIS.includes(kr.kpi_definition_id)
  );
  
  // Filter: only chartable KPIs (T03 — ≥2 validated estimations)
  const chartableKpis = outcomeKpis.filter(kr => isChartable(kr));
  
  measures = lab.projects ?? [];
  
  // Fetch resources associated with this lab (T17)
  resources = await api.getResourcesForLab(Number(labId));
}
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Insights", href: "/insights" },
    { label: "Cities", href: "/insights/cities" },
    { label: lab.name },
  ]}
  backHref="/insights/cities"
>
  {!hasData ? (
    <CityDataPending
      cityName={lab.name}
      registrationDate={cityStatus.registrationDate}
      counterpartHref={getUrl(`/living-lab-city/${labId}`)}
      client:load
    />
  ) : (
    <>
      <!-- Section 1: Overview -->
      <InsightsCityOverview
        lab={lab}
        headlineResult={computeHeadlineResult(outcomeKpis)}
        lastUpdated={computeLastUpdated(outcomeKpis)}
        client:load
      />

      <!-- Section 2: What they did -->
      <InsightsCityMeasures
        measures={measures}
        client:load
      />

      <!-- Section 3: Results at a glance -->
      <InsightsCityKPIs
        kpiResults={chartableKpis}
        kpiReadings={KPI_READINGS}
        client:load
      />

      <!-- Section 4: Lessons & documents (T17) -->
      {resources.length > 0 && (
        <InsightsCityLessons
          resources={resources}
          client:load
        />
      )}

      <!-- Counterpart link to Data city page -->
      <section class="py-8 px-4 text-center border-t border-gray-200">
        <p class="text-gray-600 mb-3">
          Explore the full dataset and all KPI series for {lab.name}.
        </p>
        <a href={getUrl(`/living-lab-city/${labId}`)}
           class="text-primary font-medium hover:underline">
          Open in Data & scientific tools →
        </a>
      </section>
    </>
  )}
</Layout>
```

### 3b. Section 1 — Overview component

`src/components/react/Insights/InsightsCityOverview.tsx`

```typescript
interface InsightsCityOverviewProps {
  lab: { name: string; country: string; population?: number; area?: number };
  headlineResult: string;
  lastUpdated: string;
}

export function InsightsCityOverview({ lab, headlineResult, lastUpdated }: InsightsCityOverviewProps) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lab.name}</h1>
        <p className="text-sm text-gray-500 mb-6">{lab.country}</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">City context</h2>
            <dl className="space-y-2 text-sm">
              {lab.population && (
                <div><dt className="text-gray-500 inline">Population:</dt>{" "}
                <dd className="inline text-gray-900">{lab.population.toLocaleString()}</dd></div>
              )}
              {lab.area && (
                <div><dt className="text-gray-500 inline">Area:</dt>{" "}
                <dd className="inline text-gray-900">{lab.area} km²</dd></div>
              )}
            </dl>
          </div>
          <div className="bg-primary/5 rounded-lg border border-primary/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Headline result</h2>
            <p className="text-gray-700">{headlineResult}</p>
            <p className="text-xs text-gray-400 mt-3">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 3c. Section 2 — What they did component

`src/components/react/Insights/InsightsCityMeasures.tsx`

```typescript
interface Measure {
  id: number;
  name: string;
  type: "PUSH" | "PULL" | "OTHER";
  description?: string;
  start_at?: string;
}

interface InsightsCityMeasuresProps {
  measures: Measure[];
}

export function InsightsCityMeasures({ measures }: InsightsCityMeasuresProps) {
  const pushMeasures = measures.filter(m => m.type === "PUSH");
  const pullMeasures = measures.filter(m => m.type === "PULL");

  return (
    <section className="bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What they did</h2>
        {pushMeasures.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Push measures</h3>
            <div className="space-y-3">
              {pushMeasures.map(m => (
                <MeasureItem key={m.id} measure={m} />
              ))}
            </div>
          </div>
        )}
        {pullMeasures.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Pull measures</h3>
            <div className="space-y-3">
              {pullMeasures.map(m => (
                <MeasureItem key={m.id} measure={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MeasureItem({ measure }: { measure: Measure }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-medium text-gray-900">{measure.name}</h4>
      {measure.description && (
        <p className="text-sm text-gray-600 mt-1">{measure.description}</p>
      )}
      {measure.start_at && (
        <p className="text-xs text-gray-400 mt-2">
          Started: {new Date(measure.start_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
```

### 3d. Section 3 — Results at a glance component

`src/components/react/Insights/InsightsCityKPIs.tsx`

Renders outcome KPIs with T07 plain-language readings. Does NOT reuse `LivingLabKPIsView` (which includes implementation records). Instead, renders a simplified grid of KPI cards, each with:
- KPI name and plain-language reading (from `KPI_READINGS`)
- Chart (reusing existing D3 chart components for time series)
- Unit, reporting period, direction-of-good indicator
- Last-updated date

```typescript
interface KpiResult {
  kpi_definition_id: number;
  kpi_name: string;
  values: { date: string; value: number }[];
}

interface KpiReading {
  reading: string;
  goodDirection: "up" | "down" | "neutral" | null;
  unit: string;
}

interface InsightsCityKPIsProps {
  kpiResults: KpiResult[];
  kpiReadings: Record<number, KpiReading>;
}
```

Each card renders the reading below the chart title and shows the direction-of-good indicator where applicable. If a KPI has no meaningful "good" direction, the card states "Direction depends on context" instead of omitting it.

### 3e. Data-pending component

`src/components/react/Insights/CityDataPending.tsx`

```typescript
interface CityDataPendingProps {
  cityName: string;
  registrationDate: string;
  counterpartHref: string;
}

export function CityDataPending({ cityName, registrationDate, counterpartHref }: CityDataPendingProps) {
  return (
    <section className="py-16 px-4 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{cityName}</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 font-medium mb-2">
            Registered — no data published yet
          </p>
          <p className="text-sm text-gray-500">
            Registered on {registrationDate}. Data will appear here once the city
            publishes its first KPI measurements.
          </p>
        </div>
        <a href={counterpartHref} className="text-primary text-sm hover:underline">
          View city record in Data & scientific tools →
        </a>
      </div>
    </section>
  );
}
```

---

## 4. T17 Architecture — Lessons & Documents

### 4a. Data source: existing `items` associations

The `items` table has:
- `living_lab_id` — associates a resource with a city
- `project_id` — associates a resource with a measure
- `kpi_definition_id` — associates a resource with a KPI

Query resources for the Insights city profile:

```typescript
// Conceptual query — implemented via ItemsRepository or ApiClient
const resources = await api.getItems({
  categoryType: "RESOURCES",
  labId: Number(labId),  // items linked to this city
});

// Additionally, find resources linked to the city's measures or KPIs
const measureIds = measures.map(m => m.id);
const kpiIds = outcomeKpis.map(k => k.kpi_definition_id);
const measureResources = await api.getItems({
  categoryType: "RESOURCES",
  projectIds: measureIds,
});
const kpiResources = await api.getItems({
  categoryType: "RESOURCES",
  kpiDefinitionIds: kpiIds,
});
```

If `ApiClient` does not yet support filtering by these associations, a new method `getResourcesForLab(labId)` should be added that queries items matching `living_lab_id = labId` OR `project_id IN (lab's measure IDs)` OR `kpi_definition_id IN (lab's KPI IDs)`.

### 4b. Lessons & documents section component

`src/components/react/Insights/InsightsCityLessons.tsx`

```typescript
interface Resource {
  id: number;
  title: string;
  description: string;
  url?: string;
  date?: string;
  associationType: "city" | "measure" | "kpi";
  associationLabel: string;
}

interface InsightsCityLessonsProps {
  resources: Resource[];
}

export function InsightsCityLessons({ resources }: InsightsCityLessonsProps) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Lessons & documents</h2>
        <div className="space-y-4">
          {resources.map(r => (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{r.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Related to: {r.associationLabel}
                    {r.date && ` · ${r.date}`}
                  </p>
                </div>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                     className="text-primary text-sm hover:underline whitespace-nowrap ml-4">
                    View →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 4c. Inline chart annotations for KPI-linked resources

When a resource is associated with a specific KPI definition (`kpi_definition_id`), it also appears as an annotation beside the relevant chart in Section 3 (Results at a glance). The `InsightsCityKPIs` component receives the KPI-linked resources and renders a small "Related documents" link beneath the chart.

```typescript
// In InsightsCityKPIs, for each KPI card:
const kpiResources = resources.filter(
  r => r.associationType === "kpi" && r.kpiDefinitionId === kpi.kpi_definition_id
);
// If kpiResources.length > 0, render a "Lessons" link beneath the chart
```

### 4d. Absence renders as nothing

Per the epic spec: "Absence renders as nothing, not an empty section." If `resources.length === 0`, the Lessons & documents section is not rendered at all. If a KPI has no associated resources, no annotation appears.

---

## 5. File Change Summary

| File | Status | Task | What changes |
|---|---|---|---|
| `src/pages/insights/city/[labId].astro` | **Modify** | T14 | Replace placeholder with full curated city profile |
| `src/components/react/Insights/InsightsCityOverview.tsx` | **New** | T14 | City overview section (context, headline, last updated) |
| `src/components/react/Insights/InsightsCityMeasures.tsx` | **New** | T14 | Push/pull measures section |
| `src/components/react/Insights/InsightsCityKPIs.tsx` | **New** | T14 | Outcome KPIs with T07 readings (no implementation record) |
| `src/components/react/Insights/CityDataPending.tsx` | **New** | T14 | T06 data-pending empty state |
| `src/components/react/Insights/InsightsCityLessons.tsx` | **New** | T17 | Lessons & documents section |
| `src/components/react/Insights/index.ts` | **Modify** | T14 | Add new component exports |
| `src/lib/api-client/ApiClient.ts` | **Modify** | T17 | Add `getResourcesForLab(labId)` method |

Total: **5 new files**, **3 modified files**. One PR covering both T14 and T17.

---

## 6. Implementation Order

### T14 — Insights city profile (implement first)

1. **Create `InsightsCityOverview`** — city context + headline result card
2. **Create `InsightsCityMeasures`** — push/pull measures list
3. **Create `InsightsCityKPIs`** — outcome KPI charts with T07 readings, filtering out implementation-record KPIs (T02) and single-estimation KPIs (T03)
4. **Create `CityDataPending`** — T06 empty-state panel
5. **Replace placeholder in `src/pages/insights/city/[labId].astro`** — compose sections, fetch data, apply filters
6. **Verify** — check cities with data, without data, counterpart link in both directions

**Verification checkpoint:** City profile shows four sections for cities with data. Cities without data show the T06 panel. No implementation-record indicator, no single-estimation chart. Every figure carries its T07 reading.

### T17 — Lessons & documents (implement second, needs T14)

1. **Add `getResourcesForLab(labId)` to `ApiClient`** — query items linked to this lab's ID, measures, and KPIs
2. **Create `InsightsCityLessons`** — lessons section component
3. **Wire resources into the city profile page** — conditionally render Section 4
4. **Add KPI chart annotations** — show resource links beside relevant charts
5. **Verify** — check cities with resources, without resources, KPI-linked resources

---

## 7. Testing Strategy

### Manual verification (per PR checklist in epic.md)

| Check | How |
|---|---|
| Profile has no implementation-record indicator | Search for T02 indicator names on the page |
| No single-estimation chart | Verify all charts have ≥2 data points |
| Every figure carries T07 reading | Inspect each KPI card for reading text |
| Counterpart link resolves to Data city page | Click cross-link, verify same city in Data experience |
| Lessons appear from existing associations | Find a city with linked resources, verify they display |
| No empty block for absent resources | Check a city with no linked resources — section absent |
| T06 panel for cities without data | Navigate to a data-pending city |

### Unit tests

```typescript
// src/components/react/Insights/InsightsCityKPIs.test.tsx
describe("InsightsCityKPIs", () => {
  it("renders only outcome KPIs (excludes implementation record)", () => { ... });
  it("renders only chartable KPIs (≥2 estimations)", () => { ... });
  it("displays T07 reading on each card", () => { ... });
  it("shows good-direction indicator where defined", () => { ... });
});

// src/components/react/Insights/InsightsCityLessons.test.tsx
describe("InsightsCityLessons", () => {
  it("renders resource cards with title and description", () => { ... });
  it("shows association type label", () => { ... });
});
```

---

## 8. Open Questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| OQ-1 | What constitutes a "headline result" for the Overview section? Is it the strongest KPI change, the most-improved metric, or an editorial summary? | Product | T14 overview section |
| OQ-2 | Should "What they did" show all measures or only those with measured outcomes? | Product | T14 measures section |
| OQ-3 | Who authors the first set of lesson notes for resources? | WP1 | T17 content availability |
| OQ-4 | Should KPI chart annotations for resources show a tooltip or a full inline card? | UX | T17 chart annotations |
| OQ-5 | City links from goal pages (Epic 8) — should they point to `/insights/city/[labId]` now that this page exists? | Product | Cross-epic integration |

---

## 9. Out of Scope

- **Modifying the Data city page** (`/living-lab-city/[labId].astro`) — unchanged per rule G3
- **New database fields or migrations** — T17 uses existing `items` associations
- **City catalogue / listing page** — a `/insights/cities` listing is a separate future task
- **Implementation-record rendering** — excluded from the Insights experience by T02
- **KPI chart interactivity** — Insights charts are read-only (no editing, no filtering)
- **Resource authoring** — Dev creates rendering; content is authored by WP1

---

## 10. Downstream Impact

| Epic | How it interacts |
|---|---|
| 8 (Insights Goals) | Goal page city links point to `/insights/city/[labId]` |
| 10 (Guided Tool) | Guided results may link to city profiles |
| 11 (Data Console) | Coverage matrix cities link to Data city page, not Insights |
| 12 (Methods) | City profile may link to data quality page for curation context |
