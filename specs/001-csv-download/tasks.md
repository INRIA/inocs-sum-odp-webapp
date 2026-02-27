# Tasks: CSV Dataset Download

**Input**: Design documents from `specs/001-csv-download/`
**Branch**: `001-csv-download`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

**Tests**: Tests are MANDATORY. Write tests first (RED), then implement (GREEN). Each new file has a paired test file.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Create directory scaffolding. No logic, no tests needed.

- [ ] T001 Create `src/pages/api/v1/csv/` directory (will contain kpiresults.ts and projects.ts routes)
- [ ] T002 [P] Create `src/bff/controllers/` scaffold file `src/bff/controllers/csv-export.controller.ts` (empty exported class, no logic yet)
- [ ] T003 [P] Create `src/components/react/TriggerDownloadCsv/` directory with barrel `src/components/react/TriggerDownloadCsv/index.ts` (empty re-export stub)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure required by ALL user stories — CSV serializer, typed row interfaces, and the ApiClient blob method. No user story phase can start until this phase is complete.

**⚠️ CRITICAL**: Complete Phase 2 before any Phase 3/4/5 work.

### Tests for Foundational items (MANDATORY — write first, must FAIL before implementation)

- [ ] T004 [P] Create `src/bff/services/csv-export.service.test.ts` — write failing tests for `CsvSerializer`: header row correct, values double-quoted, internal quotes escaped as `""`, newlines in values produce valid CSV, throws `EmptyCsvError` for empty row array
- [ ] T005 [P] Add failing tests to `src/lib/api-client/ApiClient.test.ts` (create file if it does not exist) — `downloadCsvBlob()` calls fetch with correct URL and auth header, throws `ApiDownloadError` on non-2xx response, returns `Blob` on success

### Implementation

- [ ] T006 Define `KpiResultCsvRow` and `ProjectCsvRow` TypeScript interfaces, `KpiResultsCsvFilters`, `ProjectsCsvFilters` filter types, `EmptyCsvError` class, and `CsvHeaderDef` interface (`{ key: string; label: string }`) in `src/bff/services/csv-export.service.ts`
- [ ] T007 Implement `CsvSerializer` static class in `src/bff/services/csv-export.service.ts` — `serialize(rows, headers)` method; double-quote all values; escape `"` → `""`; throws `EmptyCsvError` when rows array is empty (satisfies T004)
- [ ] T008 [P] Implement `ApiClient.downloadCsvBlob(path: string): Promise<Blob>` in `src/lib/api-client/ApiClient.ts` — builds URL and injects auth header same as `request<T>()`; calls `res.blob()`; throws `ApiDownloadError` on non-ok response (satisfies T005)
- [ ] T009 Implement `CsvExportRepository` scaffold in `src/bff/repositories/csv-export.repository.ts` — class with `findKpiResultsForCsv` and `findProjectsForCsv` method signatures; throw `Error("not implemented")` stubs until Phase 3/4

**Checkpoint**: Foundation ready — `CsvSerializer` tests pass, `ApiClient.downloadCsvBlob` tests pass, TypeScript compiles

---

## Phase 3: User Story 1 — Download KPI Results (Priority: P1) 🎯 MVP

**Goal**: Users can click a download button on any KPI-related page and receive a `kpi-results.csv` file filtered by lab, KPI group, or KPI definition.

**Independent Test**: Navigate to a KPI results page, click the download button, confirm a valid CSV file is downloaded with columns: Lab, KPI Number, KPI Name, KPI Group, Metric, Value, Date, Transport Mode. Filter by lab and confirm only matching rows appear.

### Tests for User Story 1 (MANDATORY — write first, must FAIL before implementation)

- [ ] T010 [P] [US1] Create `src/pages/api/v1/csv/kpiresults.test.ts` — write failing tests: no filters → 200 + `Content-Disposition: attachment` + CSV header row present; `living_lab_id` filter → 200 + correct rows passed to service; `category_id` filter → 200; `living_lab_id + kpidefinition_id` → 200; no rows → 404 with error JSON; invalid `living_lab_id` (non-integer) → 400; service throws → 500
- [ ] T011 [P] [US1] Create `src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.test.tsx` — write failing tests (using `@testing-library/react` + `@testing-library/user-event`): renders correct idle label per `type`; `ArchiveBoxArrowDownIcon` present in idle state; shows loading spinner while `downloadCsvBlob` is pending; calls `downloadCsvBlob` with correct path for `kpi-results-all`, `kpi-results-lab`, `kpi-results-definition`, `kpi-results-category`; button disabled when required filter prop is missing; shows error message on `ApiDownloadError`; `sm` size renders `RButton` with `xs` size class; returns to idle state after successful download

