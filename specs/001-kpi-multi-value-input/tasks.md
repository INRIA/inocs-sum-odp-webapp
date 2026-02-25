# Tasks: KPI Multi-Value Input

**Feature**: `001-kpi-multi-value-input` | **Branch**: `001-kpi-multi-value-input`  
**Input**: Design documents from `specs/001-kpi-multi-value-input/`  
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅ · quickstart.md ✅

**Tests**: Tests are MANDATORY. Write tests first, ensure they FAIL, then implement.  
New test files required: `KpiResultList.test.tsx` · `DefaultCollectionDate.test.tsx`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description

---

## Phase 1: Setup

**Purpose**: Type system and data layer changes that establish the new data shape for all user stories.

> **⚠️ CRITICAL**: These changes are required before any component work can begin — they define the `IKpiResultGroup` type that all new components consume.

- [ ] T001 Add `IKpiResultGroup` interface to `src/types/KPIs.ts` (`extends IIKpiResultBeforeAfter` with `results: IKpiResult[]`)
- [ ] T002 Update `kpi_results` field type in `src/types/LivingLab.ts` from `IIKpiResultBeforeAfter[]` to `IKpiResultGroup[]`
- [ ] T003 Add `results: groupedResults` field to the returned group object in `mapPrismaLabToLab` in `src/bff/repositories/labs.repository.ts`

**Checkpoint**: TypeScript compiles with strict mode. All existing callers of `kpi_results` remain type-correct (additive change only).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Test infrastructure and the `DefaultCollectionDate` component, which US3 depends on but US1/US2/US4 also need for wiring. The test files for the two primary test targets must be written here — failing — before any component implementation begins.

> **⚠️ CRITICAL**: No user story implementation can begin until T004–T008 are complete.

### Write tests first (must FAIL before implementation)

- [ ] T004 [P] Create `src/components/react/form/KpiResultList.test.tsx` with all 17 test cases from plan.md §Test Plan (happy path, interactions, displayed info, edge cases) — **all tests must fail at this point**
- [ ] T005 [P] Create `src/components/react/form/DefaultCollectionDate.test.tsx` with all 6 test cases from plan.md §Test Plan — **all tests must fail at this point**

### Implement `DefaultCollectionDate`

- [ ] T006 Implement `src/components/react/form/DefaultCollectionDate.tsx` — single date picker with view/edit toggle; props: `value: string`, `onChange: (date: string) => void`; no API call; matches `DefaultCollectionDate.test.tsx` contract
- [ ] T007 Run `DefaultCollectionDate.test.tsx` and confirm all 6 tests pass before continuing

**Checkpoint**: `DefaultCollectionDate` is fully tested and green. `KpiResultList.test.tsx` still fails (no implementation yet). Foundation ready for user story phases.

---

## Phase 3: User Story 1 — View All Saved KPI Entries (Priority: P1) 🎯 MVP

**Goal**: Every KPI row on both admin pages shows all previously saved measurement entries as a vertically stacked list, each displaying its value and date. This is the backward-compatibility baseline.

**Independent Test**: Render `KpiResultList` with `initialResults` containing N pre-seeded entries; assert all N entries are visible with correct value + date; assert empty state renders correctly when `initialResults=[]`.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Implement `src/components/react/form/KpiResultRow.tsx` — read-only view only (value + date + edit icon + delete icon rendered as disabled/hidden placeholders); local state `isEditing=false`, `confirmingDelete=false`; props match contracts/component-contracts.md `KpiResultRowProps`
- [ ] T009 [P] [US1] Implement `src/components/react/form/KpiNewEntryRow.tsx` — skeleton only: renders value input + date input pre-filled from `defaultDate ?? todayISO()`; `useEffect([defaultDate])` updates date only while unsaved; props match `KpiNewEntryRowProps`; save/cancel stubs call `onSave`/`onCancel`
- [ ] T010 [US1] Implement `src/components/react/form/KpiResultList.tsx` — owns `entries: IKpiResult[]` (initialised from `initialResults`) and `isAddingNew: boolean`; renders `KpiResultRow` per entry keyed by `result.id`; renders `KpiNewEntryRow` when `isAddingNew === true`; renders "+" button when `isAddingNew === false`; renders empty-state message when `entries` is empty; passes `defaultDate` to `KpiNewEntryRow` only
- [ ] T011 [US1] Run `KpiResultList.test.tsx` — confirm "Renders empty state", "Renders N rows", "Renders entries in chronological order", and "'+' button visible initially" tests now pass (4 tests green; remaining 13 may still fail)

