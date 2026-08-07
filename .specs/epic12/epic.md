# Epic 12: Methods, Glossary & MCDA Enhancement

**Tasks:** T21 (L), T22 (M) — can run in parallel (T22 can start as soon as Epic 3 is done)
**Wave:** D
**Total effort:** L + M
**Dependencies:** After **Epics 2, 3, 4, 6** (T21 needs T02–T05, T10; T22 needs T04 only)

---

## Scope

Two parallel tracks. T22 can start as soon as Epic 3 is merged — it does not need the full Epic 12 prerequisites.

### T21 — Methods & quality section (six new pages)

Content is extracted from existing pages — source pages link to the method pages rather than repeating content.

| Page | Source |
|---|---|
| Evaluation framework (SIEF) | Split from `/data/kpis` intro |
| How the data is collected | Existing `/data/collection-plan` |
| Data quality & curation | New — validation workflow (D1.4 §4.3.4–4.3.5), curator role (placeholder), review cadence, display rules T02/T03/T05 |
| How the models work | Split from impact-analysis and MCDA preambles |
| Limitations | Split from same preambles |
| Glossary | Retained technical terms from T04 |

Additional changes:
- FAQ promoted out of footer into this section — reachable from a menu
- Data quality page names a role and cadence (placeholder OK until consortium decides)

⚠️ Curator role and review cadence must be confirmed by consortium before this page can be finalised. Placeholder is acceptable for initial spec and build.

### T22 — MCDA perspective comparison

- Default view: one perspective (unchanged from current)
- Add a **comparison view** that surfaces where the three perspectives **disagree**
- When rankings agree within a documented tolerance, state convergence **explicitly in words**
- All three perspectives remain individually reachable

## Acceptance criteria

- Each method page's source content is identified; the source page links to it rather than repeating it
- Data quality & curation page names a role and a cadence (placeholder acceptable)
- Every T04 tooltip term has a glossary entry
- FAQ is reachable from a menu, not only the footer
- MCDA comparison states convergence in words when rankings agree within documented tolerance
- All three MCDA perspectives remain individually reachable

## PR validation

One PR. Verify every method page has content and that source pages link to it. Test MCDA comparison with all perspective combinations and check the convergence statement appears when applicable.
