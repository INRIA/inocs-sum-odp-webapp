# Quickstart: KPI Multi-Value Input (001)

**Branch**: `001-kpi-multi-value-input`  
**Date**: 2026-02-25

---

## Prerequisites

- Node.js ≥ 20, npm ≥ 10
- PostgreSQL running (or existing dev DB connection in `.env`)
- No new dependencies — this feature uses only packages already in `package.json`

```bash
# From repo root
npm install          # no new packages needed
```

---

## Development Workflow (TDD — tests first)

### Step 1 — Verify the test suite passes on `main` baseline

```bash
npm run test
```

All existing tests should be green before starting work.

---

### Step 2 — Write failing tests (Red phase)

Create the two new test files. They should fail immediately because the components do not yet exist.

```bash
# New test files to create:
touch src/components/react/form/KpiResultList.test.tsx
touch src/components/react/form/DefaultCollectionDate.test.tsx
```

Run only the new tests to confirm they fail:

```bash
npm run test -- KpiResultList.test
npm run test -- DefaultCollectionDate.test
```

Expected: all new test cases fail with "Cannot find module" or similar.

---

### Step 3 — Implement types and data layer (no new DB migration)

**File**: `src/types/KPIs.ts`  
Add `IKpiResultGroup` extending `IIKpiResultBeforeAfter`.

**File**: `src/types/LivingLab.ts` (or wherever `ILivingLabPopulated` lives)  
Update `kpi_results` field type to `IKpiResultGroup[]`.

**File**: `src/bff/repositories/labs.repository.ts`  
In `mapPrismaLabToLab`, add `results: groupedResults` to the returned group object.

Run TypeScript check:

```bash
npx tsc --noEmit
```

Expected: no new errors (existing callers remain type-correct because `IKpiResultGroup` is a subtype).

---

### Step 4 — Implement new React components

Create in order (each depends on the previous):

1. `src/components/react/form/DefaultCollectionDate.tsx`
2. `src/components/react/form/KpiResultRow.tsx`
3. `src/components/react/form/KpiNewEntryRow.tsx`
4. `src/components/react/form/KpiResultList.tsx`

Re-run tests after each file to track Green progress:

```bash
npm run test -- KpiResultList.test
npm run test -- DefaultCollectionDate.test
```

---

### Step 5 — Wire into parent components (Green phase)

**`LivingLabKPIsEdition.tsx`**:
- Replace `<BeforeAndAfterDates ... />` → `<DefaultCollectionDate ... />`
- Replace `<LivingLabKpiResultsForm initialBefore=... initialAfter=... />` → `<KpiResultList initialResults={[...]} ... />`
- Remove `beforeDate` / `afterDate` pair state; add single `defaultDate` string state.

**`LivingLabModalSplit.tsx`**:
- Replace `<BeforeAndAfterDates ... />` → `<DefaultCollectionDate ... />`
- Replace `<LivingLabKpiResultsForm ... />` → `<KpiResultList ... />`
- Update `livingLabKpiMap` type from `Map<string, IIKpiResultBeforeAfter>` to `Map<string, IKpiResultGroup>`.

**`src/pages/lab-admin/kpis.astro`**:
- Remove `valueBeforeDate` / `valueAfterDate` props from the `<LivingLabKPIsEdition>` island (no longer needed at the Astro layer — the default date is session-only React state).
- Remove the `valueBeforeDate` / `valueAfterDate` derivation logic from the frontmatter.

**`src/pages/lab-admin/modal-split.astro`**: same as above for `<LivingLabModalSplit>`.

Run full test suite:

```bash
npm run test
```

Expected: all tests green.

---

### Step 6 — Refactor phase

```bash
npx tsc --noEmit       # TypeScript strict check
npm run test           # All tests green
npm run lint           # No lint warnings introduced
```

- Remove `BeforeAndAfterDates.tsx` only if it has no other callers (check with `grep -r "BeforeAndAfterDates" src/`).
- Remove `LivingLabKpiResultsForm.tsx` only if it has no other callers.
- Keep `LivingLabKpiResultForm.tsx` if it is still used inside `KpiResultRow`; otherwise deprecate.

---

## Running the app locally

```bash
npm run dev
```

Navigate to `http://localhost:4321/lab-admin/kpis` (auth required — log in as a Lab Admin first).

---

## Test commands reference

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- KpiResultList.test

# Run with coverage
npm run test -- --coverage

# TypeScript check only
npx tsc --noEmit
```

---

## Key file locations

| File | Purpose |
|---|---|
| `src/types/KPIs.ts` | Add `IKpiResultGroup` |
| `src/bff/repositories/labs.repository.ts` | Add `results` field to group object |
| `src/components/react/form/KpiResultList.tsx` | **New** — list container |
| `src/components/react/form/KpiResultRow.tsx` | **New** — per-entry row |
| `src/components/react/form/KpiNewEntryRow.tsx` | **New** — new entry draft row |
| `src/components/react/form/DefaultCollectionDate.tsx` | **New** — replaces BeforeAndAfterDates |
| `src/components/react/form/KpiResultList.test.tsx` | **New** — primary tests |
| `src/components/react/form/DefaultCollectionDate.test.tsx` | **New** — date picker tests |
| `src/components/react/LivingLabKPIsEdition.tsx` | Wire new components |
| `src/components/react/LivingLabModalSplit.tsx` | Wire new components |
| `specs/001-kpi-multi-value-input/contracts/component-contracts.md` | Behaviour contracts (test oracle) |