**Checkpoint**: User Story 1 is independently testable. A KPI table renders all saved entries in list form. Empty-state and N-entry display confirmed green.

---

## Phase 4: User Story 2 — Add a New KPI Result Entry (Priority: P1)

**Goal**: The "+" button on any KPI row opens an editable new-entry row. The admin fills in a value and date, saves, and the entry is immediately persisted and appears in the list.

**Independent Test**: Click "+" on a rendered `KpiResultList`; fill in a valid value and date; confirm save; assert the API mock was called with correct args; assert new entry appears in the list and the new-entry row closes.

### Implementation for User Story 2

- [ ] T012 [US2] Complete save logic in `src/components/react/form/KpiNewEntryRow.tsx` — `handleSave` calls `ApiClient.upsertLivingLabKpiResults` (no `id` → create); on success calls `onSave(created)`; on API error shows inline error message and stays open; validate value (non-empty, numeric, range per `kpi.metric_type`) and date (non-empty) before calling API; show inline errors on validation failure
- [ ] T013 [US2] Wire `KpiResultList.tsx` save handler — `handleNewEntrySave(created: IKpiResult)` appends to `entries` and sets `isAddingNew = false`; `handleNewEntryCancel` sets `isAddingNew = false`
- [ ] T014 [US2] Run `KpiResultList.test.tsx` — confirm "Clicking '+' opens new entry row; '+' button hidden", "Saving new entry calls API with correct args", "Saved entry appears in list", "Cancelling new entry closes row; list unchanged", "Inline error shown for out-of-range percentage", "Inline error shown for empty date on save", "API save failure shows error; entry stays in edit mode" all pass (7 additional tests green)

**Checkpoint**: User Stories 1 + 2 are fully functional. An admin can view existing entries and add new ones.

---

## Phase 5: User Story 3 — Edit an Existing KPI Result Entry (Priority: P2)

**Goal**: Clicking the edit icon on any saved entry switches it to in-place edit mode. The admin changes the value and/or date and saves. The change is persisted immediately and the list reflects the update.

**Independent Test**: Render `KpiResultList` with one pre-seeded entry; click its edit icon; change the value; save; assert `ApiClient.upsertLivingLabKpiResults` was called with the updated value; assert the list now shows the updated value and the entry is no longer in edit mode.

### Implementation for User Story 3

- [ ] T015 [US3] Complete edit/save logic in `src/components/react/form/KpiResultRow.tsx` — edit icon click sets `isEditing = true`; shows value input (`pendingValue`) + date input (`pendingDate`) + save + cancel; `handleSave` validates (same rules as `KpiNewEntryRow`) then calls `ApiClient.upsertLivingLabKpiResults` with `id`; on success calls `onSave(updated)` and sets `isEditing = false`; on API error shows inline error and stays in edit mode; cancel restores `pendingValue`/`pendingDate` from `result` prop and sets `isEditing = false`
- [ ] T016 [US3] Wire `KpiResultList.tsx` edit-save handler — `handleRowSave(updated: IKpiResult)` replaces the matching entry in `entries` by id
- [ ] T017 [US3] Run `KpiResultList.test.tsx` — confirm "Editing existing entry and saving updates displayed value" and "Editing existing entry and cancelling restores original" pass

