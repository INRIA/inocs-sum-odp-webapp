# Architecture — Epic 1: CSV Export Fix

## Root-cause analysis

### Cause A — Empty result set returns 404 (primary bug, produces `status=404`)

`CsvSerializer.serialize()` (`src/lib/utils/CsvSerializer.ts:18-20`) throws `EmptyCsvError` when `rows.length === 0`. Both API routes catch `EmptyCsvError` and return 404:

- `kpiresults.ts:68-73`
- `projects.ts:41-43`

The acceptance criteria require: **"A request with no matching rows returns HTTP 200 and a header-only CSV."** The current throw-on-empty design is the root cause of the reported failure.

### Cause B — `ModalSplitLivingLabsCard` uses unsafe `Number()` coercion (latent risk, not the active 400)

`ModalSplitLivingLabsCard.tsx:107` passes `kpidefinition_id={Number(kpiId)}` where `kpiId: string` (types.ts:197).

In practice `kpiId` is always a valid numeric string — it originates from `String(kpi.id)` in `living-lab.ts:302`, where `kpi.id` is a positive integer from the database. So `Number("42")` = 42 works correctly today.

However, the pattern is **unsafe by construction**:
- `Number("")` → `0` → `String(0) → "0"` → `parsePositiveInt("0")` returns null → **400**
- `Number("abc")` → `NaN` → `String(NaN) → "NaN"` → `parsePositiveInt("NaN")` returns null → **400**
- `NaN !== undefined` is `true`, so `buildPath()` would include it in the URL

This is defensive hardening, not the active bug. The reported `status=400` is most likely Cause A (empty-set 404) being misidentified, or Cause C on edge-case URLs.

### Cause C — `kpiresults.ts` `parsePositiveInt` does not guard empty string (secondary 400 vector)

`kpiresults.ts:12` uses `if (value === null) return undefined`. If the URL contains `?living_lab_id=` (present, empty), `searchParams.get()` returns `""`, not `null`. `parseInt("", 10)` → NaN → 400.

`projects.ts:13` already guards this correctly with `if (value === null || value === "") return undefined`. `kpiresults.ts` is inconsistent.

---

## What does NOT need changing

- The `parsePositiveInt` strict check `String(n) !== value` is correct. It rejects floats (`"1.5"`), leading zeros (`"01"`), and whitespace-padded values. Do not relax it.
- `buildPath()` in `TriggerDownloadCsv.tsx` is correct: it only appends params that are `!== undefined`. The problem is upstream components passing `NaN` (which is `!== undefined`).
- The repository query logic and Prisma filters are correct.
- The controller is a pass-through and needs no change.

---

## Fix plan

### Change 1 — `src/lib/utils/CsvSerializer.ts`

**Goal:** Return a header-only CSV row instead of throwing when rows is empty.

Remove the `EmptyCsvError` class and the early throw. Restructure `serialize()`:

```typescript
export class CsvSerializer {
  static serialize(rows: Record<string, unknown>[], headers: CsvHeaderDef[]): string {
    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerRow = headers.map((h) => `"${h.label}"`).join(",");

    if (rows.length === 0) return headerRow;   // ← header-only, no error

    const dataRows = rows.map((row) =>
      headers.map((h) => escape(row[h.key])).join(","),
    );
    return [headerRow, ...dataRows].join("\n");
  }
}
```

Delete `EmptyCsvError` from this file entirely.

---

### Change 2 — `src/pages/api/v1/csv/kpiresults.ts`

**Goal:** Align `parsePositiveInt` with `projects.ts` (guard empty string) and remove the now-dead `EmptyCsvError` catch.

1. Fix `parsePositiveInt` to handle empty string:
   ```typescript
   function parsePositiveInt(value: string | null): number | undefined | null {
     if (value === null || value === "") return undefined;  // ← add || value === ""
     ...
   }
   ```

2. Remove the `EmptyCsvError` import (line 3) — it no longer exists.

3. Remove the `EmptyCsvError` catch branch (lines 68-73):
   ```typescript
   // DELETE this block:
   if (err instanceof EmptyCsvError) {
     return new Response(..., { status: 404, ... });
   }
   ```

The try/catch block remains for the 500 path.

---

### Change 3 — `src/pages/api/v1/csv/projects.ts`

**Goal:** Remove the now-dead `EmptyCsvError` catch.

1. Remove the `EmptyCsvError` import (line 3).
2. Remove the catch branch (lines 41-43):
   ```typescript
   // DELETE:
   if (err instanceof EmptyCsvError) {
     return Response.json({ error: "No data found" }, { status: 404 });
   }
   ```

`parsePositiveInt` in `projects.ts` already handles empty string — no change needed there.

---

### Change 3b — `src/bff/services/csv-export.service.ts`

**Goal:** Remove the `EmptyCsvError` re-export (build would break without this).

Both route files import `EmptyCsvError` from this re-export hub, not from `CsvSerializer.ts` directly. Once `EmptyCsvError` is deleted from `CsvSerializer.ts`, this file must be updated:

1. Remove `EmptyCsvError` from the import on line 9:
   ```typescript
   import { CsvSerializer } from "../../lib/utils/CsvSerializer";
   ```
2. Remove `EmptyCsvError` from the re-export on line 19:
   ```typescript
   export { CsvSerializer };
   ```

---