### Implementation for User Story 1

- [ ] T012 [US1] Implement `CsvExportRepository.findKpiResultsForCsv(filters)` in `src/bff/repositories/csv-export.repository.ts` — Prisma `kpiresults.findMany` with `include: { living_lab: true, kpidefinition: { include: { kpidefinitions_category: { include: { category: true } } } }, transport_mode: true }`; dynamic `where` clause from filters; maps rows to `KpiResultCsvRow[]` (no BigInt fields, no internal IDs)
- [ ] T013 [US1] Implement `CsvExportService.getKpiResultsCsv(filters)` in `src/bff/services/csv-export.service.ts` — calls `CsvExportRepository.findKpiResultsForCsv`; delegates to `CsvSerializer.serialize` with KPI result headers; propagates `EmptyCsvError`
- [ ] T014 [US1] Implement `CsvExportController.getKpiResultsCsv(filters)` in `src/bff/controllers/csv-export.controller.ts` — delegates to service; no business logic
- [ ] T015 [US1] Implement `GET /api/v1/csv/kpiresults` Astro route in `src/pages/api/v1/csv/kpiresults.ts` — parse and validate `living_lab_id`, `category_id`, `kpidefinition_id` query params (positive integer or absent); call controller; return `Response` with `Content-Type: text/csv`, `Content-Disposition: attachment; filename="kpi-results.csv"`; catch `EmptyCsvError` → 404, validation error → 400, unknown error → 500 (satisfies T010)
- [ ] T016 [P] [US1] Implement `TriggerDownloadCsv` React component in `src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.tsx` — supports `type: DownloadType`, `size?: 'sm'|'md'|'lg'` (maps `sm` → RButton `xs`), filter props `living_lab_id?`, `category_id?`, `kpidefinition_id?`, `disabled?`; idle state renders `ArchiveBoxArrowDownIcon` + label from type map; loading state renders spinner SVG + "Downloading…"; error state shows `ApiDownloadError` message inline; on click builds path from type + filter props, calls `apiClient.downloadCsvBlob`, creates `<a download>` with object URL on success; uses `RButton` wrapper (satisfies T011 for kpi types) — **Disabled-state rule**: for `kpi-results-lab` type, `living_lab_id` is required (button is disabled when absent); `kpidefinition_id` is optional and does NOT affect the disabled state — **Astro embedding**: any `.astro` page or component that renders `TriggerDownloadCsv` directly MUST include a `client:load` (or `client:visible`) directive on the island to enable React hydration; without it the button renders as static HTML and `onClick` never fires
- [ ] T017 [US1] Export `TriggerDownloadCsv` and `TriggerDownloadCsvProps` and `DownloadType` from `src/components/react/TriggerDownloadCsv/index.ts`

**Checkpoint**: US1 complete — KPI results can be downloaded via the API route and the `TriggerDownloadCsv` component renders, downloads, and handles errors for all kpi-results download types

---

## Phase 4: User Story 2 — Download Measures Implementation (Priority: P2)

**Goal**: Users can download a CSV of project measures implemented by living labs, optionally filtered by lab.

**Independent Test**: Call `GET /api/v1/csv/projects` and confirm a valid CSV is returned with columns: Lab, Project Name, Project Type, Start Date, Description. Call with `?living_lab_id=3` and confirm only that lab's measures are included.

### Tests for User Story 2 (MANDATORY — write first, must FAIL before implementation)

- [ ] T018 [P] [US2] Create `src/pages/api/v1/csv/projects.test.ts` — write failing tests: no filters → 200 + `Content-Disposition: attachment` + CSV header row present; `living_lab_id` filter → 200 + only matching lab rows; no rows → 404 with error JSON; invalid `living_lab_id` → 400; service throws → 500

### Implementation for User Story 2

