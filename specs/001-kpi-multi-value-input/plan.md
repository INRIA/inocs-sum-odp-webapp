# Implementation Plan: KPI Multi-Value Input

**Branch**: `001-kpi-multi-value-input` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)

## Summary

Replace the fixed "before / after" two-field KPI result input on the Lab Admin pages (`/lab-admin/kpis` and `/lab-admin/modal-split`) with a dynamic list of KPI result entries per KPI row. Each entry has a value and a date; the admin can add, edit, or delete any entry individually. A single "Default collection date" picker at the top of the page pre-fills the date for new entries. No database schema change is required — the data layer already stores an arbitrary number of result rows per KPI. The change is purely in the React component layer and the BFF type mapping.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18, Astro 4 (SSR)  
**Primary Dependencies**: React 18, Astro SSR, Vitest 2, @testing-library/react, Prisma 5, Tailwind CSS, Catalyst UI Kit (already in project — no new packages)  
**Storage**: PostgreSQL via Prisma (`kpiresults` table — no schema change)  
**Testing**: Vitest + @testing-library/react + @testing-library/user-event + happy-dom  
**Target Platform**: Node.js SSR (Astro) + browser (React islands)  
**Project Type**: Web application (Astro SSR + React islands)  
**Performance Goals**: No new performance goals; individual save/delete calls are already in place  
**Constraints**: Astro SSR must remain the page orchestration layer; no new npm packages; TypeScript strict mode must not be weakened; page layout of admin pages must not change  
**Scale/Scope**: ~15–30 KPI definitions per Living Lab; admin use only (low traffic)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Tests-first plan exists for all new behavior (Red → Green → Refactor documented in quickstart.md steps 2–6).
- [x] A new test file per new feature is listed as acceptance criteria: `KpiResultList.test.tsx` and `DefaultCollectionDate.test.tsx` are required deliverables.
- [x] Test scope includes happy path, user interactions, displayed information, and edge cases (see contracts/component-contracts.md behaviour tables).
- [x] Astro SSR responsibilities are separated from React island interactivity: Astro pages remain the data-fetch + layout layer; all list state lives in React islands.
- [x] Data layer uses Prisma + PostgreSQL only (no raw SQL in application code, no other DBs). The only data-layer change is adding `results: groupedResults` to the existing Prisma-derived map in `labs.repository.ts`.
- [x] TypeScript strict mode remains enabled with no weakening changes. `IKpiResultGroup extends IIKpiResultBeforeAfter` is a strictly-typed additive change.
- [x] Test implementation uses Vitest + `@testing-library/react`.

**Constitution Check result**: ✅ All gates pass. No violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-kpi-multi-value-input/
├── plan.md                              # This file
├── spec.md                              # Feature specification
├── research.md                          # Phase 0 findings
├── data-model.md                        # Phase 1 entities and type changes
├── quickstart.md                        # Phase 1 developer guide
├── contracts/
│   └── component-contracts.md           # Phase 1 component + API contracts
└── checklists/
    └── requirements.md                  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── KPIs.ts                          # MODIFY: add IKpiResultGroup
│   └── LivingLab.ts                     # MODIFY: kpi_results → IKpiResultGroup[]
├── bff/
│   └── repositories/
│       └── labs.repository.ts           # MODIFY: add results field to group object
└── components/
    └── react/
        ├── form/
        │   ├── KpiResultList.tsx         # NEW — list container component
        │   ├── KpiResultRow.tsx          # NEW — per-entry read/edit/delete row
        │   ├── KpiNewEntryRow.tsx        # NEW — new-entry draft row
        │   ├── DefaultCollectionDate.tsx # NEW — single date picker (replaces BeforeAndAfterDates)
        │   ├── KpiResultList.test.tsx    # NEW — primary test file (TDD, write first)
        │   └── DefaultCollectionDate.test.tsx  # NEW — date component tests
        ├── LivingLabKPIsEdition.tsx      # MODIFY — wire new components
        └── LivingLabModalSplit.tsx       # MODIFY — wire new components

