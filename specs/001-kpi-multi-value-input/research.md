# Research: KPI Multi-Value Input (001)

**Date**: 2026-02-25  
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## R-01 — React In-Place Editable List Pattern

**Decision**: Each row is a self-contained `KpiResultRow` component that owns its own editing, pendingValue, pendingDate, and confirmingDelete state via multiple `useState` calls. The parent `KpiResultList` owns only the array of saved records and passes `onSave` / `onDelete` callbacks.

**Rationale**:
- editing/confirmingDelete are purely presentation state; no sibling or ancestor needs them. Lifting them would create unnecessary prop drilling.
- The parent's only job is array authority: when save succeeds the row calls `onSave(updatedResult)` and the parent replaces the matching item; when delete is confirmed the row calls `onDelete(id)` and the parent filters it out.
- This matches the pattern already used in `LivingLabKpiResultForm.tsx` (editing, value, date, error all in local state).
- `useReducer` inside each row is deferred — acceptable if the row gains ≥3 mutually-exclusive UI modes, but multiple `useState` is clearer for the current 5-variable set.
- Keys MUST be stable IDs (numeric DB id), never array index. The single open "add" row uses the sentinel key `"new"` — at most one open-add row per KPI at a time.

**Alternatives considered**:
- All edit states lifted to parent — rejected: produces verbose prop drilling; the parent would become a controller over local UI concerns.
- Single `useReducer` at parent level — rejected: same reason, also conflicts with the project's per-form encapsulation pattern.

---

## R-02 — Session Default Date Propagation

**Decision**: Pass `defaultDate` as a prop. Read it **once at mount**, when the add-new-entry row is opened, by initialising the row's `pendingDate` state directly:

```ts
const [pendingDate, setPendingDate] = useState(defaultDate || todayISO());
```

Because the new-entry subcomponent only mounts when "+" is pressed, this runs exactly once per opening. Changing `defaultDate` after mount does NOT reset `pendingDate` because there is no effect listening to it — satisfying spec scenarios 1–3 and 5 (already-saved entries are unaffected).

For spec scenario 4 (an unsaved open row updates when global date changes): the new-entry row should accept `defaultDate` as a live prop **and** track whether it is in unsaved mode (id is undefined). If `id === undefined`, a `useEffect([defaultDate])` updates `pendingDate`. If `id` is set, no effect runs.

**Why not React Context**: The default date travels at most parent → list → row (two hops). Context adds indirection with no benefit at this depth.

**Existing bug to avoid replicating**: `LivingLabKpiResultForm.tsx` has a `useEffect` on `defaultDate` that fires on every parent re-render and silently patches already-saved entries' dates via an API call. The new implementation MUST NOT replicate this pattern.

**Alternatives considered**:
- `useEffect` unconditionally on `defaultDate` — rejected: this is the documented bug in the existing component.
- React Context — deferred: add if the component tree depth exceeds three levels.
- sessionStorage / URL — rejected: the spec means component-tree session, not browser session.

---

## R-03 — Data Shape: Extend vs Replace `IIKpiResultBeforeAfter`

**Decision**: Introduce a new `IKpiResultGroup` type that extends `IIKpiResultBeforeAfter` by adding `results: IKpiResult[]`. Keep `result_before` and `result_after` alongside `results`. Do NOT replace the existing type.

```typescript
export interface IKpiResultGroup extends IIKpiResultBeforeAfter {
  results: IKpiResult[];
}
```

In `mapPrismaLabToLab`, add `results: groupedResults` to the returned object (already computed), and type `kpi_results` on `ILivingLabPopulated` as `IKpiResultGroup[]`. This is a structural superset — all existing callers continue to work because `result_before` / `result_after` are still present.

**Backward compat**: Six display pages and one helper access `result_before` / `result_after` directly. Keeping them alongside `results` is zero-cost: the repository already computes them from the sorted `groupedResults` array.

**Alternatives considered**:
- Replace `IIKpiResultBeforeAfter` entirely — rejected: 8+ import sites, maximum blast radius.
- Add `results` directly to `IIKpiResultBeforeAfter` — rejected: pollutes a "pair" interface with list semantics; semantically misleading.
- Remove `result_before`/`result_after` and make display pages compute them from `results` — rejected: requires touching 6 pages with risk of subtle sort discrepancies; zero benefit.

---

## R-04 — Local State Map in `LivingLabModalSplit`

**Decision**: Keep `livingLabKpiMap` as `Map<string, IKpiResultGroup>` (was `IIKpiResultBeforeAfter`, now its subtype). Do NOT change it to `Map<string, IKpiResult[]>`.

`LivingLabModalSplit` currently reads `result_before` / `result_after` from the map for totals computation, chart values, and passing to `LivingLabKpiResultsForm`. Those paths remain valid because `IKpiResultGroup` still carries those fields. The new `results` array is available for the new `KpiResultList` component that will replace `LivingLabKpiResultsForm` inside `LivingLabModalSplit`.

**Alternatives considered**:
- Change map to `Map<string, IKpiResult[]>` — rejected as premature: rewrites three internal paths (init, read, write) for zero current requirement.
- Parallel maps — rejected: redundant state with a sync surface.

---

## R-05 — Testing Strategy for Async List Components

**Decision**: Use `vi.mock` at module level with a factory replacing the ApiClient default export. Access spies via `vi.hoisted`. Assert async results inside `waitFor`. Use `userEvent.setup()` for all interactions (not `fireEvent`).

Key patterns established from `LivingLabForm.test.tsx` (already in the codebase):

```ts
const { mockUpsert, mockDelete } = vi.hoisted(() => ({
  mockUpsert: vi.fn().mockResolvedValue({ id: 99, value: 0.5, date: "2025-01-01" }),
  mockDelete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../lib/api-client/ApiClient", () => ({
  default: vi.fn(() => ({ upsertLivingLabKpiResults: mockUpsert, deleteKpiResult: mockDelete })),
}));
```

Delete confirmation test pattern: click delete → assert confirm prompt visible AND mockDelete NOT called → click cancel → assert prompt gone AND mockDelete NOT called; then separate test: click delete → click confirm → `waitFor` mockDelete called with correct id.

Validation error test pattern: type invalid value → click save → assert error text visible synchronously → assert mockUpsert NOT called.

Add `aria-live="polite"` to error `<small>` elements so tests can also query by role for accessibility.

**Alternatives considered**:
- Mocking `fetch` directly — rejected: couples tests to HTTP transport details.
- `findBy*` instead of `waitFor` for spy assertions — acceptable for DOM queries but `waitFor` is required for spy call assertions.
- `act()` manual wrapping — rejected: `userEvent` + `waitFor` is current `@testing-library` recommendation.

---

## Summary: No NEEDS CLARIFICATION items remain

| Item | Resolution |
|------|-----------|
| Row-level edit state ownership | Local to each `KpiResultRow` component |
| Default date propagation pattern | Prop, read once at mount; effect only for unsaved rows |
| Data type extension strategy | New `IKpiResultGroup extends IIKpiResultBeforeAfter` |
| Backward compat approach | Keep `result_before`/`result_after` alongside `results` |
| Modal-split local map type | Keep as `Map<string, IKpiResultGroup>` |
| Test mocking pattern | `vi.hoisted` + `vi.mock` factory (matches existing tests) |
