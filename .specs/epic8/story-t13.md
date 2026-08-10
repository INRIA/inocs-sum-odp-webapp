# Story T13 — Insights Homepage (Goal-Led Entry)

**Epic:** 8 — Insights Goal Experience
**Size:** L
**Dependencies:** T03, T04, T05, T08, T10, T12 (Epics 2, 3, 4, 6)
**Branch:** `feature/epic8-insights-goals`

---

## User Story

> As a decision-maker visiting the Insights experience, I see a page organized around city goals — "Reduce private car use", "Cut emissions", etc. — so I can find evidence for the outcomes I care about, without navigating raw data or understanding technical KPI groupings.

---

## Acceptance Criteria

- [ ] AC-1: Six goal cards render below the hero, each showing the goal title, description, associated measure count, and contributing city count from live data
- [ ] AC-2: No goal card renders for a goal with no qualifying evidence (above T05 threshold)
- [ ] AC-3: A "Top findings" block shows three plain-language sentences, each carrying an evidence-strength badge and city count
- [ ] AC-4: A map shows cities that have evidence, reusing the T06 classification
- [ ] AC-5: A cross-link to the Data experience is present
- [ ] AC-6: The page contains no implementation-record indicator, no single-estimation series, and no untranslated technical term
- [ ] AC-7: The `/insights/goals` route is registered as `"insights"` in the experience registry

---

## Implementation Steps

### Step 1: Create the goal→KPI-group mapping

File: `src/lib/insights/goals.ts`

Define the `GOALS` array with six entries (see architecture.md section 3b). Each entry has `slug`, `title`, `description`, `kpiGroups[]`, and `icon`. The `kpiGroups` values must match the identifiers used in the impact-analysis data model — verify against the actual data before finalizing.

### Step 2: Create goal helper functions

File: `src/lib/insights/goalHelpers.ts`

Implement:
- `countMeasuresForGoal(goal, impactResults, measures)` — count unique measures with evidence above threshold
- `countCitiesForGoal(goal, impactResults, livingLabs)` — count cities contributing evidence
- `hasQualifyingEvidence(goal, impactResults)` — boolean gate for rendering
- `computeTopFindings(impactResults, goals, count)` — top N findings as plain-language sentences

See architecture.md section 3c for implementation details.

### Step 3: Create GoalCard component

File: `src/components/react/Insights/GoalCard.tsx`

A card component receiving `title`, `description`, `measureCount`, `cityCount`, `href`. Renders as a clickable card linking to the goal page. See architecture.md section 3d.

### Step 4: Create TopFindings component

File: `src/components/react/Insights/TopFindings.tsx`

Renders finding sentences with evidence badges. Each finding formatted as: "[Measure] is associated with [direction] in [KPI group] across [N] cities." See architecture.md section 3e.

### Step 5: Create InsightsCityMap component

File: `src/components/react/Insights/InsightsCityMap.tsx`

Reuses or wraps the existing `LivingLabsMapSection` filtered to show only cities with evidence (per T06 classification). Show the T06-style legend.

### Step 6: Create barrel export

File: `src/components/react/Insights/index.ts`

Export `GoalCard`, `TopFindings`, `InsightsCityMap`.

### Step 7: Create the Insights homepage

File: `src/pages/insights/goals/index.astro`

Compose the page: hero, goal cards grid, top findings section, city map section, cross-link to Data experience. Fetch data via `ApiClient` in the frontmatter. See architecture.md section 3a for full markup.

### Step 8: Register route in experience registry

File: `src/lib/experiences/registry.ts`

Add to the `ROUTES` array:
```typescript
{ pattern: "/insights/goals", experience: "insights" },
```

### Step 9: Write tests

**9a.** `src/lib/insights/goalHelpers.test.ts` — unit tests for all helper functions.

**9b.** Add to `src/lib/experiences/registry.test.ts`:
```typescript
it("resolves /insights/goals to insights experience", () => {
  const state = resolveExperience("/insights/goals", new URLSearchParams());
  expect(state.active).toBe("insights");
});
```

### Step 10: Final verification

- [ ] Navigate to `/insights/goals` — page renders with goal cards
- [ ] Each card shows non-zero measure and city counts
- [ ] Goals with no evidence are not rendered
- [ ] Top findings show three sentences with badges
- [ ] Map shows cities with evidence
- [ ] Cross-link switches to Data experience
- [ ] No PROMETHEE/regression/technical jargon visible
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`

---

## Out of Scope

- Goal page content (T15)
- Insights city profiles (Epic 9)
- Insights menu creation (T12, Epic 6)
- Recomputation of impact-analysis results
- Any new data models or API endpoints

---

## PR Checklist

- [ ] One PR covering T13 and T15
- [ ] Goal cards render with live data
- [ ] No card for goals without evidence
- [ ] Top findings in plain language with badges
- [ ] Route registered in experience registry
- [ ] All tests pass
