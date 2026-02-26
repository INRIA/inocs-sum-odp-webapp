# Phase 0 Research — Public Multi-Entry KPI Charts

## Decision 1: Introduce a canonical frontend KPI result-group adapter with retrocompat fields

**Decision**
- Canonicalize each KPI group to a shape that includes `results: IKpiResult[]` (sorted oldest→newest) and compatibility aliases for legacy consumers (`result_before` = first result, `result_after` = last result).
- Normalize data once at front-end boundaries (Astro page shaping helpers + KPI dashboard utilities), not inside each chart component.

**Rationale**
- Minimizes regression risk while enabling incremental replacement of direct `before/after` reads.
- Keeps the migration front-end only, matching requested scope.
- Ensures all public pages consume the same normalized contract.

**Alternatives considered**
- Big-bang `results[]` migration in all components at once: faster end-state but higher break risk.
- Keep only `before/after`: cannot represent >2 points.
- Normalize per component: duplicates logic and can diverge in behavior.

---

## Decision 2: Timeline-first transformation for KPI charts

**Decision**
- Build KPI timeline points from `results[]` directly and filter by selected years.
- Keep chart behavior unchanged (same interactions/tooltips), changing only the data points count.

**Rationale**
- Existing D3 timeline chart components already support multiple points naturally.
- Aligns with requirement: preserve chart behavior while showing all entries.
- Enables deterministic chronological rendering.

**Alternatives considered**
- Collapse to first/last only: violates requirement.
- Aggregate values by year only: loses fidelity and chronology.

---

## Decision 3: Modal split uses multi-entry series per lab, with year-filtered datasets

**Decision**
- Replace per-lab `before/after` payload assumption with per-lab `entries[]` where each entry corresponds to one date-based dataset.
- During transition, derive optional `before/after` aliases for untouched consumers.

**Rationale**
- Allows 0..N datasets per living lab KPI while preserving existing stacked-bar rendering semantics.
- Retains the same UI interaction model and tooltip mechanics.

**Alternatives considered**
- New chart interaction model: out of scope and not requested.
- Keep modal split fixed to two datasets: violates requirement.

---

## Decision 4: Test-first migration strategy with focused coverage target

**Decision**
- Start with failing tests for utility/data transformation layers and key dashboard cards, then implement changes.
- Add at least one new dedicated test file for multi-entry compatibility behavior.
- Validate with Vitest coverage (`npm run test:coverage`) and ensure new/changed feature code reaches >=80% coverage.

**Rationale**
- Matches constitution (Red → Green → Refactor, dedicated new test file).
- Existing KPI dashboard tests can be expanded efficiently for changed props/shapes.

**Alternatives considered**
- Component-only tests: insufficient confidence in data shaping.
- Full E2E expansion: too heavy for this migration scope.

---

## Decision 5: Scope and integration boundaries

**Decision**
- Modify only public data views and supporting front-end components/helpers/types.
- Exclude private admin input forms and backend changes.

**Rationale**
- Explicitly requested by user.
- Prevents unintended behavior changes in admin pages while preserving compatibility.

**Alternatives considered**
- Include admin pages in same migration: broader scope, higher risk, not requested.