### Change 4 — `src/components/react/KPIsDashboard/ModalSplitLivingLabsCard.tsx`

**Goal:** Prevent `NaN` from reaching the URL.

Replace the unsafe `Number(kpiId)` with a safe integer parse. Compute once at the top of the component body:

```typescript
const kpiDefinitionId = parseInt(kpiId, 10);
const isValidKpiId = Number.isFinite(kpiDefinitionId) && kpiDefinitionId > 0;
```

Then pass:
```tsx
<TriggerDownloadCsv
  type="kpi-results-definition"
  size="sm"
  kpidefinition_id={isValidKpiId ? kpiDefinitionId : undefined}
  disabled={!isValidKpiId}
/>
```

When the ID is invalid, the button is disabled. An unfiltered fetch of all KPI results would be an expensive wide query and not what the user expects from a single-KPI card — so disable, don't silently widen.

---

## Test changes

### `src/bff/services/csv-export.service.test.ts`

- **Remove** the test "throws EmptyCsvError when rows array is empty" (line 60-62) — `EmptyCsvError` no longer exists.
- **Add** a regression test:
  ```typescript
  it("returns header-only CSV when rows array is empty", () => {
    const csv = CsvSerializer.serialize([], headers);
    expect(csv).toBe('"Name","Value","Note"');
  });
  ```

### `src/pages/api/v1/csv/kpiresults.test.ts`

- **Update** "returns 404 when controller throws EmptyCsvError" (lines 91-99):
  - Rename to: "returns 200 with header-only CSV when controller returns empty data"
  - Remove the `EmptyCsvError` import.
  - Mock the controller to return just the header row string (simulating what the service now returns for empty data).
  - Assert status 200 and `Content-Type: text/csv`.

- **Add** a regression test for the previously-failing parameter combination:
  ```typescript
  it("accepts kpidefinition_id without living_lab_id (regression: was 400 via ModalSplitCard)", async () => {
    mockGetKpiResultsCsv.mockResolvedValueOnce('"KPI Group","KPI Number",...');
    const res = await GET({ url: makeUrl({ kpidefinition_id: "42" }) } as never);
    expect(res.status).toBe(200);
  });
  ```
  Note: "returns 200 when no params supplied" is already covered by the existing test at line 42-55. Do not duplicate it.

- **Add** guard test for empty-string param (Cause C):
  ```typescript
  it("treats empty-string living_lab_id as absent (not 400)", async () => {
    mockGetKpiResultsCsv.mockResolvedValueOnce('"KPI Group",...');
    const res = await GET({ url: makeUrl({ living_lab_id: "" }) } as never);
    expect(res.status).toBe(200);
    expect(mockGetKpiResultsCsv).toHaveBeenCalledWith(
      expect.objectContaining({ living_lab_id: undefined }),
    );
  });
  ```

### `src/pages/api/v1/csv/projects.test.ts`

- **Update** "returns 404 when controller throws EmptyCsvError" (lines 67-77):
  - Same treatment as kpiresults.test.ts — rename and assert 200 with header row.
  - Remove the `EmptyCsvError` import.

---

## Affected entry points to verify manually

| Page | Entry point | Download type |
|---|---|---|
| `/data/kpis` | `KpiLivingLabsSingleCard` | `kpi-results-definition` |
| `/data/kpis` | `KpiLivingLabsMultipleCard` | `kpi-results-definition` |
| `/data/kpis` | `ModalSplitLivingLabsCard` ← **unsafe coercion hardened** | `kpi-results-definition` |
| `/tools/impact_analysis` | `ImpactAnalysisDashboard` | `kpi-results-category` |
| `/tools/impact_analysis` | `ImpactAnalysisDashboard` | `projects-all` |
| City page | `LivingLabKPIsView` | `kpi-results-lab` |
| City page | `KpiCard` | `kpi-results-lab` |
| City page | `KpiMultiple` | `kpi-results-lab` |
| City page | `[labId].astro` | `projects-lab` |

---

## File change summary

| File | Change |
|---|---|
| `src/lib/utils/CsvSerializer.ts` | Remove `EmptyCsvError`; return header row on empty |
| `src/pages/api/v1/csv/kpiresults.ts` | Fix empty-string guard; remove `EmptyCsvError` import + catch |
| `src/pages/api/v1/csv/projects.ts` | Remove `EmptyCsvError` import + catch |
| `src/bff/services/csv-export.service.ts` | Remove `EmptyCsvError` from import + re-export |
| `src/components/react/KPIsDashboard/ModalSplitLivingLabsCard.tsx` | Safe `parseInt` for `kpiId`; disable button on invalid |
| `src/bff/services/csv-export.service.test.ts` | Replace throw test with header-only regression test |
| `src/pages/api/v1/csv/kpiresults.test.ts` | Replace 404 test; add 2 new tests |
| `src/pages/api/v1/csv/projects.test.ts` | Replace 404 test |

Total: **8 files**, all surgical. No new files.

---

## PR checklist

- [ ] Every CSV button on the public site returns a well-formed file for every city and KPI combination
- [ ] City with no KPI data returns 200 + header-only CSV (not 404)
- [ ] Modal-split KPI card download no longer produces status=400
- [ ] `?living_lab_id=` (empty string) treated as absent on both routes
- [ ] All new and updated tests pass (`vitest run`)
- [ ] No regression in existing passing tests
