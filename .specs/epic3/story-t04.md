# Story T04 — Apply Curated Vocabulary & Labels

**Epic:** 3 — Vocabulary & Labels
**Size:** S
**Dependencies:** None
**Branch:** `feature/epic3-vocabulary-labels`

---

## User Story

> As a platform visitor, I see clear, plain-language labels on every public page so that I understand what the data represents without needing domain expertise.

---

## Acceptance Criteria

- [ ] AC-1: No public page displays any string from the "Current" column of the label mapping table
- [ ] AC-2: SUM/SUMP distinction is unambiguous on every label, chart title, and tooltip
- [ ] AC-3: Underlying identifiers and CSV column names are unchanged (presentation-only)
- [ ] AC-4: A glossary data structure exists for each retained technical term

---

## Implementation Steps

### Step 1: Create the centralized label module

**Create file:** `src/lib/labels.ts`

Contents (see architecture-t04.md section 4 for the full listing):
- `CATEGORY_DISPLAY_LABELS` map + `displayCategoryName()` function
- `FLOW_LABELS` constants for PROMETHEE terms
- `SCORE_MATRIX_DISPLAY` constant
- `SUM_PROJECT_LAB_NAMES` set + `displayLabType()` function
- `GLOSSARY` record

**Action:** Populate `SUM_PROJECT_LAB_NAMES` with the actual 9 SUM Horizon Europe city names. Verify against production data or the SUM project website.

**Export** `displayCategoryName` and `FLOW_LABELS` from `src/lib/helpers/index.ts` for convenience.

---

### Step 2: Replace KPI category display names

**2a.** Update mock data for dev consistency:

File: `src/lib/api-client/mock-data/categories.json`
- Line 17: `"Transport System - Time"` -> `"Travel time"`
- Line 39: `"Transport System - Safety/Comfort"` -> `"Safety & comfort"`
- Line 58: `"Transport System - Cost"` -> `"Cost of travel"`
- Line 77: `"Impact - Environment"` -> `"Environment"`
- Line 83: `"Impact - Society"` -> `"Social outcomes"`
- Line 89: `"Impact - Economy"` -> `"Local economy"`

**2b.** In components that render category names from API responses, wrap `.name` accesses with `displayCategoryName()`:

- `src/components/react/ImpactAnalysis/MeasuresImpact.tsx` — line 67, where `selectedGroup.name` appears in the warning alert text
- `src/components/react/MCDAAnalysis/ResultsSection.tsx` — line 237, where `selectedGroup?.name` appears in the "Results pending" fallback
- Any other component that renders `IKpiGroup.name` or `ICategory.name` directly in JSX

**2c.** Update the KPI Framework Diagram:

File: `src/components/react/KpisFrameworkDiagram.tsx`
- Line 8: `"Impacts - Sustainability assessment"` -> `"Sustainability outcomes"`
- Line 138: Same string in the rendered diagram

---

### Step 3: Replace PROMETHEE flow term labels

All changes are display-text only. Variable names, prop names, and API fields stay as-is.

**3a.** File: `src/components/react/MCDAAnalysis/D3McdaNetFlowsChart.tsx`
- Line 275: `"Net Flow (phi)"` -> `"Overall score (phi)"`
- Line 343: `"No net flows data available"` -> `"No overall scores data available"`
- Line 377: `"Net flow"` -> `"Overall score"`
- Line 394: `"Positive flow"` -> `"Strengths"`
- Line 410: `"Negative flow"` -> `"Weaknesses"`
- Line 430: `"Net Flow (phi):"` -> `"Overall score (phi):"`
- Line 438: `"Positive Flow (phi+):"` -> `"Strengths (phi+):"`
- Line 446: `"Negative Flow (phi-):"` -> `"Weaknesses (phi-):"`

**3b.** File: `src/components/react/MCDAAnalysis/D3McdaNetworkChart.tsx`
- Line 441: `"Net flow:"` -> `"Overall score:"`
- Line 445: `"Positive flow:"` -> `"Strengths:"`
- Line 450: `"Negative flow:"` -> `"Weaknesses:"`

**3c.** File: `src/components/react/MCDAAnalysis/D3McdaGaiaPlane.tsx`
- Line 633: `"Net Flow:"` -> `"Overall score:"`

**3d.** File: `src/components/react/MCDAAnalysis/McdaRankingAlternatives.tsx`
- Line 72: `"Net Flow:"` -> `"Overall score:"`

**3e.** File: `src/lib/helpers/mcda-format.ts`
- Line 456: `"Highest PROMETHEE net flow"` -> `"Highest overall score"`
- Line 460: Tooltip: update to lead with "Overall score" while keeping the PROMETHEE explanation
- Line 480: `"highest and lowest net flow"` -> `"highest and lowest overall score"`

---

### Step 4: Replace "Score Matrix" with "Your ratings"

File: `src/components/react/MCDAAnalysis/CustomAnalysisForm.tsx`
- Line 444: `title="Score Matrix"` -> `title="Your ratings"`