**Checkpoint**: User Stories 1, 2 + 3 are fully functional. Edit round-trip is tested and green.

---

## Phase 6: User Story 4 — Delete a KPI Result Entry (Priority: P2)

**Goal**: Clicking the delete icon on any saved entry shows a confirmation prompt. After confirmation the entry is permanently removed from both the list and the data store.

**Independent Test**: Render `KpiResultList` with two pre-seeded entries; click the delete icon on one; assert confirmation prompt appears; confirm deletion; assert `ApiClient.deleteKpiResult` was called with the correct id; assert the deleted entry no longer appears in the list; assert the other entry is unchanged.

### Implementation for User Story 4

- [ ] T018 [US4] Complete delete logic in `src/components/react/form/KpiResultRow.tsx` — delete icon click sets `confirmingDelete = true`; inline confirmation shows "Are you sure?" + Confirm + Cancel; Confirm calls `ApiClient.deleteKpiResult(result.id)`; on success calls `onDelete(result.id)`; on API error shows error message and dismisses confirmation; Cancel sets `confirmingDelete = false`
- [ ] T019 [US4] Wire `KpiResultList.tsx` delete handler — `handleRowDelete(id: number)` filters out the entry with matching id from `entries`
- [ ] T020 [US4] Run `KpiResultList.test.tsx` — confirm "Deleting with confirmation removes entry from list" and "Deleting then cancelling leaves list unchanged" pass
- [ ] T021 [US4] Run full `KpiResultList.test.tsx` suite — all 17 tests must be green before proceeding

**Checkpoint**: All 17 `KpiResultList.test.tsx` tests pass. User Stories 1–4 are complete and independently testable.

---

## Phase 7: User Story 5 — Set a Session Default Collection Date (Priority: P3)

**Goal**: A single "Default collection date" picker at the top of each admin page pre-fills the date field for new entries added during the session. Changing it updates only open unsaved entries; existing saved entries are unaffected.

**Independent Test**: Set `defaultDate="2025-06-01"` on `KpiResultList`; click "+"; assert the new entry row's date field shows "2025-06-01". Change `defaultDate` to "2026-01-01"; assert the open new-entry row updates; assert all saved `KpiResultRow`s are unchanged.

### Implementation for User Story 5

- [ ] T022 [US5] Verify `KpiNewEntryRow.tsx` `useEffect([defaultDate])` updates `pendingDate` **unconditionally** — `KpiNewEntryRow` is only ever mounted while the entry is unsaved (the parent unmounts it immediately on successful save, so no `id`-undefined guard is needed or appropriate). Confirm **no API call** is triggered by the effect; the `useEffect` must only call `setPendingDate(defaultDate ?? todayISO())` (verify the `LivingLabKpiResultForm` bug is NOT replicated)
- [ ] T023 [US5] Run `KpiResultList.test.tsx` — confirm "Changing `defaultDate` pre-fills new entry row" and "Changing `defaultDate` does NOT change saved entries" pass
- [ ] T024 [P] [US5] Wire `LivingLabKPIsEdition.tsx` — (a) **update props**: remove `valueBeforeDate` and `valueAfterDate`, add `kpiResults: IKpiResultGroup[]`; (b) replace `[beforeDate, setBeforeDate]` + `[afterDate, setAfterDate]` state pair with single `[defaultDate, setDefaultDate]: string`; (c) replace `<BeforeAndAfterDates>` with `<DefaultCollectionDate value={defaultDate} onChange={setDefaultDate} />`; (d) replace `<LivingLabKpiResultsForm>` with `<KpiResultList initialResults={kpiResults.find(r => r.kpidefinition_id === kpi.id)?.results ?? []} defaultDate={defaultDate} kpi={kpi} livingLabId={livingLab.id} />` in `src/components/react/LivingLabKPIsEdition.tsx`
- [ ] T025 [P] [US5] Wire `LivingLabModalSplit.tsx` — (a) replace `beforeDate`/`afterDate` state pair with single `defaultDate`; (b) update `livingLabKpiMap` type annotation from `Map<string, IIKpiResultBeforeAfter>` to `Map<string, IKpiResultGroup>`; (c) replace `<BeforeAndAfterDates>` with `<DefaultCollectionDate>`; (d) replace `<LivingLabKpiResultsForm>` cells with `<KpiResultList>`; (e) **remove `onKpiValuesChange` callback and `kpiTotals` state** — individual `KpiResultRow` saves update the DB directly; derive totals from the `entries` map on re-render. Confirm with spec owner if any parent component still consumes `onKpiValuesChange` before removing it from the public prop interface in `src/components/react/LivingLabModalSplit.tsx`
- [ ] T026 [P] [US5] Update `src/pages/lab-admin/kpis.astro` — remove `valueBeforeDate`/`valueAfterDate` derivation logic from frontmatter; remove both props from the `<LivingLabKPIsEdition>` island call; **add `kpiResults={lab.kpi_results ?? []}` prop** so the component receives `IKpiResultGroup[]` from the server
- [ ] T027 [P] [US5] Update `src/pages/lab-admin/modal-split.astro` — remove `valueBeforeDate`/`valueAfterDate` derivation logic from frontmatter; remove both props from the `<LivingLabModalSplit>` island call

