# Tasks: Platform Analytics Dashboard

**Input**: Design documents from `/specs/002-admin-analytics-dashboard/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Tests are MANDATORY for all new features. Write tests first, ensure they fail,
then implement. Each feature MUST add at least one new dedicated test file.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure - single Astro project:
- **Page**: `src/pages/lab-admin/analytics.astro`
- **Components**: `src/components/react/Analytics/`
- **Helpers**: `src/lib/helpers/analytics.ts`
- **API Client**: `src/lib/api-client/ApiClient.ts`
- **API Route**: `src/pages/api/v1/users.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and component structure

- [X] T001 Create Analytics component directory at src/components/react/Analytics/
- [X] T002 [P] Create shared TypeScript interfaces in src/components/react/Analytics/types.ts
- [X] T003 [P] Create barrel export in src/components/react/Analytics/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### API Infrastructure

- [X] T004 Add getUsers() method to ApiClient in src/lib/api-client/ApiClient.ts (per research.md R-010)
- [X] T005 Update GET /api/v1/users route in src/pages/api/v1/users.ts to support no-filter all-users query

### Analytics Helper Module

- [X] T006 Create analytics helper module skeleton in src/lib/helpers/analytics.ts with exported function signatures
- [X] T007 [P] Create analytics helper test file in src/lib/helpers/analytics.test.ts with test stubs

### Page Foundation

- [X] T008 Create analytics.astro page skeleton at src/pages/lab-admin/analytics.astro with SSR data fetching via ApiClient

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Platform Overview Metrics (Priority: P1) 🎯 MVP

**Goal**: Display high-level summary cards showing total counts for living labs, registered users, KPI definitions, KPI results submitted, and measures adopted across the platform.

**Independent Test**: Navigate to `/lab-admin/analytics` and verify all 5 summary metric cards render with correct aggregated counts. Delivers immediate value as a platform health indicator.

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T009 [P] [US1] Add test for computeMetricCards() helper in src/lib/helpers/analytics.test.ts covering all 5 metrics
- [X] T010 [P] [US1] Add test for MetricCard component rendering in src/components/react/Analytics/MetricCard.test.tsx
- [X] T011 [P] [US1] Add edge-case tests for empty data (zero counts display) in analytics.test.ts
- [X] T012 [P] [US1] Add test for user count breakdown (active vs pending) computation

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement MetricCardData interface in src/components/react/Analytics/types.ts
- [X] T014 [US1] Implement computeMetricCards() helper function in src/lib/helpers/analytics.ts
- [X] T015 [US1] Implement MetricCard React component (SSR-only, no client:*) in src/components/react/Analytics/MetricCard.tsx
- [X] T016 [US1] Integrate MetricCard components into analytics.astro page with computed data props
- [X] T017 [US1] Add styling for metric cards section using existing Tailwind classes

**Checkpoint**: User Story 1 complete - admin can view platform overview metrics independently

---

## Phase 4: User Story 2 - View KPI Results Breakdown by Living Lab (Priority: P2)

**Goal**: Display a breakdown of KPI results grouped by living lab, showing how many main/parent KPI results have been submitted and which KPI categories are covered per lab.

**Independent Test**: Verify per-living-lab KPI results section renders with lab names, KPI result counts, and KPI coverage counts. Data correctness validated against known seed data.

### Tests for User Story 2 (MANDATORY) ⚠️

- [X] T018 [P] [US2] Add test for computeLabMetricsTable() helper in src/lib/helpers/analytics.test.ts
- [X] T019 [P] [US2] Add test for getMainKpis() helper to filter parent-only KPIs in analytics.test.ts
- [X] T020 [P] [US2] Add test for KPI result-to-parent mapping logic (per research.md R-004) in analytics.test.ts
- [X] T021 [P] [US2] Add test for LivingLabMetricsTable component rendering in src/components/react/Analytics/LivingLabMetricsTable.test.tsx
- [X] T022 [P] [US2] Add edge-case test for labs with zero KPI results displaying correctly

### Implementation for User Story 2

