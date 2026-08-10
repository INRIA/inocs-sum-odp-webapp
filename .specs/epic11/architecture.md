# Architecture — Epic 11: Data Console & Downloads

**Tasks:** T19 (L), T20 (M) — can run in parallel
**Wave:** D | **Effort:** L + M | **Stack:** Astro 5 SSR + React 19 islands
**Dependencies:** After Epics 1, 5, 6 (T19 needs T03 data-sufficiency, T09 platform counters, T10 experience mechanism; T20 needs T01 CSV fix, T10)

---

## 1. Summary

Epic 11 adds two new pages for the Data experience: a data homepage/console with a coverage matrix and a downloads documentation page.

**T19 — Data homepage & coverage matrix.** A console-style page at `/data` with status tiles, a coverage matrix (cities × KPI groups × periods), quick links to existing dashboards and tools, and a cross-link to the Insights experience. The matrix uses three states per cell (before & after / baseline only / none) shown in both text and colour with a visible key.

**T20 — Downloads page.** A page at `/data/downloads` listing every downloadable file offered anywhere on the site, with content description, schema, coverage, period, and licence. Each file's description states what it does NOT contain.

---

## 2. Design Decisions with Rationale

### 2.1 Data homepage is a console, not a brochure

The epic spec is explicit: "A console rather than a brochure." The page leads with at-a-glance status tiles and the coverage matrix. It is a dashboard for researchers and data-literate users, not a marketing page.

### 2.2 Coverage matrix is server-side computed, client-side rendered

The matrix requires cross-referencing all labs, KPI definitions, and KPI results. This data is fetched server-side in the Astro frontmatter via `ApiClient`, then shaped into a matrix structure and passed to a React island for interactive rendering (column sorting, hover states, responsive scrolling).

### 2.3 Three cell states derive from the T03 data-sufficiency rule

The `isChartable()` utility from `src/lib/utils/kpiSufficiency.ts` determines whether a lab/KPI combination has before & after data (≥2 estimations) or baseline only (1 estimation). The three states are:

| State | Condition | Visual |
|---|---|---|
| Before & after | ≥2 validated estimations | Filled circle + text label |
| Baseline only | Exactly 1 validated estimation | Half circle + text label |
| None | 0 estimations | Empty cell + text label "—" |

Colour is supplementary — meaning is always carried by the text label and icon. The key is always visible, not hidden behind a tooltip.

### 2.4 Status tiles reuse `computePlatformCounters()`

The status tiles use the same `computePlatformCounters()` utility from `src/lib/utils/platformCounters.ts` that powers the trust strip (Epic 7/T11). Additional tiles for "Model quality", "Last model run", and "KPI definitions" are computed from job run and KPI definition data.

### 2.5 Figures agree with T09 counters by construction

Both the coverage matrix and the status tiles use `computePlatformCounters()` and `isChartable()`. A cell marked "chartable" in the matrix uses the same rule as T03 everywhere else — agreement is by construction, not reconciliation.

### 2.6 Downloads page is a static catalogue with file metadata

The downloads page is not a file browser. It is a structured catalogue listing each download with its metadata. The actual download buttons (CSV) continue to work from their existing locations — the downloads page provides discoverability and documentation, not a new download mechanism.

### 2.7 Both pages belong to the Data experience

```typescript
{ pattern: "/data", experience: "data" },       // already exists for /data/kpis etc.
{ pattern: "/data/downloads", experience: "data" },
```

---

## 3. T19 Architecture — Data Homepage & Coverage Matrix

### 3a. New file: `src/pages/data/index.astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import { CoverageMatrix } from "../../components/react/DataConsole/CoverageMatrix";
import { StatusTiles } from "../../components/react/DataConsole/StatusTiles";
import { QuickLinks } from "../../components/react/DataConsole/QuickLinks";
import ApiClient from "../../lib/api-client/ApiClient";
import { computePlatformCounters } from "../../lib/utils/platformCounters";
import { buildCoverageMatrix } from "../../lib/utils/coverageMatrix";
import { getUrl } from "../../lib/helpers";

