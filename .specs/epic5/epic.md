# Epic 5: City Identity & Platform Counters

**Tasks:** T06 (M) → T09 (S) — T06 first, then T09
**Wave:** A
**Total effort:** M + S
**Dependencies:** After **Epic 2** (T06 needs T03 data-sufficiency rule; T09 needs T06)

---

## Scope

### T06 — City status, map legend & data-pending empty state (first)

- Two independent visual dimensions on the map and in every city listing:
  - **Symbol** — SUM Living Lab vs Contributing city
  - **Colour** — has before/after data vs data pending
- Map legend always visible, names all four combinations
- City with zero published KPIs → "Registered — no data published yet" panel with registration date, no empty charts
- Status never carried by colour alone

**Affected files:**
- `src/components/react/LivingLabsMapSection.tsx`
- City catalogue
- `/living-lab-city/[labId]`

### T09 — Split and correct the platform counters (second, needs T06)

- Replace every ambiguous "Living Labs" count with three separately-labelled figures:
  - *SUM Living Labs*
  - *Contributing cities*
  - *Cities with before/after data*
- Computed from **one shared helper**, consistent on every page
- Add a *last data update* value
- Counter helper is reusable by Epic 7 (trust strip) and Epic 11 (coverage matrix)

**Affected files:**
- Homepage counters
- `/data/measures` summary
- `/data/kpis` header
- Impact-analysis intro text

## Acceptance criteria

- Map legend names all four combinations, visible without interaction
- Every city listing states type and data status in text, not only by colour or symbol
- No city page returns a 404 or empty shell
- A city with zero published KPIs renders the data-pending panel, no empty charts
- No public page displays a city count without saying which of the three categories it is
- All three counter figures derive from a single helper; no hard-coded numbers remain

## PR validation

One PR. Check the map, every city page (including data-pending ones), and every page that displays a city count.