- [X] T023 [P] [US2] Implement LivingLabMetricsRow interface in src/components/react/Analytics/types.ts
- [X] T024 [P] [US2] Implement getMainKpis() helper function in src/lib/helpers/analytics.ts
- [X] T025 [US2] Implement computeLabMetricsTable() helper function in src/lib/helpers/analytics.ts
- [X] T026 [US2] Implement LivingLabMetricsTable React component (SSR-only) in src/components/react/Analytics/LivingLabMetricsTable.tsx
- [X] T027 [US2] Integrate LivingLabMetricsTable into analytics.astro page with computed data props
- [X] T028 [P] [US2] Add test for computeLabKpiTimeline() helper for D3 line chart data in analytics.test.ts
- [X] T029 [P] [US2] Add test for D3LineChartLabKPIsOvertime component in src/components/react/Analytics/D3LineChartLabKPIsOvertime.test.tsx
- [X] T030 [P] [US2] Implement LabKpiTimelineSeries interface in src/components/react/Analytics/types.ts
- [X] T031 [US2] Implement computeLabKpiTimeline() helper function in src/lib/helpers/analytics.ts
- [X] T032 [US2] Implement D3LineChartLabKPIsOvertime React component (client:load) in src/components/react/Analytics/D3LineChartLabKPIsOvertime.tsx
- [X] T033 [US2] Integrate D3LineChartLabKPIsOvertime into analytics.astro page with client:load directive

**Checkpoint**: User Story 2 complete - admin can view KPI results breakdown per living lab and trends over time

---

## Phase 5: User Story 3 - View Measures Adoption Breakdown by Living Lab (Priority: P3)

**Goal**: Display a breakdown of measures adopted by each living lab, including PUSH and PULL measure counts per lab.

**Independent Test**: Verify per-living-lab measures section renders with each lab showing its PUSH and PULL measure counts. Delivers standalone value for monitoring measure adoption.

### Tests for User Story 3 (MANDATORY) ⚠️

- [X] T034 [P] [US3] Add test for computeLabMeasuresBar() helper in src/lib/helpers/analytics.test.ts
- [X] T035 [P] [US3] Add test for D3BarChartLabMeasures component rendering in src/components/react/Analytics/D3BarChartLabMeasures.test.tsx
- [X] T036 [P] [US3] Add edge-case test for labs with zero measures displaying correctly

### Implementation for User Story 3

- [X] T037 [P] [US3] Implement LabMeasuresBarData interface in src/components/react/Analytics/types.ts
- [X] T038 [US3] Implement computeLabMeasuresBar() helper function in src/lib/helpers/analytics.ts
- [X] T039 [US3] Implement D3BarChartLabMeasures React component (client:load) in src/components/react/Analytics/D3BarChartLabMeasures.tsx
- [X] T040 [US3] Integrate D3BarChartLabMeasures into analytics.astro page with client:load directive

**Checkpoint**: User Story 3 complete - admin can view measures adoption breakdown per living lab

---

## Phase 6: User Story 4 - View KPI Definitions Summary (Priority: P4)

**Goal**: Display a summary of all main/parent KPI definitions available on the platform, distinguishing between GLOBAL and LOCAL KPI types.

**Independent Test**: Verify KPI definitions section renders with correct counts of GLOBAL vs LOCAL main/parent KPIs.

### Tests for User Story 4 (MANDATORY) ⚠️

- [X] T041 [P] [US4] Add test for computeKpiCoverageTable() helper in src/lib/helpers/analytics.test.ts
- [X] T042 [P] [US4] Add test for KPICoverageTable component rendering in src/components/react/Analytics/KPICoverageTable.test.tsx
- [X] T043 [P] [US4] Add edge-case test for KPI type filtering (only parent KPIs included)

### Implementation for User Story 4

- [X] T044 [P] [US4] Implement KpiCoverageRow interface in src/components/react/Analytics/types.ts
- [X] T045 [US4] Implement computeKpiCoverageTable() helper function in src/lib/helpers/analytics.ts
- [X] T046 [US4] Implement KPICoverageTable React component (SSR-only) in src/components/react/Analytics/KPICoverageTable.tsx
- [X] T047 [US4] Integrate KPICoverageTable into analytics.astro page with computed data props

**Checkpoint**: User Story 4 complete - admin can view KPI definitions summary with type breakdown

---

## Phase 7: Analytics Alerts & Edge Cases

**Goal**: Display warning cards for anomalies (labs with no KPI results, labs with no measures, KPIs with no results, pending users) and handle all edge cases gracefully.

### Tests (MANDATORY) ⚠️

- [X] T048 [P] Add test for computeAlerts() helper covering all alert types in src/lib/helpers/analytics.test.ts
- [X] T049 [P] Add test for AnalyticsAlerts component rendering by severity in src/components/react/Analytics/AnalyticsAlerts.test.tsx
- [X] T050 [P] Add edge-case test for platform with no living labs (empty state handling)
- [X] T051 [P] Add edge-case test for data retrieval failure (partial render with error message)

### Implementation

