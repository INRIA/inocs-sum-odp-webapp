# Epic 11: Data Console & Downloads

**Tasks:** T19 (L), T20 (M) — can run in parallel
**Wave:** D
**Total effort:** L + M
**Dependencies:** After **Epics 1, 5, 6** (T19 needs T03, T09, T10; T20 needs T01, T10)

---

## Scope

Two new pages for the Data experience. They can be developed in parallel — T19 is the data homepage/matrix, T20 is the downloads documentation page.

### T19 — Data homepage & coverage matrix

Console-style page. Structure:
- Status tiles: observations, cities with before/after, model quality, last model run, KPI definitions
- **Coverage matrix**: cities × KPI groups × periods — three states per cell: *before & after* / *baseline only* / *none*
- Colour never carries meaning alone — states labelled in **text and colour** with a visible key
- Quick links to existing dashboards and tools
- Downloads and methods entry point
- Cross-link to Insights experience

Figures must agree with T09 counters (Epic 5) and T03 rules (Epic 2): a cell marked chartable must be chartable everywhere on the platform.

### T20 — Downloads page

One page listing every downloadable file offered anywhere on the site:
- Content, schema, coverage, period, and licence for each file
- Exposes the underlying KPI series, not only analysis output
- Each file's description states what it does *not* contain
- Existing per-card CSV download buttons still work (validated by T01 fix in Epic 1)

## Acceptance criteria

- Matrix states three distinct cell states in text and colour with a visible key
- Figures agree with T09 counters; a cell marked chartable is chartable everywhere
- Every existing dashboard and tool is reachable from the Data homepage
- Every download offered anywhere on the site appears on the downloads page with its schema
- Existing per-card CSV buttons continue to work

## PR validation

One PR. Verify matrix against actual city data. Attempt every download link on the downloads page and confirm it resolves.