---

### Step 5: Apply Living Lab / Contributing City distinction

**5a.** File: `src/components/react/LivingLabsMapSection.tsx`
- Line 152: `"{selectedLab.name} Living Lab overview"` -> use `displayLabType()` to show `"{selectedLab.name} — SUM Living Lab overview"` or `"{selectedLab.name} — Contributing city overview"`
- Line 200: Same pattern for the "Explore" button text
- Lines 102, 113: List panel heading — keep "Living Labs" generic (it covers both types) or change to "Cities"
- Consider adding a small badge/tag per lab in the list showing type

**5b.** File: `src/pages/faq.astro`
- Line 9: `"Who can register as a Living Lab"` -> `"Who can register as a Contributing city"` (SUM Living Labs are pre-registered)
- Line 40: `"Are you a SUM Living Lab ?"` -> keep as-is (this is correctly specific)
- Line 54: `"Do you want to create a new Living Lab?"` -> `"Do you want to register a new Contributing city?"`

**5c.** File: `src/components/FAQsUserAccount.astro`
- Mirror the same FAQ text changes as in `faq.astro`

**5d.** File: `src/components/react/form/LivingLabModeOptions.tsx`
- Lines 74-76: Update form option labels to make the distinction clear:
  - `"Select existing Living Lab"` -> `"Select existing city"`
  - `"Create new Living Lab"` -> `"Register new Contributing city"`
  - `"Select a Living Lab"` -> `"Select a city"`

**5e.** File: `src/pages/index.astro`
- Line 106: `"across 9+ Living Labs"` -> `"across 9 SUM Living Labs and Contributing cities"`
- Line 132: Stats counter `"Living labs"` -> keep or change to `"Cities"`

---

### Step 6: Disambiguate SUM vs SUMP measures

File: `src/components/react/KpisFrameworkDiagram.tsx`
- Line 84: `"1. Level of completion of SUMP measures"` -> `"1. Level of completion of SUMP (city plan) measures"`

File: `src/lib/api-client/mock-data/kpis.json`
- Line 5: `"Level of completion of SUMP measures"` -> `"Level of completion of SUMP (city plan) measures"`
- Line 6: Description: add `"(city plan)"` qualifier

File: `src/pages/lab-admin/measures.astro`
- Line 36: After `"SUMP"`, add context `"(Sustainable Urban Mobility Plan)"`

---

### Step 7: Update the "Measures linked to better <X>" phrasing

File: `src/components/react/ImpactAnalysis/MeasuresImpact.tsx`
- Line 29: Section title `"Measures Impact"` -> `"Measures linked to better {displayCategoryName(selectedGroup.name)}"`
- Lines 182, 217: Top/bottom measures subheadings — rephrase to `"Top N measures linked to better {displayCategoryName(selectedGroup.name)}"`

File: `src/components/react/ImpactAnalysis/ImpactAnalysisDashboard.tsx`
- Line 79: Tab label `"Measures Impact"` -> `"Linked measures"`

---

### Step 8: Update tests

**8a.** File: `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx`
- Line 33: `screen.getByText(/score matrix/i)` -> `screen.getByText(/your ratings/i)`
- Line 36: Test name update

**8b.** File: `src/lib/helpers/mcda-format.test.ts`
- Update any assertions that match against the old flow term strings ("net flow", "positive flow", "negative flow" in user-facing descriptions)
- Line 118: `"Living labs contributing quantitative data"` — unchanged (this is a description, not a changed label)
- Line 124: `"Policy measures evaluated as alternatives"` — unchanged

---

### Step 9: Final verification

**9a.** Run the full grep check:
```bash
# Must return zero matches in .tsx/.astro/.ts files (excluding test files, comments, and variable names)
grep -rn "Transport System - Time\|Transport System - Safety/Comfort\|Transport System - Cost" src/ --include='*.tsx' --include='*.astro'
grep -rn "Impact - Environment\|Impact - Society\|Impact - Economy" src/ --include='*.tsx' --include='*.astro'
grep -rn '"Score Matrix"' src/ --include='*.tsx'
# Flow terms in user-facing strings (exclude variable names and API fields):
grep -rn '"Net flow"\|"Positive flow"\|"Negative flow"' src/ --include='*.tsx'
```

**9b.** Run existing test suite:
```bash
npm run test
```

**9c.** Visual sweep of all public pages (see architecture-t04.md section 6).

---

## Out of Scope

- Database schema changes
- API response format changes
- CSV export column name changes
- Full i18n system
- Component/file renaming

---

## PR Checklist

- [ ] One PR for all changes
- [ ] No old strings in rendered output (grep verification)
- [ ] All existing tests pass (with updated assertions)
- [ ] SUM/SUMP distinction clear on every label
- [ ] Glossary data structure exported from `src/lib/labels.ts`
- [ ] Visual sweep screenshots attached to PR