- [X] T052 [P] Implement AlertCardData interface in src/components/react/Analytics/types.ts
- [X] T053 Implement computeAlerts() helper function in src/lib/helpers/analytics.ts
- [X] T054 Implement AnalyticsAlerts React component (SSR-only) in src/components/react/Analytics/AnalyticsAlerts.tsx
- [X] T055 Integrate AnalyticsAlerts into analytics.astro page with computed data props
- [X] T056 Add error boundary handling in analytics.astro for partial data fetch failures

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T057 [P] Update barrel export in src/components/react/Analytics/index.ts with all components
- [X] T058 [P] Add responsive design adjustments for metric cards and tables
- [X] T059 [P] Add breadcrumb navigation to analytics page using existing Layout component
- [X] T060 Verify page loads within 3 seconds for up to 50 living labs, 500 KPI results, 200 measures (SC-002)
- [X] T061 [P] Add hover tooltips to D3 charts for data point details
- [X] T062 Validate all displayed counts match underlying data (SC-003)
- [X] T063 Run quickstart.md validation - navigate to page and verify all sections render
- [X] T064 [P] Run full test suite: npx vitest run src/lib/helpers/analytics.test.ts && npx vitest run src/components/react/Analytics/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) or sequentially in priority order
- **Alerts (Phase 7)**: Can run in parallel with User Stories 2-4, depends only on Phase 2
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Independent of US1/US2/US3

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Interfaces/types before helper functions
- Helper functions before components
- Components before integration into analytics.astro
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel
- All Foundational tasks marked [P] (T007) can run in parallel with sequential tasks
- Once Foundational phase completes, all user stories can start in parallel
- All test tasks marked [P] within a story can run in parallel
- Interface definitions marked [P] across stories can run in parallel

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task: T009 "Add test for computeMetricCards() helper"
Task: T010 "Add test for MetricCard component rendering"
Task: T011 "Add edge-case tests for empty data"
Task: T012 "Add test for user count breakdown computation"
```

## Parallel Example: User Story 2 + 3 Implementation

```bash
# After Phase 2 completes, launch in parallel:
# Team A - User Story 2:
Task: T023 "Implement LivingLabMetricsRow interface"
Task: T024 "Implement getMainKpis() helper"

# Team B - User Story 3:
Task: T037 "Implement LabMeasuresBarData interface"
Task: T038 "Implement computeLabMeasuresBar() helper"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T017)
4. **STOP and VALIDATE**: Navigate to `/lab-admin/analytics`, verify 5 metric cards display
5. Deploy/demo if ready - admin can see platform health at a glance

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (KPI breakdown per lab)
4. Add User Story 3 → Test independently → Deploy/Demo (Measures breakdown per lab)
5. Add User Story 4 → Test independently → Deploy/Demo (KPI definitions summary)
6. Add Phase 7 → Test independently → Deploy/Demo (Analytics alerts)
7. Polish → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 4
   - Developer B: User Story 2 + User Story 3
   - Developer C: Phase 7 (Alerts)
3. Stories complete and integrate independently

---

## File Summary

| File | Type | User Stories |
|------|------|--------------|
| src/components/react/Analytics/types.ts | NEW | All |
| src/components/react/Analytics/index.ts | NEW | All |
| src/lib/helpers/analytics.ts | NEW | All |
| src/lib/helpers/analytics.test.ts | NEW | All |
| src/components/react/Analytics/MetricCard.tsx | NEW | US1 |
| src/components/react/Analytics/MetricCard.test.tsx | NEW | US1 |
| src/components/react/Analytics/LivingLabMetricsTable.tsx | NEW | US2 |
| src/components/react/Analytics/LivingLabMetricsTable.test.tsx | NEW | US2 |
| src/components/react/Analytics/D3LineChartLabKPIsOvertime.tsx | NEW | US2 |
| src/components/react/Analytics/D3LineChartLabKPIsOvertime.test.tsx | NEW | US2 |
| src/components/react/Analytics/D3BarChartLabMeasures.tsx | NEW | US3 |
| src/components/react/Analytics/D3BarChartLabMeasures.test.tsx | NEW | US3 |
| src/components/react/Analytics/KPICoverageTable.tsx | NEW | US4 |
| src/components/react/Analytics/KPICoverageTable.test.tsx | NEW | US4 |
| src/components/react/Analytics/AnalyticsAlerts.tsx | NEW | Alerts |
| src/components/react/Analytics/AnalyticsAlerts.test.tsx | NEW | Alerts |
| src/pages/lab-admin/analytics.astro | NEW | All |
| src/lib/api-client/ApiClient.ts | MODIFIED | Foundation |
| src/pages/api/v1/users.ts | MODIFIED | Foundation |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing (TDD per constitution)
- 4 components are SSR-only (no client:* directive) for zero client JS
- 2 D3 components use client:load for DOM access (required for D3)
- All data aggregation happens in Astro frontmatter (SSR)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
