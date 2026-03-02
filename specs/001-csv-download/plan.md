# Implementation Plan: CSV Dataset Download

**Branch**: `001-csv-download` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-csv-download/spec.md`

## Summary

Add two new GET API routes (`/api/v1/csv/kpiresults`, `/api/v1/csv/projects`) that return filtered CSV file downloads, backed by new repository query methods and service + controller layers following existing BFF architecture. A new React island component `TriggerDownloadCsv` wraps an `RButton` and handles the browser-side file download trigger. The `ApiClient` gains a dedicated blob-download method. The `KpiCard` component is wired to the smallest button size for per-KPI single-lab downloads.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node.js 20, React 18  
**Primary Dependencies**: Astro 4 (SSR), Prisma Client (MySQL), React 18, `@heroicons/react` v2, `@testing-library/react`, Vitest  
**Storage**: MySQL (via Prisma) — *note: constitution names PostgreSQL but production schema is MySQL; see compliance note below*  
**Testing**: Vitest + `@testing-library/react` + `@testing-library/user-event`, `happy-dom`  
**Target Platform**: Node.js SSR server (Astro), browser-side React islands  
**Project Type**: Web application (SSR + React islands / BFF pattern)  
**Performance Goals**: CSV export response starts within 3 seconds for up to 10,000 result rows  
**Constraints**: No new database engines; no raw SQL; strict TypeScript; no inline SSR CSV embedding; file download must be browser-triggered via `Content-Disposition: attachment`  
**Scale/Scope**: Two export endpoints covering ~100 labs × ~50 KPI definitions × multi-year dates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] Tests-first plan exists for all new behavior (Red → Green → Refactor documented).
- [x] A new test file per new feature is listed as acceptance criteria.
- [x] Test scope includes happy path, user interactions, displayed information, and edge cases.
- [x] Astro SSR responsibilities are separated from React island interactivity.
- [x] TypeScript strict mode remains enabled with no weakening changes.
- [x] Test implementation uses Vitest + `@testing-library/react`.
- [⚠] Data layer uses Prisma + **MySQL** only — constitution says PostgreSQL but the live `schema.prisma` uses MySQL. This is a pre-existing discrepancy. The feature follows the actual schema (MySQL via Prisma) and does not introduce any raw SQL or secondary databases. Exception documented here.

## Project Structure

### Documentation (this feature)

```text
specs/001-csv-download/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   ├── GET-csv-kpiresults.md
│   └── GET-csv-projects.md
└── tasks.md             ← Phase 2 output
```

### Source Code

```text
src/
├── pages/api/v1/csv/
│   ├── kpiresults.ts               ← NEW: GET /api/v1/csv/kpiresults
│   ├── kpiresults.test.ts          ← NEW: unit tests for kpiresults CSV route
│   ├── projects.ts                 ← NEW: GET /api/v1/csv/projects
│   └── projects.test.ts            ← NEW: unit tests for projects CSV route
│
├── bff/
│   ├── controllers/
│   │   └── csv-export.controller.ts  ← NEW
│   ├── services/
│   │   └── csv-export.service.ts     ← NEW (includes CsvSerializer + EmptyCsvError)
│   └── repositories/
│       └── csv-export.repository.ts  ← NEW
│
├── lib/
│   └── api-client/
│       └── ApiClient.ts            ← MODIFIED: add downloadCsvBlob() method
│
└── components/react/
    └── TriggerDownloadCsv/
        ├── index.ts                ← NEW: barrel export
        ├── TriggerDownloadCsv.tsx  ← NEW: React island component
        └── TriggerDownloadCsv.test.tsx  ← NEW: component unit tests

src/components/react/KpiCards/
└── KpiCard.tsx                     ← MODIFIED: add TriggerDownloadCsv at bottom
```

**Structure Decision**: Single Astro project following existing BFF layering. All new files placed in their conventional locations within the existing `src/` hierarchy. No new packages or directories outside established structure.

---

## Phase 0: Research Findings

> See [research.md](./research.md) for full rationale. Summary of resolved unknowns:

| Unknown | Decision |
|---|---|
| CSV serialization library | Native string building — no dependency needed at this row volume; all values double-quoted and internal quotes escaped |
| ApiClient blob download | New `downloadCsvBlob(path)` helper on `ApiClient` that reads response as `Blob`, creates an object URL, and programmatically clicks an `<a>` element — does NOT go through the existing `request<T>()` method since that discards non-JSON responses |
| RButton `sm` size mapping | `RButton` exposes `xs \| md \| lg`. User spec says `sm, md, lg` — map `sm` → `xs` in `TriggerDownloadCsv` props; document internally |
| Filter query param encoding | Single numeric values as plain query params (`?living_lab_id=3`); multiple values not required per spec — each filter type is one value at a time |
| BigInt in Prisma → CSV | All BigInt IDs are excluded from the export (no internal IDs in output); numeric values cast via `parseFloat` to render correctly in CSV |
| KpiCard integration | `KpiCard` receives `kpi.id` (kpidefinition_id) and `kpiResults.living_lab_id` already; pass both as props to `TriggerDownloadCsv` with type `'kpi-results-lab'` |

---

## Phase 1: Design & Architecture

### Data Model

> See [data-model.md](./data-model.md) for full entity diagram and field lists.

**KPI Results export row**:
```
lab_name | kpi_number | kpi_name | kpi_group | metric | value | date | transport_mode
```
Source tables: `kpiresults` JOIN `labs` JOIN `kpidefinitions` JOIN `kpidefinitions_category` JOIN `categories` LEFT JOIN `transport_mode`

**Projects export row**:
```
lab_name | project_name | project_type | start_date | description
```
Source tables: `living_lab_projects_implementation` JOIN `labs` JOIN `projects`

---

### Backend Architecture

Follows the existing `controller → service → repository` layering.

#### Repository: `CsvExportRepository`

```typescript
interface KpiResultsCsvFilters {
  living_lab_id?: number;
  category_id?: number;
  kpidefinition_id?: number;
}
interface ProjectsCsvFilters {
  living_lab_id?: number;
}

