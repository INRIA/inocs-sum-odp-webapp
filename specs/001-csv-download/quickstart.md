# Quickstart: CSV Dataset Download

**Feature**: 001-csv-download | **Date**: 2026-02-27  
**Branch**: `001-csv-download`

---

## Overview

This feature adds two CSV export endpoints and a reusable React download button component. Below is the implementation order following TDD (tests first) and the BFF layer sequence (repository → service → controller → route → component).

---

## Prerequisite: No migration needed

This feature only adds read queries to existing tables. No schema changes, no new Prisma migrations.

---

## Step 1: Write failing tests (Red phase)

Start with the API route tests so the contract is defined before any code:

```bash
# Create test files (they will fail until implementation is done)
touch src/pages/api/v1/csv/kpiresults.test.ts
touch src/pages/api/v1/csv/projects.test.ts
touch src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.test.tsx

# Run tests — expect ALL to fail at this stage
npx vitest run src/pages/api/v1/csv/
npx vitest run src/components/react/TriggerDownloadCsv/
```

---

## Step 2: Implement the BFF backend (Green phase)

### 2a. Repository

File: `src/bff/repositories/csv-export.repository.ts`

Implement `CsvExportRepository` with two methods:
- `findKpiResultsForCsv(filters)` — Prisma `findMany` on `kpiresults` with `include: { living_lab: true, kpidefinition: { include: { kpidefinitions_category: { include: { category: true } } } }, transport_mode: true }`
- `findProjectsForCsv(filters)` — Prisma `findMany` on `living_lab_projects_implementation` with `include: { lab: true, project: true }`

Both methods map Prisma rows to `KpiResultCsvRow[]` / `ProjectCsvRow[]` (no BigInts, no internal IDs).

### 2b. CSV Serializer utility

File: `src/bff/services/csv-export.service.ts` (inline static class `CsvSerializer`)

```typescript
// Minimal contract
class CsvSerializer {
  static serialize(rows: Record<string, unknown>[], headers: CsvHeaderDef[]): string
  // throws EmptyCsvError when rows.length === 0
}
```

### 2c. Service

File: `src/bff/services/csv-export.service.ts`

Implements `CsvExportService` with:
- `getKpiResultsCsv(filters)` → calls repo → serializes → returns CSV string
- `getProjectsCsv(filters)` → calls repo → serializes → returns CSV string

### 2d. Controller

File: `src/bff/controllers/csv-export.controller.ts`

```typescript
export class CsvExportController {
  private service = new CsvExportService();
  async getKpiResultsCsv(filters: KpiResultsCsvFilters): Promise<string>
  async getProjectsCsv(filters: ProjectsCsvFilters): Promise<string>
}
```

---

## Step 3: Implement API routes

### File: `src/pages/api/v1/csv/kpiresults.ts`

```typescript
// GET /api/v1/csv/kpiresults?living_lab_id=&category_id=&kpidefinition_id=
export const GET: APIRoute = async ({ url }) => { ... }
```

Returns: `new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="kpi-results.csv"' } })`

### File: `src/pages/api/v1/csv/projects.ts`

```typescript
// GET /api/v1/csv/projects?living_lab_id=
export const GET: APIRoute = async ({ url }) => { ... }
```

---

## Step 4: ApiClient — add blob download method

File: `src/lib/api-client/ApiClient.ts`

Add to `ApiClient` class:
```typescript
async downloadCsvBlob(path: string): Promise<Blob> {
  // Does NOT reuse request<T>(); builds URL and headers the same way
  // Throws ApiDownloadError on non-ok response
  // Returns res.blob()
}
```

---

## Step 5: Implement TriggerDownloadCsv component

File: `src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.tsx`

```typescript
// Props
interface TriggerDownloadCsvProps {
  type: DownloadType;
  size?: 'sm' | 'md' | 'lg';   // 'sm' maps to RButton 'xs' internally
  living_lab_id?: number;
  category_id?: number;
  kpidefinition_id?: number;
  disabled?: boolean;
}
```

Component behavior:
1. Build path from `type` + filter props.
2. On click: `isLoading = true` → `apiClient.downloadCsvBlob(path)`.
3. On success: create tmp `<a download>` → click → revoke URL → `isLoading = false`.
4. On error: set `errorMsg` state.
5. If required params are missing for the given type: disable the button.

Use `ArchiveBoxArrowDownIcon` from `@heroicons/react/24/outline`.

File: `src/components/react/TriggerDownloadCsv/index.ts`
```typescript
export { TriggerDownloadCsv } from './TriggerDownloadCsv';
export type { TriggerDownloadCsvProps, DownloadType } from './TriggerDownloadCsv';
```

---

## Step 6: Wire into KpiCard

File: `src/components/react/KpiCards/KpiCard.tsx`

Add below the `KpiDefault` block (inside the `kpiResults &&` conditional):

```tsx
{kpiResults && (
  <>
    <KpiDefault ... />
    <div className="flex justify-end mt-2">
      <TriggerDownloadCsv
        type="kpi-results-lab"
        size="sm"
        living_lab_id={kpiResults.living_lab_id}
        kpidefinition_id={kpi.id}
      />
    </div>
  </>
)}
```

---

## Step 7: Run all tests (Green check)

```bash
npx vitest run src/pages/api/v1/csv/
npx vitest run src/components/react/TriggerDownloadCsv/
npx vitest run src/bff/
```

All tests should pass at this point.

---

## Step 8: Type-check and lint

```bash
npx tsc --noEmit
```

No new TypeScript errors should be introduced.

---

## Manual verification

1. Start dev server: `npm run dev`
2. Navigate to a Living Lab KPI page.
3. Confirm the "Lab KPIs CSV" button appears at the bottom of each `KpiCard`.
4. Click the button → web browser should download a file named `kpi-results.csv`.
5. Open the file in a spreadsheet app and confirm all columns are present and correctly formatted.
6. Test `GET /api/v1/csv/projects` via browser or curl: `curl "http://localhost:4321/api/v1/csv/projects" -o test.csv`

---

## Key file locations

| File | Purpose |
|---|---|
| `src/bff/repositories/csv-export.repository.ts` | Prisma queries for CSV export |
| `src/bff/services/csv-export.service.ts` | Business logic + `CsvSerializer` + `EmptyCsvError` |
| `src/bff/controllers/csv-export.controller.ts` | Controller delegating to service |
| `src/pages/api/v1/csv/kpiresults.ts` | Astro API route for KPI results |
| `src/pages/api/v1/csv/kpiresults.test.ts` | Tests for KPI results route |
| `src/pages/api/v1/csv/projects.ts` | Astro API route for projects |
| `src/pages/api/v1/csv/projects.test.ts` | Tests for projects route |
| `src/lib/api-client/ApiClient.ts` | +`downloadCsvBlob()` method |
| `src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.tsx` | React download button component |
| `src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.test.tsx` | Component unit tests |
| `src/components/react/KpiCards/KpiCard.tsx` | Modified to include download button |
