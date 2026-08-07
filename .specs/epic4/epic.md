# Epic 4: Evidence Qualification & KPI Enrichment

**Tasks:** T05 (M), T07 (M), T08 (S) — can run in parallel within epic
**Wave:** A
**Total effort:** 2×M + S
**Dependencies:** After **Epic 3** (all three need T04 vocabulary)

---

## Scope

Three tasks that enrich existing data displays with qualifying metadata. They touch different component areas and can be developed in parallel within the epic.

### T05 — Evidence-strength badge & "association, not cause" wording

- Every model-derived figure carries an evidence-strength badge + city count qualifier
- Replace "impact" and "contribution" with "statistical association" for regression outputs
- Badge threshold is **normalized**: `(cities × KPI observations behind the figure) / (total living labs × measures)`. With only 9 SUM labs doing very different activities, absolute counts are misleading — the threshold must be relative
- **Three badge levels minimum**, with documented, reproducible thresholds
- Page-bottom disclaimer stays; the badge is not a replacement, it is an addition

**Affected files:**
- `src/components/react/ImpactAnalysis/MeasuresImpact*`
- `src/components/react/ImpactAnalysis/KpiVariations*`
- `src/components/react/ImpactAnalysis/KpiGroupVariationDataTable`

### T07 — Plain-language reading, period & freshness

- Each KPI card adds: one-line plain-language reading, unit, reporting period, city, "last updated" date
- Direction of "good" stated where it exists; explicitly "not applicable" where it doesn't
- **Content-gated:** dev builds the rendering shell, then **requests the 28 readings from human (WP1)**. None auto-generated from definition text.

**Affected files:** every KPI card component, KPI definition catalogue

### T08 — Curated default domain set

- Impact analysis opens on a curated set of domains relevant to NSM uptake
- Remaining domains available behind "Show all domains" control showing hidden count
- **Curated list defined once** in a shared config, consumed by both `/tools/impact_analysis` and the Insights goal pages (T13/T15 in Epic 8)

**Affected files:** `/tools/impact_analysis` domain selection panel

## Acceptance criteria

- Every coefficient and impact figure displays a strength badge and city count
- Badge has ≥3 levels with documented thresholds based on normalized ratios
- "Impact" and "contribution" no longer describe regression output in public copy
- All KPI cards show reading/unit/period/city/freshness
- Impact analysis defaults to curated set; "Show all" reveals the rest with count stated
- Curated list is in one place, reusable by Epic 8

## PR validation

One PR. Verify badges on impact analysis, readings on KPI cards, default domain set on `/tools/impact_analysis`.