findKpiResultsForCsv(filters: KpiResultsCsvFilters): Promise<KpiResultCsvRow[]>
findProjectsForCsv(filters: ProjectsCsvFilters): Promise<ProjectCsvRow[]>
```

#### Service: `CsvExportService`

```typescript
getKpiResultsCsv(filters: KpiResultsCsvFilters): Promise<string>
getProjectsCsv(filters: ProjectsCsvFilters): Promise<string>
```

Calls repository → receives typed row arrays → delegates to `CsvSerializer.serialize(rows, headers)`.

**`CsvSerializer`** (static utility, no Prisma dependency):
```typescript
serialize(rows: Record<string, unknown>[], headers: CsvHeaderDef[]): string
// CsvHeaderDef = { key: string; label: string }
// Throws EmptyCsvError when rows.length === 0
```

#### Controller: `CsvExportController`

```typescript
getKpiResultsCsv(filters: KpiResultsCsvFilters): Promise<string>
getProjectsCsv(filters: ProjectsCsvFilters): Promise<string>
```

#### Astro API Routes

```
GET /api/v1/csv/kpiresults  — query: living_lab_id?, category_id?, kpidefinition_id?
GET /api/v1/csv/projects    — query: living_lab_id?
Both return: text/csv  Content-Disposition: attachment
200 OK | 400 Bad Request | 404 Not Found (no rows) | 500 Internal Server Error
```

---

### Frontend Architecture

#### `ApiClient.downloadCsvBlob(path: string): Promise<Blob>`

Does NOT reuse `request<T>()`. Builds URL and auth header the same way, asserts `res.ok`, returns `res.blob()`. Throws `ApiDownloadError` on failure.

#### `TriggerDownloadCsv` Component

```typescript
type DownloadType =
  | 'kpi-results-all'
  | 'kpi-results-lab'
  | 'kpi-results-definition'
  | 'kpi-results-category'
  | 'projects-all'
  | 'projects-lab';

interface TriggerDownloadCsvProps {
  type: DownloadType;
  size?: 'sm' | 'md' | 'lg';   // sm maps to RButton xs internally
  living_lab_id?: number;       // required for kpi-results-lab and projects-lab
  category_id?: number;
  kpidefinition_id?: number;
  disabled?: boolean;
}
```

Type → label map:
```
'kpi-results-all'        → "All KPIs CSV"
'kpi-results-lab'        → "Lab KPIs CSV"
'kpi-results-definition' → "KPIs CSV"
'kpi-results-category'   → "Group of KPIs CSV"
'projects-all'           → "All Measures CSV"
'projects-lab'           → "Lab Measures CSV"
```

**Astro page embedding**: any Astro page or component that uses `TriggerDownloadCsv` MUST render it with `client:load` (or `client:visible` for below-the-fold placement) to enable React hydration and button interactivity.

#### KpiCard Integration

Add below `KpiDefault` inside the `kpiResults &&` block:
```tsx
<div className="flex justify-end mt-2">
  <TriggerDownloadCsv
    type="kpi-results-lab"
    size="sm"
    living_lab_id={kpiResults.living_lab_id}
    kpidefinition_id={kpi.id}
  />
</div>
```
KpiCard is a React component (not an Astro page), so no `client:*` directive is needed inside it — the directive is applied at the Astro page level where `KpiCard` or its parent is rendered.

---

### Test Scope

| Test file | Coverage |
|---|---|
| `src/bff/services/csv-export.service.test.ts` | CsvSerializer: header row, double-quoting, escape, EmptyCsvError |
| `src/lib/api-client/ApiClient.test.ts` | downloadCsvBlob: URL construction, auth header, ApiDownloadError, Blob return |
| `src/pages/api/v1/csv/kpiresults.test.ts` | Route: all filters, no rows → 404, invalid param → 400, service throws → 500 |
| `src/pages/api/v1/csv/projects.test.ts` | Route: no filter, lab filter, no rows → 404, service throws → 500 |
| `src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.test.tsx` | All download types, loading state, error state, disabled state, size mapping |
| `src/components/react/KpiCards/KpiCard.test.tsx` | TriggerDownloadCsv present/absent based on kpiResults prop |

---

## Compliance Notes

1. **MySQL vs PostgreSQL**: Feature uses MySQL via Prisma client as per the actual `schema.prisma`. No raw SQL introduced. Pre-existing constitution discrepancy — not a new deviation introduced by this feature.
2. **No SSR-embedded CSV**: Dedicated API route (Option 2) used — avoids HTML bloat, enables reuse across pages.
3. **No external CSV library**: Inline `CsvSerializer` avoids dependency surface for fixed, known schemas.
4. **client:* directive**: `TriggerDownloadCsv` is a React island and MUST be rendered with `client:load` in any Astro page that embeds it directly.