- [ ] T019 [US2] Implement `CsvExportRepository.findProjectsForCsv(filters)` in `src/bff/repositories/csv-export.repository.ts` — Prisma `living_lab_projects_implementation.findMany` with `include: { lab: true, project: true }`; dynamic `where` clause from `living_lab_id` filter; maps rows to `ProjectCsvRow[]` (Date formatted as YYYY-MM-DD or empty string; nullable description as empty string)
- [ ] T020 [US2] Implement `CsvExportService.getProjectsCsv(filters)` in `src/bff/services/csv-export.service.ts` — calls `CsvExportRepository.findProjectsForCsv`; delegates to `CsvSerializer.serialize` with projects headers; propagates `EmptyCsvError`
- [ ] T021 [US2] Implement `CsvExportController.getProjectsCsv(filters)` in `src/bff/controllers/csv-export.controller.ts` — delegates to service; no business logic
- [ ] T022 [US2] Implement `GET /api/v1/csv/projects` Astro route in `src/pages/api/v1/csv/projects.ts` — parse and validate `living_lab_id` query param; call controller; return `Response` with `Content-Type: text/csv`, `Content-Disposition: attachment; filename="projects.csv"`; catch `EmptyCsvError` → 404, validation error → 400, unknown error → 500 (satisfies T018)
- [ ] T023 [P] [US2] (depends on T016 committed) Add `'projects-all'` and `'projects-lab'` type support to `TriggerDownloadCsv` in `src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.tsx` — extend `DownloadType` union, label map, and path builder for the two new project download types
- [ ] T024 [P] [US2] Add test cases to `src/components/react/TriggerDownloadCsv/TriggerDownloadCsv.test.tsx` — `projects-all` calls `/csv/projects`; `projects-lab` calls `/csv/projects?living_lab_id=X`; button disabled when `projects-lab` type and no `living_lab_id` provided (satisfies T018 component side)

**Checkpoint**: US2 complete — Projects CSV is downloadable independently; both kpi and projects download types are supported in `TriggerDownloadCsv`

---

## Phase 5: User Story 3 — Contextual Download Button in KpiCard (Priority: P3)

**Goal**: The download button appears contextually in `KpiCard` so users can download single-KPI-per-lab data directly from the KPI dashboard.

**Independent Test**: Render `KpiCard` with `kpiResults` prop populated and verify the `TriggerDownloadCsv` button is visible with label "Lab KPIs CSV" and correct `living_lab_id` and `kpidefinition_id` props. Verify it is NOT rendered when `kpiResults` is undefined.

### Tests for User Story 3 (MANDATORY — write first, must FAIL before implementation)

- [ ] T025 [P] [US3] Create `src/components/react/KpiCards/KpiCard.test.tsx` (or add to existing file if present) — write failing tests: `TriggerDownloadCsv` rendered with `type="kpi-results-lab"` when `kpiResults` is defined; receives correct `living_lab_id` from `kpiResults.living_lab_id`; receives correct `kpidefinition_id` from `kpi.id`; `TriggerDownloadCsv` NOT rendered when `kpiResults` is undefined; `size="sm"` prop passed

### Implementation for User Story 3

- [ ] T026 [US3] Modify `src/components/react/KpiCards/KpiCard.tsx` — import `TriggerDownloadCsv` from `@/components/react/TriggerDownloadCsv`; add `<div className="flex justify-end mt-2"><TriggerDownloadCsv type="kpi-results-lab" size="sm" living_lab_id={kpiResults.living_lab_id} kpidefinition_id={kpi.id} /></div>` inside the `kpiResults &&` conditional block, below the `KpiDefault` component (satisfies T025) — **Note**: `KpiCard` is a React component so no `client:*` directive is needed inside it; the directive is applied on the Astro page where `KpiCard` or its parent island is rendered; any new Astro page that embeds `TriggerDownloadCsv` standalone MUST use `client:load`

**Checkpoint**: US3 complete — KpiCard shows the download button for any card that has KPI results data; all three user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: TypeScript validation, barrel wiring, and final smoke test.