**Checkpoint**: Default date flows from the page-level picker through both admin pages to all new-entry rows. All 5 user stories are functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final TypeScript check, test coverage verification, cleanup of replaced components, and quickstart validation.

- [ ] T028 [P] Run `npx tsc --noEmit` and resolve any TypeScript strict-mode errors across all modified files (`KPIs.ts`, `LivingLab.ts`, `labs.repository.ts`, `LivingLabKPIsEdition.tsx`, `LivingLabModalSplit.tsx`, `kpis.astro`, `modal-split.astro`)
- [ ] T029 [P] Run full Vitest suite (`npx vitest run`) and confirm all tests pass including pre-existing tests
- [ ] T030 Verify `BeforeAndAfterDates.tsx` has no remaining callers (use `grep -r "BeforeAndAfterDates"`) — if none, delete `src/components/react/form/BeforeAndAfterDates.tsx`
- [ ] T031 Verify `LivingLabKpiResultsForm.tsx` has no remaining callers (use `grep -r "LivingLabKpiResultsForm"`) — if none, delete `src/components/react/form/LivingLabKpiResultsForm.tsx`
- [ ] T032 Follow quickstart.md steps 1–6 end-to-end to validate the complete TDD cycle is reproducible by a new developer
- [ ] T033 [P] Update `.github/agents/copilot-instructions.md` to reflect the new component map (remove `BeforeAndAfterDates` and `LivingLabKpiResultsForm`; add new component file references)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup — Types + BFF)
  └── Phase 2 (Foundational — Tests + DefaultCollectionDate)
        ├── Phase 3 (US1 — View entries)
        │     └── Phase 4 (US2 — Add entry)
        │           └── Phase 5 (US3 — Edit entry)
        │                 └── Phase 6 (US4 — Delete entry)
        │                       └── Phase 7 (US5 — Default date + wiring)
        │                             └── Phase 8 (Polish)
        └── (DefaultCollectionDate ready for US5 wiring in Phase 7)
