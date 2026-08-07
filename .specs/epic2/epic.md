# Epic 2: KPI Data Integrity & Separation

**Tasks:** T03 (M) → T02 (M) — sequential within epic
**Wave:** A
**Total effort:** 2×M
**Dependencies:** None — start immediately

---

## Scope

Establish foundational display rules for how KPIs render across the platform. T03 must land before T02 — T02 builds on the shared helper T03 introduces.

### T03 — Data-sufficiency display rule (first)

- A KPI renders as a **chart** only when the city has **≥2 validated estimations** for it
- Validation rule: `living lab validation date > KPI value edition date`
- With exactly 1 estimation → render as a **value** in a table, tagged *"Baseline only — no follow-up yet"*, with reporting date
- With 0 → do not render (empty state handled by T06 in Epic 5)
- Implement once in a **shared helper**, not repeated per component

### T02 — Split implementation record (second, builds on T03)

- Four indicators move out of charted KPI set into a separate **Implementation record** table:
  - Level of completion of SUMP measures
  - Community involvement
  - Balance of planned/implemented pull–push measures
  - Number of NSM integrated in the system
- ⚠️ Exact list and explanatory sentence to be confirmed by WP1 leader when task starts
- Table shows value, unit, reporting date, city — no trend lines, no sparklines, no delta arrows
- CSV download still works from the new location

## Affected files

- `src/components/react/KPIsDashboard/*` (rendering logic)
- `src/components/react/KpiCards/*` (card display)
- `src/pages/living-lab-city/[labId].astro` (city page)
- `src/pages/data/kpis.astro`

## Acceptance criteria

- No chart on the public site renders from a single data point
- Single-estimation KPIs appear as tagged values with reporting date
- The sufficiency rule lives in one shared helper
- The four implementation indicators render nowhere as a chart
- They appear in an Implementation-record table with explanatory text
- Outcome KPI charts contain none of the four
- CSV download works from the new table location

## PR validation

One PR containing both tasks. Verify on every city page and on `/data/kpis` that no single-point charts exist and that implementation indicators are in the table block only.
