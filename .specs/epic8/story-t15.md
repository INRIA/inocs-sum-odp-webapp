# Story T15 — Goal Pages

**Epic:** 8 — Insights Goal Experience
**Size:** L
**Dependencies:** T05, T08, T13 (must be complete)
**Branch:** `feature/epic8-insights-goals`

---

## User Story

> As a decision-maker interested in a specific goal, I see a ranked list of mobility measures associated with progress on that goal, each showing what happened, how many cities implemented it, and the strength of evidence — so I can identify which measures are most supported by evidence for the outcome I care about.

---

## Acceptance Criteria

- [ ] AC-1: One template, six instances — each goal has a page at `/insights/goals/[goalSlug]`
- [ ] AC-2: Measures are ranked by evidence strength (descending) using existing impact-analysis output — no recomputation
- [ ] AC-3: Each measure card shows: plain-language name (T04), description, city count, outcome description, evidence-strength badge, and contributing city links
- [ ] AC-4: Nothing below the T05 evidence threshold appears
- [ ] AC-5: Every measure name is a plain-language name (per T04 vocabulary)
- [ ] AC-6: A counterpart link on each goal page opens the corresponding domain in the Data experience (impact analysis)
- [ ] AC-7: An invalid `goalSlug` redirects to `/insights/goals`

---

## Implementation Steps

### Step 1: Create `getMeasuresForGoal` helper

File: `src/lib/insights/goalHelpers.ts`

Add the `getMeasuresForGoal` function that:
1. Collects all impact-analysis results for the goal's mapped KPI groups
2. Filters out results below the T05 evidence threshold
3. Deduplicates measures (keeps highest evidence level per measure)
4. Returns an array of `RankedMeasure` objects sorted by evidence strength descending

See architecture.md section 4b for the full implementation.

### Step 2: Create MeasureCard component

File: `src/components/react/Insights/MeasureCard.tsx`

A card component receiving `rank`, `measureName`, `description`, `cityCount`, `cities[]`, `outcome`, `evidenceLabel`. Shows the rank number, measure details, evidence badge, and clickable city links. See architecture.md section 4c.

### Step 3: Create the goal page template

File: `src/pages/insights/goals/[goalSlug].astro`

Dynamic route page that:
1. Reads `goalSlug` from `Astro.params`
2. Finds the matching goal in `GOALS` array
3. Redirects to `/insights/goals` if no match
4. Fetches impact results, measures, and living labs via `ApiClient`
5. Calls `getMeasuresForGoal` for the ranked list
6. Renders goal header, ranked measure cards, and Data-experience cross-link

See architecture.md section 4a for full markup.

### Step 4: Export MeasureCard from barrel

File: `src/components/react/Insights/index.ts`

Add `MeasureCard` to the exports.

### Step 5: Write tests

File: `src/lib/insights/goalHelpers.test.ts`

Add tests for `getMeasuresForGoal`:
```typescript
describe("getMeasuresForGoal", () => {
  it("ranks measures by evidence strength descending", () => { ... });
  it("deduplicates measures across KPI groups, keeping highest evidence", () => { ... });
  it("excludes measures below evidence threshold", () => { ... });
  it("includes contributing city details", () => { ... });
  it("returns empty array for a goal with no matching results", () => { ... });
});
```

### Step 6: Final verification

- [ ] Navigate from each goal card to its goal page — page renders
- [ ] Measures are ranked by evidence strength (strongest first)
- [ ] Each card shows plain-language name, description, city count, outcome, badge
- [ ] City links are clickable (point to Insights city profile or Data city page)
- [ ] Cross-link to impact analysis works and switches to Data experience
- [ ] Invalid slugs redirect to `/insights/goals`
- [ ] No technical jargon visible (no "net flow", "coefficient", "regression")
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`

---

## Out of Scope

- Insights city profile pages (Epic 9 — city links may initially point to Data city pages)
- Recomputation of model coefficients
- New KPI groups or goal categories
- MCDA integration on goal pages

---

## PR Checklist

- [ ] Included in same PR as T13
- [ ] Six goal pages render with ranked measures
- [ ] Rankings match impact analysis without recomputation
- [ ] All measures use T04 plain-language names
- [ ] Evidence badges on every measure card
- [ ] Counterpart link to Data experience works
- [ ] All tests pass