const api = new ApiClient(Astro.request);

const labs = await api.getLivingLabs();
const kpiDefinitions = await api.getKpiDefinitions();
const kpiResults = await api.getAllKpiResults();
const latestJobRun = await api.getLatestJobRun("kpi_measures_analysis");

const platformCounters = computePlatformCounters(labs);
const matrix = buildCoverageMatrix(labs, kpiDefinitions, kpiResults);

const statusTiles = [
  { label: "Total observations", value: kpiResults.length },
  { label: "Cities with before & after", value: platformCounters.citiesWithData },
  { label: "Contributing cities", value: platformCounters.contributingCities },
  { label: "KPI definitions", value: kpiDefinitions.length },
  { label: "Last model run", value: latestJobRun?.completed_at ?? "N/A" },
  { label: "Model status", value: latestJobRun?.status ?? "N/A" },
];
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Data & scientific tools" },
  ]}
  backHref="/"
>
  <!-- Status tiles -->
  <section class="py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">
        Data & scientific tools
      </h1>
      <StatusTiles tiles={statusTiles} client:load />
    </div>
  </section>

  <!-- Coverage matrix -->
  <section class="py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-xl font-bold text-gray-900 mb-4">
        Data coverage matrix
      </h2>
      <p class="text-sm text-gray-600 mb-4">
        Cities × KPI groups × periods. Each cell shows whether a city has
        before & after data, baseline only, or no data for that KPI group.
      </p>
      <CoverageMatrix matrix={matrix} client:load />
    </div>
  </section>

  <!-- Quick links -->
  <section class="py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-xl font-bold text-gray-900 mb-4">
        Dashboards & tools
      </h2>
      <QuickLinks client:load />
    </div>
  </section>

  <!-- Cross-link to Insights -->
  <section class="py-8 px-4 text-center border-t border-gray-200">
    <p class="text-gray-600 mb-3">
      Looking for curated insights and evidence-based recommendations?
    </p>
    <a href={getUrl("/insights/goals")} class="text-primary font-medium hover:underline">
      Switch to Insights for decision-makers →
    </a>
  </section>
</Layout>
```

### 3b. Coverage matrix utility

`src/lib/utils/coverageMatrix.ts`

```typescript
export type CellState = "before-after" | "baseline-only" | "none";

export interface MatrixCell {
  labId: number;
  kpiGroupId: string;
  state: CellState;
  label: string;  // always text — "Before & after", "Baseline only", "—"
}

export interface CoverageMatrixData {
  labs: { id: number; name: string }[];
  kpiGroups: { id: string; name: string }[];
  cells: MatrixCell[];
}

export function buildCoverageMatrix(
  labs: ILivingLab[],
  kpiDefinitions: IKpi[],
  kpiResults: IKpiResult[]
): CoverageMatrixData {
  // Group KPI definitions by their KPI group (category)
  // For each lab × KPI group combination, count estimations
  // Apply the same rule as isChartable (T03):
  //   ≥2 validated estimations → "before-after"
  //   exactly 1 → "baseline-only"
  //   0 → "none"

  const kpiGroups = extractKpiGroups(kpiDefinitions);
  const cells: MatrixCell[] = [];

  for (const lab of labs) {
    for (const group of kpiGroups) {
      const groupKpiIds = kpiDefinitions
        .filter(k => k.categoryId === group.id)
        .map(k => k.id);

      const results = kpiResults.filter(
        r => r.living_lab_id === lab.id && groupKpiIds.includes(r.kpi_definition_id)
      );

      const validatedCount = results.filter(r => r.is_validated).length;
      let state: CellState;
      let label: string;

      if (validatedCount >= 2) {
        state = "before-after";
        label = "Before & after";
      } else if (validatedCount === 1) {
        state = "baseline-only";
        label = "Baseline only";
      } else {
        state = "none";
        label = "—";
      }

      cells.push({ labId: lab.id, kpiGroupId: group.id, state, label });
    }
  }

  return { labs: labs.map(l => ({ id: l.id, name: l.name })), kpiGroups, cells };
}
```

### 3c. CoverageMatrix component

`src/components/react/DataConsole/CoverageMatrix.tsx`

A table/grid component rendering the matrix with:
- Labs as rows, KPI groups as columns
- Each cell shows icon + text label (not colour alone)
- A visible key/legend above the matrix explaining the three states
- Horizontal scrolling for responsive display on narrow screens
- Optional column sorting (alphabetically or by data coverage)

```typescript
interface CoverageMatrixProps {
  matrix: CoverageMatrixData;
}

