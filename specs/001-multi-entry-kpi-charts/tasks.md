# Tasks: Public Multi-Entry KPI Charts

**Input**: Design documents from `/specs/001-multi-entry-kpi-charts/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are MANDATORY. Write tests first, ensure they fail, then implement.  
New file required: `src/components/react/KPIsDashboard/multi-entry-kpi-compat.test.ts`  
Second new file: `src/lib/helpers/living-lab.test.ts`

**Scope**: Public data views only. Admin pages (`lab-admin/`, `LivingLabModalSplit.tsx`, `LivingLabKPIsEdition.tsx`) are explicitly out of scope.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no in-flight dependencies)
- **[Story]**: User story label — US1, US2, or US3 (Setup/Foundational/Polish phases carry no label)

---

## Phase 1: Setup (Type Infrastructure)

**Purpose**: Add the new `IKpiResultGroup` type and propagate it through type files. No implementation logic yet — purely type scaffolding that every subsequent task depends on.

- [X] T001 Add `IKpiResultGroup` interface extending `IIKpiResultBeforeAfter` with `results: IKpiResult[]` (sorted ASC) in `src/types/KPIs.ts`
- [X] T002 [P] Update `ILivingLabPopulated.kpi_results` field type from `IIKpiResultBeforeAfter[]` to `IKpiResultGroup[]` in `src/types/LivingLab.ts`
- [X] T003 [P] Update `ILivingLabKpiData.kpiResults` field type from `IIKpiResultBeforeAfter[]` to `IKpiResultGroup[]` and add `entries` field support to `IModalSplitLabData` in `src/components/react/KPIsDashboard/types.ts`

---

## Phase 2: Foundational (Retrocompat Normalization — Blocks All User Stories)

**Purpose**: Single normalization utility that covers both legacy (`result_before`/`result_after` only) and new (`results[]`) payload shapes. All downstream transformers call this instead of reading fields directly.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add `normalizeKpiResultGroup` pure function in **`src/lib/utils/kpis.ts`** (new file) that: derives `results[]` from `result_before`/`result_after` when `results` is absent; derives compatibility aliases when only `results[]` is present; returns canonical `IKpiResultGroup` — imports only from `src/types/` (no SSR helper dependency, safe for React island import)

**Checkpoint**: Types and normalization helper are ready — user story phases may now proceed in parallel.

---

## Phase 3: User Story 1 — View Full KPI History in Public Charts (Priority: P1) 🎯 MVP

**Goal**: All entries in `results[]` are shown as timeline data points in the KPI dashboard charts (`kpis.astro` + `[labId].astro` public views). Before/after restriction is removed.

**Independent Test**: Load a dataset with 5 KPI result entries; confirm all 5 appear as distinct plotted points in `KpiLivingLabsSingleCard` and `KpiLivingLabsMultipleCard`. Can be verified with `multi-entry-kpi-compat.test.ts` and updated `utils.test.ts` in isolation.

### Tests for User Story 1 (MANDATORY) ⚠️

> **Write these first; confirm they FAIL before writing any implementation.**

- [X] T005 [P] [US1] Create new test file `src/components/react/KPIsDashboard/multi-entry-kpi-compat.test.ts` with red tests for `processKpiResults` receiving `IKpiResultGroup` with 5 `results[]` entries — assert 5 `ITimelineDataPoint` items returned in chronological order
- [X] T006 [P] [US1] Update `src/components/react/KPIsDashboard/utils.test.ts` — add test cases where `kpiResult` has `results: [...]` with 3+ entries and assert `processKpiResults` returns all entries (replacing existing `result_before`/`result_after`-only fixtures with `IKpiResultGroup` fixtures)
- [X] T007 [P] [US1] Update `src/components/react/KPIsDashboard/KPIsDashboard.test.tsx` — replace `kpiResults: []` stub fixtures with `IKpiResultGroup[]` typed data (add `results` field to existing living lab fixtures so TypeScript is satisfied)
- [X] T008 [P] [US1] Update `src/components/react/KPIsDashboard/KpiLivingLabsCards.test.tsx` — replace `result_before`/`result_after` in all fixture `kpiResults` arrays with `IKpiResultGroup` shape (`results: [...]`)
- [X] T031 [P] [US1] Add rendered-output assertions to `src/components/react/KPIsDashboard/multi-entry-kpi-compat.test.ts` using `@testing-library/react` `render` + `getAllByText`/`getByRole`: given a `KpiLivingLabsSingleCard` rendered with 5 entries, assert all 5 entry date strings appear in the DOM (covers FR-004 contextual labeling requirement)

### Implementation for User Story 1

- [X] T009 [US1] Rewrite `processKpiResults` in `src/components/react/KPIsDashboard/utils.ts` to call `normalizeKpiResultGroup` (imported from `src/lib/utils/kpis.ts`) then iterate `results[]`, producing one `ITimelineDataPoint` per valid entry (replaces the current `result_before`/`result_after` extraction)
- [X] T010 [US1] Update `buildLabTimelines` in `src/components/react/KPIsDashboard/utils.ts` to accept `IKpiResultGroup[]` for the lab's `kpiResults` and call the updated `processKpiResults` — remove the two-point assumption
- [X] T011 [P] [US1] Update year extraction loop in `src/pages/data/kpis.astro` (lines 29–44) to iterate `result.results[]` instead of accessing `result.result_before` and `result.result_after` directly
- [X] T012 [P] [US1] Update `KpiCard.tsx` in `src/components/react/KpiCards/KpiCard.tsx` to accept `kpiResults?: IKpiResultGroup` (change the `Props` type import from `IIKpiResultBeforeAfter` to `IKpiResultGroup`)
- [X] T013 [P] [US1] Update `KpiMultiple.tsx` in `src/components/react/KpiCards/KpiMultiple.tsx` to change `results: IIKpiResultBeforeAfter[]` prop to `IKpiResultGroup[]` and build chart data by iterating `kpiRes.results[]` instead of accessing `result_before`/`result_after` separately
- [X] T014 [US1] Update `KpiDefault.tsx` in `src/components/react/KpiCards/KpiDefault.tsx` to accept `IKpiResultGroup` and render all entries in `results[]` as line chart data points (currently only renders before/after two-point lines)
- [X] T015 [US1] Update `LivingLabKPIsView.tsx` in `src/components/react/LivingLabKPIsView.tsx` — change `IKpiResultsByCategory.kpiResults` type to `IKpiResultGroup[]` and update `KpiCard`/`KpiMultiple` call-sites to pass typed `IKpiResultGroup`/`IKpiResultGroup[]` props

**Checkpoint**: After T009–T015, the public `kpis.astro` KPI dashboard and `[labId].astro` single-KPI cards display all `results[]` entries. User Story 1 is independently testable.

---

## Phase 4: User Story 2 — Consistent Multi-Entry Behavior Across All Public Pages (Priority: P2)

**Goal**: Same multi-entry behavior extends to modal split charts (`modal-split.astro`, `ModalSplitLivingLabsCard`) and the living lab city detail page (`[labId].astro` modal split section).

**Independent Test**: Load the same living lab dataset in all three public pages; confirm entry count and ordering match. Isolated verification via `living-lab.test.ts` and `ModalSplitLivingLabsCard.test.tsx`.

### Tests for User Story 2 (MANDATORY) ⚠️

> **Write these first; confirm they FAIL before writing any implementation.**

- [X] T016 [P] [US2] Update `src/components/react/KPIsDashboard/ModalSplitLivingLabsCard.test.tsx` — replace `before`/`after` fixture data with `entries: [...]` (3+ entries per lab) and add assertion that all entries produce separate chart datasets (not collapsed to two)
- [X] T017 [P] [US2] Create new test file `src/lib/helpers/living-lab.test.ts` with red tests for `getModalSplitDataForDashboard`: given a lab with 4 KPI result entries per transport mode, assert the output `entries[]` has 4 items sorted by date; assert year filter narrows entries correctly
- [X] T018 [P] [US2] Update `src/components/react/KPIsDashboard/KpiLivingLabsMultipleCard.test.tsx` — update `createMockTimeline` fixture to include 4 data points (was 2) and assert summary footer shows correct total `data points` count

### Implementation for User Story 2

- [X] T019 [US2] Rewrite `getModalSplitDataForDashboard` in `src/lib/helpers/living-lab.ts` to: group lab+KPI results by date → build `ModalSplitSeriesEntry[]` per date → set `entries[]` (sorted ASC) on `IModalSplitLabData`; derive deprecated `before`/`after` alias fields from first/last entry
- [X] T020 [US2] Rewrite `getModalSplitKpiResults` in `src/lib/helpers/living-lab.ts` (used by `[labId].astro`) to produce multi-entry series output — one entry per date group — instead of hardcoded `{ before, after }` shape
- [X] T021 [US2] Update `ModalSplitLivingLabsCard.tsx` in `src/components/react/KPIsDashboard/ModalSplitLivingLabsCard.tsx` — replace `before`/`after` year-label filtering with `entries[].year` filtering; pass all filtered entries as `chartData` datasets to `ModalSplitStackedBarChart` (not just two)
- [X] T022 [US2] Update year extraction loop in `src/pages/data/modal-split.astro` (lines 27–33) to iterate `result.results[]` instead of `result.result_before`/`result.result_after`
- [X] T023 [P] [US2] Update `src/pages/living-lab-city/[labId].astro` — cast `kpi_results` as `IKpiResultGroup[]` where passed to helpers; update `kpiResultsByCategory` local type to `IKpiResultGroup[]`

**Checkpoint**: After T016–T023, all three public pages show consistent multi-entry modal split charts. User Story 2 is independently testable.

---

## Phase 5: User Story 3 — Graceful Handling of Sparse or Missing Data (Priority: P3)

**Goal**: Charts remain stable with 0, 1, 2, or many entries; invalid entries are ignored; duplicate dates are handled deterministically.

**Independent Test**: Load datasets with 0 entries (→ no-data state), 1 entry (→ single point rendered), invalid values (→ ignored without crash). Verified by edge-case sections in `multi-entry-kpi-compat.test.ts` and `living-lab.test.ts`.

### Tests for User Story 3 (MANDATORY) ⚠️

> **Write these first; confirm they FAIL before writing any implementation.**

- [X] T024 [P] [US3] Add edge-case tests to `src/components/react/KPIsDashboard/multi-entry-kpi-compat.test.ts`: `results: []` → 0 points; `results: [null dates]` → 0 points (skipped); `results: [non-numeric value]` → 0 points; 2 entries with same date → 2 deterministic points
- [X] T025 [P] [US3] Add edge-case tests to `src/lib/helpers/living-lab.test.ts`: 0 KPI results → `entries: []`; two results with identical date → stable sort order; transport mode missing for a result → entry skipped silently
- [X] T032 [P] [US3] Add rendered no-data assertion to `src/components/react/KPIsDashboard/multi-entry-kpi-compat.test.ts`: render `KpiDefault` (or `KpiCard`) with `results: []` via `@testing-library/react` and assert the text **`'No data to display'`** is present in the DOM (covers FR-007)

### Implementation for User Story 3

- [X] T026 [US3] Add invalid-entry guard in `processKpiResults` in `src/components/react/KPIsDashboard/utils.ts` — skip entries where `date` is absent/unparseable or `value` is not a finite number
- [X] T027 [US3] Add stable-sort tie-breaker (by `id` ascending) for same-date entries in `entries[]` building inside `getModalSplitDataForDashboard` in `src/lib/helpers/living-lab.ts`
- [X] T033 [US3] Implement `'No data to display'` fallback message in `src/components/react/KpiCards/KpiDefault.tsx` when `results` is empty or absent (conditional render before chart, styled consistently with existing empty states; must satisfy T032 assertion)

**Checkpoint**: All three user stories are independently functional and edge cases are covered.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify scope integrity, TypeScript compliance, and coverage gate.

- [X] T028 Audit direct `result_before`/`result_after` reads still present in files changed by this feature — grep `src/pages/data/kpis.astro`, `src/pages/data/modal-split.astro`, `src/pages/living-lab-city/[labId].astro`, `src/components/react/KPIsDashboard/utils.ts`, `src/components/react/KPIsDashboard/ModalSplitLivingLabsCard.tsx`, `src/components/react/KpiCards/KpiCard.tsx`, `src/components/react/KpiCards/KpiMultiple.tsx`, `src/components/react/KpiCards/KpiDefault.tsx`, `src/lib/helpers/living-lab.ts` — remove or replace any stale direct field reads with `results[]`-based equivalents
- [X] T029 [P] Run TypeScript strict-mode check with `npx tsc --noEmit` from repository root; fix any type errors introduced by the `IKpiResultGroup` migration
- [X] T030 [P] Run full test suite with `npm run test:run` then coverage with `npm run test:coverage`; confirm no regressions and ≥80% coverage on changed feature files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T002 and T003 are parallel with each other after T001
- **Foundational (Phase 2)**: Depends on T001 (type exists before helper uses it) — **blocks all user stories**
- **User Stories (Phase 3+)**: All depend on Phase 2 completion; stories may proceed in parallel if staffed
- **Polish (Phase 6)**: Depends on all desired user story phases completing

### User Story Dependencies

- **US1 (P1)**: Start after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Start after Phase 2 — no dependency on US1 (different files: modal split helpers vs KPI timeline utils)
- **US3 (P3)**: Start after Phase 2 — adds guards to files touched by US1 (utils.ts) and US2 (living-lab.ts); write test stubs first, implement after US1/US2 implementations exist

### Within Each User Story

1. Tests MUST be written and FAIL before implementation (Red)
2. Implement until all tests pass (Green)
3. Refactor for clarity while keeping tests green

### Parallel Opportunities Per Story

#### User Story 1 (Phase 3)
- T005, T006, T007, T008 — all test files can be created in parallel (different files)
- T009 → T010 must sequence (T010 depends on T009 signature)
- T011, T012, T013 can run in parallel after T009–T010 (different files: astro page, KpiCard, KpiMultiple)
- T014 → T015 should sequence (T015 uses T014's updated KpiCard/KpiDefault)

#### User Story 2 (Phase 4)
- T016, T017, T018 — all test files can be created in parallel
- T019 → T020 must sequence (T020 calls into same helper, T019 restructures the shared data shape)
- T021 can start in parallel after T019 (different file: component vs helper)
- T022, T023 can run in parallel after T019 (different files: astro pages)

#### User Story 3 (Phase 5)
- T024, T025, T032 — test stubs can be created in parallel
- T026, T027, T033 — implementations are in different files and can run in parallel

### Implementation Strategy

**MVP** = Phase 1 + Phase 2 + Phase 3 (User Story 1 only).  
This delivers multi-entry KPI timeline charts in `kpis.astro` and `[labId].astro` as an independently working, tested increment. Phase 4 and 5 extend to modal split and edge case robustness.

---

## Task Count Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Phase 1: Setup | T001–T003 | — |
| Phase 2: Foundational | T004 | — |
| Phase 2: Foundational | T004 (new file: `src/lib/utils/kpis.ts`) | — |
| Phase 3: User Story 1 | T005–T015, T031 (12 tasks) | US1 |
| Phase 4: User Story 2 | T016–T023 (8 tasks) | US2 |
| Phase 5: User Story 3 | T024–T027, T032–T033 (7 tasks) | US3 |
| Phase 6: Polish | T028–T030 | — |
| **Total** | **33 tasks** | |

| Story | Task count | Parallel tasks | Independent test criteria |
|-------|-----------|----------------|---------------------------|
| US1 | 12 | T005, T006, T007, T008, T011, T012, T013, T031 | 5-entry KPI shows 5 chart points + date labels in DOM in `multi-entry-kpi-compat.test.ts` |
| US2 | 8 | T016, T017, T018, T023 | Same entry count across all 3 public pages in `living-lab.test.ts` |
| US3 | 7 | T024, T025, T032, T026, T027, T033 | 0-entry renders 'No data to display'; invalid entries skipped without crash |
