# Epic 3: Vocabulary & Labels

**Tasks:** T04 (S)
**Wave:** A
**Total effort:** S
**Dependencies:** None — start immediately

---

## Scope

Apply the curated label mapping across all public surfaces. The mapping table below is **final and curated** — use as-is. Technical terms are retained in tooltips where they carry meaning for the Data experience.

## Label mapping

| Current | New |
|---|---|
| Transport System – Time | Travel time |
| Transport System – Safety/Comfort | Safety & comfort |
| Transport System – Cost | Cost of travel |
| Impact – Environment / Society / Economy | Environment / Social outcomes / Local economy |
| "Policy measures driving improvements for KPIs in group X" | "Measures linked to better \<plain-language X\>" |
| Net flow / positive flow / negative flow | Overall score / strengths / weaknesses (PROMETHEE terms in tooltip) |
| Score matrix | Your ratings |
| "Living Lab" applied to any registered city | "SUM Living Lab" (9 project cities) vs "Contributing city" |
| SUM measures / SUMP measures | Disambiguated explicitly on every label |

## Acceptance criteria

- No public page displays any left-column string
- SUM/SUMP distinction unambiguous on every label, chart title, and tooltip
- Underlying identifiers and CSV column names **unchanged** (presentation change only)
- A glossary entry exists for each retained technical term (feeds T21 in Epic 12)

## PR validation

One PR. Full visual sweep of all public pages. Grep codebase for old strings to confirm none remain in rendered output.