const STATE_STYLES: Record<CellState, { bg: string; icon: string }> = {
  "before-after": { bg: "bg-green-100", icon: "●" },
  "baseline-only": { bg: "bg-amber-50", icon: "◐" },
  "none": { bg: "bg-gray-50", icon: "" },
};
```

### 3d. StatusTiles component

`src/components/react/DataConsole/StatusTiles.tsx`

```typescript
interface StatusTile {
  label: string;
  value: string | number;
}

export function StatusTiles({ tiles }: { tiles: StatusTile[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {tiles.map(tile => (
        <div key={tile.label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-primary">{tile.value}</p>
          <p className="text-xs text-gray-500 mt-1">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3e. QuickLinks component

`src/components/react/DataConsole/QuickLinks.tsx`

Grid of cards linking to every existing dashboard and tool:

```typescript
const QUICK_LINKS = [
  { label: "KPI dashboard", href: "/data/kpis", description: "Explore KPI data across all cities and time periods" },
  { label: "Modal split", href: "/data/modal-split", description: "Transport mode share data across cities" },
  { label: "Measures", href: "/data/measures", description: "Browse policy measures implemented by cities" },
  { label: "Impact analysis", href: "/tools/impact_analysis", description: "Statistical associations between measures and KPI changes" },
  { label: "Decision tool (MCDA)", href: "/tools/mcda_analysis/", description: "Multi-criteria analysis for comparing mobility measures" },
  { label: "Resources", href: "/tools/resources", description: "Models, tools and resources for integrated mobility planning" },
  { label: "Downloads", href: "/data/downloads", description: "Download datasets, schemas, and documentation" },
  { label: "Methods & quality", href: "/methods/evaluation-framework", description: "Methodology, data quality, and glossary" },
];
```

---

## 4. T20 Architecture — Downloads Page

### 4a. New file: `src/pages/data/downloads.astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import { DownloadCatalogue } from "../../components/react/DataConsole/DownloadCatalogue";
import ApiClient from "../../lib/api-client/ApiClient";

const api = new ApiClient(Astro.request);
const kpiDefinitions = await api.getKpiDefinitions();
const labs = await api.getLivingLabs();

// Build the download catalogue from known downloadable files
const downloads = buildDownloadCatalogue(kpiDefinitions, labs);
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Data & scientific tools", href: "/data" },
    { label: "Downloads" },
  ]}
  backHref="/data"
>
  <section class="py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-3">Downloads</h1>
      <p class="text-lg text-gray-600 mb-8">
        Every downloadable dataset on the platform, with its content description,
        schema, and coverage.
      </p>
      <DownloadCatalogue downloads={downloads} client:load />
    </div>
  </section>
</Layout>
```

### 4b. Download catalogue data model

```typescript
interface DownloadEntry {
  id: string;
  title: string;
  description: string;
  notIncluded: string;  // what the file does NOT contain
  format: "CSV" | "PDF" | "Excel";
  schema: SchemaField[];
  coverage: string;     // e.g. "All 9 SUM Living Labs + contributing cities"
  period: string;       // e.g. "2019–2024"
  licence: string;
  downloadUrl: string;
  sourcePages: string[]; // pages where this download is also available
}

interface SchemaField {
  name: string;
  type: string;
  description: string;
}
```

### 4c. Known downloads

The catalogue documents all downloads available on the platform:

1. **KPI results CSV** — Available from `/data/kpis` per-card buttons and `/tools/impact_analysis`
   - Schema: lab_id, lab_name, kpi_definition_id, kpi_name, date, value, transport_mode, is_validated
   - Does NOT contain: implementation-record indicators, computed model output
   - Coverage: All labs with published data

2. **Projects (measures) CSV** — Available from `/data/measures`
   - Schema: project_id, name, type (PUSH/PULL), description, implementing_labs
   - Does NOT contain: impact coefficients or statistical associations
   - Coverage: All registered measures

3. **Impact analysis output** — Available from `/tools/impact_analysis`
   - Schema: kpi_group, measure_id, coefficient, p_value, confidence, contributing_labs
   - Does NOT contain: raw KPI values, implementation-record data
   - Coverage: Results for the latest model run

4. **KPI Framework PDF** — Available from `/data/collection-plan`
   - Content: SIEF framework, KPI definitions, data collection methodology

5. **Resource files** — Available from `/tools/resources`
   - Various formats per resource item

### 4d. DownloadCatalogue component

`src/components/react/DataConsole/DownloadCatalogue.tsx`

```typescript
interface DownloadCatalogueProps {
  downloads: DownloadEntry[];
}

export function DownloadCatalogue({ downloads }: DownloadCatalogueProps) {
  return (
    <div className="space-y-6">
      {downloads.map(dl => (
        <div key={dl.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{dl.title}</h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-0.5 ml-2">
                {dl.format}
              </span>
            </div>
            <a href={dl.downloadUrl}
               className="text-sm text-primary hover:underline whitespace-nowrap">
              Download →
            </a>
          </div>
          <p className="text-sm text-gray-600 mt-2">{dl.description}</p>
          <p className="text-sm text-amber-700 bg-amber-50 rounded p-2 mt-2">
            Does not contain: {dl.notIncluded}
          </p>
          <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-gray-500">
            <div><strong>Coverage:</strong> {dl.coverage}</div>
            <div><strong>Period:</strong> {dl.period}</div>
            <div><strong>Licence:</strong> {dl.licence}</div>
          </div>
          {dl.schema.length > 0 && (
            <details className="mt-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Schema ({dl.schema.length} fields)
              </summary>
              <table className="w-full mt-2 text-xs">
                <thead>
                  <tr className="border-b"><th className="text-left py-1">Field</th><th className="text-left py-1">Type</th><th className="text-left py-1">Description</th></tr>
                </thead>
                <tbody>
                  {dl.schema.map(field => (
                    <tr key={field.name} className="border-b border-gray-100">
                      <td className="py-1 font-mono">{field.name}</td>
                      <td className="py-1">{field.type}</td>
                      <td className="py-1">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 4e. Existing per-card CSV buttons remain

The existing `TriggerDownloadCsv` component on KPI cards, impact analysis, and measures pages is untouched. The downloads page provides discoverability and documentation — existing download buttons continue to work.

---

## 5. File Change Summary

| File | Status | Task | What changes |
|---|---|---|---|
| `src/pages/data/index.astro` | **New** | T19 | Data homepage with status tiles, coverage matrix, quick links |
| `src/lib/utils/coverageMatrix.ts` | **New** | T19 | Coverage matrix builder utility |
| `src/components/react/DataConsole/CoverageMatrix.tsx` | **New** | T19 | Coverage matrix React component |
| `src/components/react/DataConsole/StatusTiles.tsx` | **New** | T19 | Status tiles component |
| `src/components/react/DataConsole/QuickLinks.tsx` | **New** | T19 | Quick links grid component |
| `src/components/react/DataConsole/index.ts` | **New** | T19 | Barrel export |
| `src/pages/data/downloads.astro` | **New** | T20 | Downloads catalogue page |
| `src/components/react/DataConsole/DownloadCatalogue.tsx` | **New** | T20 | Download catalogue component |
| `src/lib/experiences/registry.ts` | **Modify** | T19 | Add `/data/downloads` route (if not already covered by `/data` prefix) |
| `src/lib/experiences/registry.test.ts` | **Modify** | T19 | Add tests for new routes |

Total: **8 new files**, **2 modified files**. One PR covering both T19 and T20.

---

## 6. Implementation Order

T19 and T20 can be developed in parallel.

### T19 — Data homepage & coverage matrix

1. **Create `buildCoverageMatrix`** utility in `src/lib/utils/coverageMatrix.ts`
2. **Create React components** — `CoverageMatrix`, `StatusTiles`, `QuickLinks` under `src/components/react/DataConsole/`
3. **Create `src/pages/data/index.astro`** — compose the data homepage
4. **Register route** if needed (may already be covered by existing `/data` prefix)
5. **Add tests** for `buildCoverageMatrix` and registry routes
6. **Verify** — status tiles match T09 counters, matrix states agree with city pages

**Verification checkpoint:** Matrix shows three distinct states in text and colour. Figures agree with T09 counters. A cell marked chartable is chartable in the KPI dashboard. Every existing dashboard and tool is reachable from quick links.

### T20 — Downloads page

1. **Define download catalogue data** — document all existing downloads
2. **Create `DownloadCatalogue` component**
3. **Create `src/pages/data/downloads.astro`**
4. **Verify** — every download link resolves, schema descriptions are accurate, "does not contain" is stated

---

## 7. Testing Strategy

### Manual verification

| Check | How |
|---|---|
| Matrix has three states in text and colour | Inspect cells — icons + labels present |
| Visible key above matrix | Key is shown without interaction |
| Figures agree with T09 counters | Compare status tile values with homepage trust strip |
| Chartable cell is chartable in KPI dashboard | Click through from matrix to KPI dashboard for the same city/group |
| Every dashboard/tool reachable from quick links | Click every quick link |
| Every download on the site appears on downloads page | Cross-reference all existing download buttons |
| Each download states what it does not contain | Read each entry's "Does not contain" text |
| Existing CSV buttons still work | Click a per-card CSV button on `/data/kpis` |

### Unit tests

```typescript
// src/lib/utils/coverageMatrix.test.ts
describe("buildCoverageMatrix", () => {
  it("marks cells with ≥2 estimations as before-after", () => { ... });
  it("marks cells with exactly 1 estimation as baseline-only", () => { ... });
  it("marks cells with 0 estimations as none", () => { ... });
  it("covers all lab × KPI group combinations", () => { ... });
  it("uses only validated estimations for counting", () => { ... });
});
```

---

## 8. Open Questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| OQ-1 | Does `/data` currently resolve to `/data/kpis` via a redirect, or is it a 404? If redirect, T19 replaces it with the new data homepage. | Dev | T19 route setup |
| OQ-2 | What licence applies to each download? Open Data Commons? CC-BY? | Consortium | T20 licence field |
| OQ-3 | Should the coverage matrix group KPI definitions by top-level parent KPI or by KPI-SIEF category? | Product/Dev | T19 matrix columns |
| OQ-4 | Should the downloads page expose the underlying KPI series as a direct download, or only link to the KPI dashboard? | Product | T20 download scope |
| OQ-5 | What period should each download state? Derived from actual data dates or a static string? | Product | T20 period field |

---

## 9. Out of Scope

- **New download endpoints** — The page documents existing downloads; no new API routes
- **File browser or bulk download** — Not a file management interface
- **Data ingestion or upload** — Admin functionality
- **Insights experience content** — This is Data experience only
- **Coverage gap closure** — Making the matrix gaps visible is in scope; closing them is a WP1 data-collection task

---

## 10. Downstream Impact

| Consumer | What it uses | When |
|---|---|---|
| Epic 7 (Landing) | Data door entry links to `/data` (data homepage) | Immediate |
| Epic 8 (Insights Goals) | Cross-link from goal pages to Data experience | Cross-epic |
| Epic 12 (Methods) | Methods pages linked from data homepage quick links | Cross-epic |
| Trust strip (T11) | Figures must agree — both use `computePlatformCounters()` | By construction |
