# Quickstart — Implement Public Multi-Entry KPI Charts

## 1) Preconditions
- Work on branch: `001-multi-entry-kpi-charts`
- Scope: public data views only (no private admin input forms, no backend changes)

## 2) Red phase (tests first)
1. Add a new dedicated test file for multi-entry compatibility behavior (front-end adapter/helper layer).
2. Update existing KPI dashboard tests that currently assume only before/after entries.
3. Ensure tests cover:
   - happy path with >2 entries
   - year filtering on multi-entry series
   - displayed information counts/labels
   - edge cases: 0/1/2 entries, invalid entries, duplicate dates

## 3) Green phase (minimal implementation)
1. Update type contracts:
   - `ILivingLabPopulated.kpi_results` to `IKpiResultGroup[]`
   - Add `IKpiResultGroup extends IIKpiResultBeforeAfter { results: IKpiResult[] }`
2. Introduce normalization/adaptation in front-end data shaping to support both old/new payloads.
3. Replace direct before/after assumptions in public KPI pages/components/helpers with `results[]`/`entries[]` iteration.
4. Keep chart behavior/tooltips/interactions unchanged.

## 4) Refactor phase
1. Consolidate conversion helpers to avoid duplicated normalization logic.
2. Keep temporary compatibility aliases for unaffected consumers.
3. Remove newly introduced direct `result_before/result_after` reads from updated files.

## 5) Validate
- Run targeted tests for KPI dashboard and modal split components/helpers.
- Run full test suite: `npm run test:run`
- Run coverage: `npm run test:coverage`
- Confirm >=80% coverage for newly added/changed feature tests/code.

## 6) Acceptance checks
- All entries from sorted `results[]` are visible in public charts.
- Public pages in scope (`kpis`, `modal-split`, `living-lab-city/[labId]`) are consistent.
- No private admin page behavior is modified.