src/pages/lab-admin/
├── kpis.astro                           # MODIFY — remove before/after date props
└── modal-split.astro                    # MODIFY — remove before/after date props
```

**Structure Decision**: Single-project web application layout. All changes are within the existing `src/` tree. No new directories, no new build targets, no new packages.

## Complexity Tracking

No constitution violations. No complexity justification required.

---

## Phase 0: Research Summary

*Full findings in [research.md](research.md). This section records key decisions.*

| Decision point | Resolution | Source |
|---|---|---|
| Row-level edit state ownership | Local to each `KpiResultRow` (multiple `useState`; no lift) | R-01 |
| List keying | Stable numeric DB id; `"new"` sentinel for the open add-row | R-01 |
| Default date propagation | Prop read at mount; `useEffect([defaultDate])` only for unsaved rows | R-02 |
| Existing `useEffect` bug in current code | Must NOT replicate the `LivingLabKpiResultForm` pattern that patches saved entries | R-02 |
| Data type extension strategy | New `IKpiResultGroup extends IIKpiResultBeforeAfter` + `results: IKpiResult[]` | R-03 |
| Backward compat for display pages | Keep `result_before`/`result_after` on group object; purely additive | R-03 |
| Modal-split local map type | `Map<string, IKpiResultGroup>` (structural subtype; no logic rewrites) | R-04 |
| Test mock pattern | `vi.hoisted` + `vi.mock` factory for ApiClient (matches existing codebase) | R-05 |

---

## Phase 1: Design

*Full entity definitions in [data-model.md](data-model.md). Full component contracts in [contracts/component-contracts.md](contracts/component-contracts.md). Developer guide in [quickstart.md](quickstart.md).*

### New Components

#### `KpiResultList` (parent container)
- Owns `entries: IKpiResult[]` and `isAddingNew: boolean` state
- Renders one `KpiResultRow` per saved entry (keyed by `result.id`)
- Renders one `KpiNewEntryRow` when `isAddingNew === true` (keyed by `"new"`)
- Renders "+" button when `isAddingNew === false`
- Passes `defaultDate` down to `KpiNewEntryRow` only

#### `KpiResultRow` (per-entry read/edit/delete)
- Local state: `isEditing`, `pendingValue`, `pendingDate`, `error`, `confirmingDelete`
- Read-only view: formatted value + date + edit icon + delete icon
- Edit mode: value input + date input + save + cancel (same validation as existing `LivingLabKpiResultForm`)
- Delete confirmation: inline confirm/cancel before calling `ApiClient.deleteKpiResult`
- Calls `onSave(updated)` / `onDelete(id)` to notify parent

#### `KpiNewEntryRow` (new entry draft)
- `pendingDate` initialised from `defaultDate` at mount
- `useEffect([defaultDate])` updates `pendingDate` only while `id` is undefined (new/unsaved)
- Calls `ApiClient.upsertLivingLabKpiResults` (no `id` — creates new row)
- Calls `onSave(created)` on success; `onCancel()` on cancel

#### `DefaultCollectionDate` (replaces `BeforeAndAfterDates`)
- Single date field with view/edit toggle (same UX pattern as the existing two-field version)
- Calls `onChange(date)` when user confirms; no API call
- Props: `value: string`, `onChange: (date: string) => void`

### Modified Components

#### `LivingLabKPIsEdition`
- Replace `[beforeDate, setBeforeDate]` + `[afterDate, setAfterDate]` pair with single `[defaultDate, setDefaultDate]: string`
- Replace `<BeforeAndAfterDates>` with `<DefaultCollectionDate>`
- Replace `<LivingLabKpiResultsForm initialBefore=... initialAfter=... />` with `<KpiResultList initialResults={groupResults} defaultDate={defaultDate} />`
- `groupResults` derived from `kpiResults` prop: `kpiResults.find(r => r.kpidefinition_id === kpi.id)?.results ?? []`

#### `LivingLabModalSplit`
- Same `BeforeAndAfterDates` → `DefaultCollectionDate` replacement
- Replace `LivingLabKpiResultsForm` per cell with `KpiResultList`
- `livingLabKpiMap` type changes from `Map<string, IIKpiResultBeforeAfter>` to `Map<string, IKpiResultGroup>` (structural subtype — no logic changes needed)
- `onKpiValuesChange` callback simplified: individual `KpiResultRow` saves update the DB directly; totals can be derived from the list on re-render

### Data Layer

#### `src/types/KPIs.ts`
```typescript
export interface IKpiResultGroup extends IIKpiResultBeforeAfter {
  results: IKpiResult[];
}
```

#### `src/types/LivingLab.ts`
```typescript
kpi_results?: IKpiResultGroup[];   // was IIKpiResultBeforeAfter[]
```

#### `src/bff/repositories/labs.repository.ts` — `mapPrismaLabToLab`
Add `results: groupedResults` to the returned group object (already computed; zero extra DB query):
```typescript
return {
  living_lab_id: ...,
  kpidefinition_id: ...,
  transport_mode_id: ...,
  result_before: minKpiResult ?? null,   // preserved for backward compat
  result_after: maxKpiResult ?? null,    // preserved for backward compat
  results: groupedResults,               // new field
};
```

### Astro Pages (minimal change)

Both `kpis.astro` and `modal-split.astro`:
- Remove the `valueBeforeDate` / `valueAfterDate` derivation logic from the frontmatter
- Remove `valueBeforeDate` / `valueAfterDate` props from the island component call
- The default date is now session-only React state initialised to today's date inside the component

### Test Plan

#### `KpiResultList.test.tsx` (new — write before implementation)

| Test case | Category |
|---|---|
| Renders empty state when `initialResults=[]` | Displayed information |
| Renders N rows when `initialResults` has N entries | Displayed information |
| Renders entries in chronological order | Displayed information |
| "+" button visible initially | Displayed information |
| Clicking "+" opens new entry row; "+" button hidden | User interaction |
| Saving new entry calls API with correct args | Happy path |
| Saved entry appears in list | Happy path |
| Cancelling new entry closes row; list unchanged | User interaction |
| Editing existing entry and saving updates displayed value | Happy path |
| Editing existing entry and cancelling restores original | User interaction |
| Deleting with confirmation removes entry from list | Happy path |
| Deleting then cancelling leaves list unchanged | User interaction |
| Inline error shown for out-of-range percentage | Edge case |
| Inline error shown for empty date on save | Edge case |
| API save failure shows error; entry stays in edit mode | Edge case |
| Changing `defaultDate` pre-fills new entry row | Happy path |
| Changing `defaultDate` does NOT change saved entries | Edge case |

#### `DefaultCollectionDate.test.tsx` (new — write before implementation)

| Test case | Category |
|---|---|
| Shows label and no date when `value=""` | Displayed information |
| Shows formatted date when `value` is set | Displayed information |
| Click edit shows date input | User interaction |
| Confirm calls `onChange` with new date | Happy path |
| Confirm with empty clears the date | Happy path |
| Cancel does not call `onChange` | User interaction |

### Constitution Check (Post-Design)

- [x] **Tests-first**: Two new test files are step 2 in quickstart.md, before any component files
- [x] **One test file per feature**: `KpiResultList.test.tsx` and `DefaultCollectionDate.test.tsx`
- [x] **Coverage**: 17 test cases in `KpiResultList.test.tsx` covering happy path, interactions, displayed info, and edge cases
- [x] **Astro/React boundary preserved**: Astro pages only remove props; all new state lives in React islands
- [x] **Prisma-only data access**: Only `labs.repository.ts` touched in BFF; no raw SQL; no new DB
- [x] **TypeScript strict**: `IKpiResultGroup extends IIKpiResultBeforeAfter` — structural subtype, no `any`, no `@ts-ignore`
- [x] **Vitest + @testing-library/react**: All test cases use the established stack

**Post-design Constitution Check result**: ✅ All gates pass. Ready for `/speckit.tasks`.
