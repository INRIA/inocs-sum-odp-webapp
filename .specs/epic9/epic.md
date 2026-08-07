# Epic 9: Insights City Experience

**Tasks:** T14 (L) → T17 (M) — sequential
**Wave:** C
**Total effort:** L + M
**Dependencies:** After **Epics 2, 4, 5, 6**

---

## Scope

The decision-maker city profile. The existing Data city page (`/living-lab-city/[labId]`) is **unchanged** (rule G3).

### T14 — Insights city profile at `/insights/city/[labId]` (first)

Four sections:
1. **Overview** — city context, what the city did in three sentences, headline result, last updated
2. **What they did** — push/pull measures with local description and start date
3. **Results at a glance** — outcome KPIs only, under T03 and T02 rules (no implementation-record indicators, no single-estimation charts)
4. **Lessons & documents** — surfaced by T17

- Cities without data → T06 "Registered — no data published yet" panel, no empty charts
- Counterpart-linked to Data city page (`/living-lab-city/[labId]`)
- Every figure carries its T07 plain-language reading

### T17 — Lessons & documents from Resources library (second, depends on T14)

- Uses **existing** resource→Living-Lab / measure / KPI-definition associations (D1.4 §4.3.8)
- **No new field, no migration, no schema change**
- Renders on Insights city profile as *Lessons & documents*, and beside relevant charts where the association is to a KPI
- Absence renders as nothing, not an empty section

⚠️ Who authors the first set of lesson notes must be confirmed with WP1 when this task starts.

## Acceptance criteria

- Insights city profile contains no implementation-record indicator and no single-estimation chart
- Every figure on the profile carries its T07 reading
- Counterpart link resolves to the same city in the Data experience
- Lesson entries appear from existing associations with no new fields required
- A city with no associated resources shows no empty block
- A city with no data shows the T06 panel

## PR validation

One PR. Check every city in Insights view: with data, without data, with resources, without resources. Verify counterpart link in both directions.
