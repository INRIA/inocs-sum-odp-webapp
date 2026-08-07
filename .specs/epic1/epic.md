# Epic 1: CSV Export Fix

**Tasks:** T01 (S)
**Wave:** A — ship regardless of structure
**Total effort:** S
**Dependencies:** None — start immediately

---

## Scope

Fix the `Download failed: status=400` bug on the KPI results CSV export.

**Affected files:**
- `src/pages/api/v1/csv/kpiresults.ts`
- Download trigger components on `/data/kpis`, `/tools/impact_analysis`, and city pages

## Key behaviour

- Reproduce the 400 across every entry point that offers the download
- Establish whether the failure is parameter validation, empty result set, or payload size
- An empty result set returns HTTP 200 with a header-only CSV, not an error

## Acceptance criteria

- Every CSV button on the public site returns a well-formed file for every city and KPI combination, including those with no data
- A request with no matching rows returns HTTP 200 and a header-only CSV
- A regression test covers at least one previously-failing parameter combination

## PR validation

One PR. Test by downloading CSV from every public entry point. Automated regression test must pass.