- [ ] T027 [P] Run `npx tsc --noEmit` — confirm zero new TypeScript errors introduced by this feature
- [ ] T028 [P] Verify `src/bff/index.ts` or `src/bff/repositories/index.ts` and `src/bff/services/index.ts` export the new `CsvExportRepository`, `CsvExportService`, and `CsvExportController` if those barrel files exist in the project
- [ ] T029 Run all new test files and confirm all pass: `npx vitest run src/pages/api/v1/csv/ src/components/react/TriggerDownloadCsv/ src/bff/services/csv-export.service.test.ts src/lib/api-client/ApiClient.test.ts src/components/react/KpiCards/KpiCard.test.tsx`
- [ ] T030 Manual smoke test per `quickstart.md` — start dev server, navigate to a KPI page, click "Lab KPIs CSV", open downloaded file in spreadsheet app and confirm headers and values are correct

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)           → no dependencies — start immediately
Phase 2 (Foundational)    → requires Phase 1 — BLOCKS all user story phases
Phase 3 (US1)             → requires Phase 2
Phase 4 (US2)             → requires Phase 2; can run in parallel with Phase 3
Phase 5 (US3)             → requires Phase 3 (TriggerDownloadCsv must exist)
Phase 6 (Polish)          → requires all phases complete
```

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Depends only on Phase 2 — can run in parallel with US1 (different files: different repository method, different route file)
- **US3 (P3)**: Depends on US1 completing T016/T017 (TriggerDownloadCsv component must exist before KpiCard can import it)

### Within Each Phase — Strict TDD Order

```
1. Write test file → confirm tests FAIL (Red)
2. Implement repository method
3. Implement service method
4. Implement controller method
5. Implement Astro route
6. Implement/extend component
7. Run tests → confirm all PASS (Green)
```

---

## Parallel Opportunities

### Phase 2 — run T004 and T005 together

```
Parallel launch:
├── T004: Write CsvSerializer tests in csv-export.service.test.ts
└── T005: Write ApiClient.downloadCsvBlob tests in ApiClient.test.ts
```

### Phase 3 + Phase 4 — run together once Phase 2 is complete

```
Developer A:
├── T010 Write kpiresults route tests
├── T012 Implement repository findKpiResultsForCsv
├── T013 Implement service getKpiResultsCsv
├── T014 Implement controller getKpiResultsCsv
└── T015 Implement GET /api/v1/csv/kpiresults route

Developer B (or same developer after US2 tests written):
├── T018 Write projects route tests
├── T019 Implement repository findProjectsForCsv
├── T020 Implement service getProjectsCsv
├── T021 Implement controller getProjectsCsv
└── T022 Implement GET /api/v1/csv/projects route
```

Both can also write their component-side tests at the same time (T011 vs T024).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) — ~15 min
2. Complete Phase 2 (Foundational) — CsvSerializer + ApiClient blob — ~1h
3. Complete Phase 3 (US1) — KPI results API + TriggerDownloadCsv — ~2–3h
4. **STOP and VALIDATE**: `GET /api/v1/csv/kpiresults` works, button downloads file
5. Ship MVP — US2 and US3 are optional follow-ons

### Incremental Delivery

| Stage | Delivers |
|---|---|
| Setup + Foundational | Infrastructure ready |
| + US1 | KPI result downloads working in all kpi-results scopes |
| + US2 | Project measure downloads added |
| + US3 | Inline KpiCard download button live |
| + Polish | Clean TypeScript, barrel exports, smoke tested |

---

## Task Count Summary

| Phase | Tasks | Parallelizable |
|---|---|---|
| Phase 1: Setup | 3 | 2 |
| Phase 2: Foundational | 6 | 4 |
| Phase 3: US1 (P1) | 8 | 4 |
| Phase 4: US2 (P2) | 7 | 3 |
| Phase 5: US3 (P3) | 2 | 1 |
| Phase 6: Polish | 4 | 2 |
| **Total** | **30** | **16** |

- **New test files**: 5 (`csv-export.service.test.ts`, `ApiClient.test.ts`, `kpiresults.test.ts`, `TriggerDownloadCsv.test.tsx`, `KpiCard.test.tsx`)
- **New source files**: 6 (`csv-export.repository.ts`, `csv-export.service.ts`, `csv-export.controller.ts`, `kpiresults.ts` route, `projects.ts` route, `TriggerDownloadCsv.tsx`)
- **Modified files**: 2 (`ApiClient.ts`, `KpiCard.tsx`)
