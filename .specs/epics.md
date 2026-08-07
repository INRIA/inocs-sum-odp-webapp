# SUM ODP V2 — Epic Index

**Source:** `.specs/roadmap_review.md` (22 tasks, 4 waves)
**Date:** 7 August 2026
**Status:** Ready for architecture — all blocking decisions resolved

---

## Epic reference map

| Epic | Title | Tasks | Wave | Effort | Phase | Depends on | File |
|---|---|---|---|---|---|---|---|
| 1 | CSV Export Fix | T01 | A | S | 1 | — | [epic1/epic.md](epic1/epic.md) |
| 2 | KPI Data Integrity & Separation | T03→T02 | A | M+M | 1 | — | [epic2/epic.md](epic2/epic.md) |
| 3 | Vocabulary & Labels | T04 | A | S | 1 | — | [epic3/epic.md](epic3/epic.md) |
| 4 | Evidence Qualification & KPI Enrichment | T05, T07, T08 | A | M+M+S | 2 | Epic 3 | [epic4/epic.md](epic4/epic.md) |
| 5 | City Identity & Platform Counters | T06→T09 | A | M+S | 2 | Epic 2 | [epic5/epic.md](epic5/epic.md) |
| 6 | Experience Architecture & Shell | T10→T12 | B | M+S | 1 | — | [epic6/epic.md](epic6/epic.md) |
| 7 | Landing & Onboarding Pages | T11→T18 | B | M+S | 3 | Epics 5, 6 | [epic7/epic.md](epic7/epic.md) |
| 8 | Insights Goal Experience | T13→T15 | B+C | L+L | 4 | Epics 2, 3, 4, 6 | [epic8/epic.md](epic8/epic.md) |
| 9 | Insights City Experience | T14→T17 | C | L+M | 4 | Epics 2, 4, 5, 6 | [epic9/epic.md](epic9/epic.md) |
| 10 | Guided Decision Tool | T16 | C | L | 4 | Epics 3, 4, 6 | [epic10/epic.md](epic10/epic.md) |
| 11 | Data Console & Downloads | T19, T20 | D | L+M | 4 | Epics 1, 5, 6 | [epic11/epic.md](epic11/epic.md) |
| 12 | Methods, Glossary & MCDA Enhancement | T21, T22 | D | L+M | 3→4 | Epics 2, 3, 4, 6 | [epic12/epic.md](epic12/epic.md) |

---

## Resolved decisions

| # | Question | Resolution |
|---|---|---|
| 1 | T01 API scope boundary | Confirmed — fix the CSV route directly |
| 2 | Version C confirmation | **Confirmed** — all epics proceed |
| 3 | Curator role for trust strip / quality page | Use placeholder in spec; content filled later |
| 4 | Goal→KPI-group mapping gap | Keep existing 6 goals. Orphaned groups (Social outcomes, Local economy, sustainable private modes/NSM) remain **Data-experience only** |
| 5 | Evidence-strength badge thresholds | Normalize from total (living lab × measure) combinations — threshold must be relative, not absolute |
| 6 | 28 KPI plain-language readings | Dev builds rendering shell; architect instructs dev to **request content from human (WP1)** when T07 starts |
| 7 | "Validated" estimation definition | `living lab validation date > KPI value edition date` |
| 8 | Insights city profile route | `/insights/city/[labId]` confirmed |
| 9 | T16 guided MCDA questions | Defined in analysis data — architect investigates when task starts |
| 10 | T04 label mapping completeness | Table in roadmap is **curated and final** |
| 11 | T18 content inventory | Inventory from current `src/pages/index.astro` |
| 12 | Epic 2 internal sequencing | T03 first, then T02 |

---

## Governing rules (apply to every epic)

| # | Rule |
|---|---|
| G1 | One page URL = one experience. Arriving at a route sets the active experience. |
| G2 | No page is deleted. Pages may be split, retitled, re-parented or relabelled. |
| G3 | Existing deep pages are not rebuilt. Data experience = today's pages from a new menu. |
| G4 | Out of scope: data structure, data classes, backend functions, lab-admin, odp-admin. Exception: T01 defect fix confirmed. |
| G5 | Data mapping functions are in scope. Regrouping, filtering, re-presenting existing data is allowed. |

---

## Sequencing

```
PHASE 1 — Start immediately (all parallel):
  Epic 1: CSV Fix (S)
  Epic 2: KPI Data Integrity (M+M)
  Epic 3: Vocabulary & Labels (S)
  Epic 6: Experience Architecture (M+S)

PHASE 2 — After prerequisites:
  Epic 4: Evidence & Enrichment (M+M+S)  ← Epic 3
  Epic 5: City Identity (M+S)             ← Epic 2

PHASE 3 — After prerequisites:
  Epic 7:  Landing Pages (M+S)            ← Epics 5, 6
  Epic 12: Methods & MCDA (L+M)           ← Epics 2, 3, 4, 6
           (T22 alone needs only Epic 3 — can start early)

PHASE 4 — After prerequisites:
  Epic 8:  Insights Goals (L+L)           ← Epics 2, 3, 4, 6
  Epic 9:  Insights Cities (L+M)          ← Epics 2, 4, 5, 6
  Epic 10: Guided Tool (L)                ← Epics 3, 4, 6
  Epic 11: Data Console (L+M)             ← Epics 1, 5, 6
```

**Critical path:** Epic 3 → Epic 4 → Epic 8 (Insights goal experience — the most visible deliverable).

**Minimum viable delivery:** Epics 1–5 (Wave A). Answers 11 of 16 PO comments, no structural change required.