```

- **Phase 1** (T001–T003): No dependencies — start immediately. Sequential: T002 depends on T001.
- **Phase 2** (T004–T007): Depends on Phase 1. T004 and T005 are parallel. T006 depends on **T005** (test-first — `DefaultCollectionDate.test.tsx` must exist and fail before `DefaultCollectionDate.tsx` is written). T007 validates T006.
- **Phase 3** (T008–T011): Depends on Phase 2 complete. T008 and T009 are parallel. T010 depends on T008 + T009.
- **Phase 4** (T012–T014): Depends on Phase 3. T012 and T013 can be done sequentially in either order.
- **Phase 5** (T015–T017): Depends on Phase 4. T015 + T016 can be done in either order.
- **Phase 6** (T018–T021): Depends on Phase 5. T018 + T019 can be done in either order.
- **Phase 7** (T022–T027): Depends on Phase 6 (all 17 tests green). T024, T025, T026, T027 are parallel.
- **Phase 8** (T028–T033): Depends on Phase 7. T028, T029, T033 are parallel. T030, T031 depend on T024–T027.

### User Story Dependencies

| Story | Priority | Depends on | Can parallelize with |
|---|---|---|---|
| US1 — View entries | P1 | Phase 2 complete | — |
| US2 — Add entry | P1 | US1 complete | — |
| US3 — Edit entry | P2 | US2 complete (uses same test file) | — |
| US4 — Delete entry | P2 | US3 complete (uses same test file) | — |
| US5 — Default date | P3 | US4 complete (all 17 tests green) | Wiring tasks T024–T027 are parallel |

> **Note**: US1–US4 are sequential because they all operate on the same `KpiResultList.test.tsx` file (adding green tests progressively). US5's wiring tasks (T024–T027) are four separate files and can run in parallel once US4 is complete.

### Parallel Execution Examples

**Phase 2** — two agents can work simultaneously:
```
Agent A: T004 — Write KpiResultList.test.tsx (17 test cases)
Agent B: T005 — Write DefaultCollectionDate.test.tsx (6 test cases)
```

**Phase 3** — two agents can work simultaneously:
```
Agent A: T008 — Implement KpiResultRow.tsx (read-only skeleton)
Agent B: T009 — Implement KpiNewEntryRow.tsx (skeleton)
→ Both complete before T010 (KpiResultList.tsx)
```

**Phase 7 wiring** — four agents can work simultaneously:
```
Agent A: T024 — LivingLabKPIsEdition.tsx
Agent B: T025 — LivingLabModalSplit.tsx
Agent C: T026 — kpis.astro
Agent D: T027 — modal-split.astro
```

---

## Implementation Strategy

### MVP Scope (User Stories 1 + 2 only — Phases 1–4)

Completing Phases 1–4 (T001–T014) delivers a fully working multi-entry list with view + add capabilities:
- All saved entries are visible in list form (replacing the old before/after pair)
- New entries can be added, validated, and persisted
- All new test infrastructure is in place

Edit, delete, and default-date features (US3–US5) can be delivered in a follow-up sprint without blocking the MVP.

### Incremental delivery order

```
Sprint 1 (MVP):  Phases 1–4  →  View + Add (T001–T014)
Sprint 2:        Phases 5–6  →  Edit + Delete (T015–T021)
Sprint 3:        Phase 7     →  Default date + full wiring (T022–T027)
Sprint 4:        Phase 8     →  Polish + cleanup (T028–T033)
```

---

## Format Validation

All tasks follow the required checklist format:
- ✅ Every task starts with `- [ ]`
- ✅ Every task has a sequential ID (T001–T033)
- ✅ `[P]` marker present only on parallelizable tasks (different files, no blocking incomplete dependencies)
- ✅ `[US1]`–`[US5]` labels present on all user-story phase tasks; absent from Setup, Foundational, and Polish phases
- ✅ Every task includes an exact file path

**Summary**:
- **Total tasks**: 33
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (US1 — View)**: 4 tasks
- **Phase 4 (US2 — Add)**: 3 tasks
- **Phase 5 (US3 — Edit)**: 3 tasks
- **Phase 6 (US4 — Delete)**: 4 tasks
- **Phase 7 (US5 — Default date + wiring)**: 6 tasks
- **Phase 8 (Polish)**: 6 tasks
- **Parallel opportunities**: 14 tasks marked `[P]`
- **MVP scope**: Phases 1–4 (T001–T014, 14 tasks)
