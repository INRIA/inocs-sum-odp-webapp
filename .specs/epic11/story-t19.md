# Story T19 — Data Homepage & Coverage Matrix

**Epic:** 11 — Data Console & Downloads
**Size:** L
**Dependencies:** T03, T09, T10 (Epics 2, 5, 6)
**Branch:** `feature/epic11-data-console`

---

## User Story

> As a researcher or data analyst, I see a console-style data homepage showing at-a-glance platform status and a coverage matrix of cities × KPI groups — so I can immediately understand what data exists, where the gaps are, and navigate to the tools I need.

---

## Acceptance Criteria

- [ ] AC-1: Coverage matrix shows three distinct cell states (before & after / baseline only / none) in both text and colour with a visible key
- [ ] AC-2: Figures agree with T09 counters — status tiles use the same `computePlatformCounters()`
- [ ] AC-3: A cell marked chartable in the matrix is chartable in the KPI dashboard (T03 rule consistency)
- [ ] AC-4: Every existing dashboard and tool is reachable from the data homepage quick links
- [ ] AC-5: Cross-link to Insights experience is present
- [ ] AC-6: Colour never carries meaning alone — text labels and icons accompany every cell state

---

## Implementation Steps

### Step 1: Create coverage matrix utility

File: `src/lib/utils/coverageMatrix.ts`

Implement `buildCoverageMatrix(labs, kpiDefinitions, kpiResults)` that:
1. Groups KPI definitions by their category/group
2. For each lab × KPI group, counts validated estimations
3. Applies the T03 rule: ≥2 → "before-after", 1 → "baseline-only", 0 → "none"
4. Returns `CoverageMatrixData` with labs, groups, and cells

See architecture.md section 3b.

### Step 2: Create StatusTiles component

File: `src/components/react/DataConsole/StatusTiles.tsx`

Grid of status tiles: observations, cities with before/after, contributing cities, KPI definitions, last model run, model status. See architecture.md section 3d.

### Step 3: Create CoverageMatrix component

File: `src/components/react/DataConsole/CoverageMatrix.tsx`

Table component with labs as rows, KPI groups as columns. Each cell shows icon + text label. Visible key above the table. Horizontal scrolling for responsive display. See architecture.md section 3c.

### Step 4: Create QuickLinks component

File: `src/components/react/DataConsole/QuickLinks.tsx`

Grid of cards linking to every existing dashboard, tool, and section. See architecture.md section 3e.

### Step 5: Create barrel export

File: `src/components/react/DataConsole/index.ts`

### Step 6: Create the data homepage

File: `src/pages/data/index.astro`

Compose status tiles, coverage matrix, quick links, and Insights cross-link. Fetch all data server-side. See architecture.md section 3a.

### Step 7: Register route and write tests

**7a.** Verify `/data` route resolution in experience registry — may already be covered by existing prefix match.

**7b.** `src/lib/utils/coverageMatrix.test.ts`:
```typescript
describe("buildCoverageMatrix", () => {
  it("marks ≥2 estimations as before-after", () => { ... });
  it("marks 1 estimation as baseline-only", () => { ... });
  it("marks 0 estimations as none", () => { ... });
  it("uses only validated estimations", () => { ... });
});
```

### Step 8: Final verification

- [ ] Navigate to `/data` — status tiles and matrix render
- [ ] Matrix key is visible without interaction
- [ ] Each cell has both icon/text and colour
- [ ] Status tile values match homepage trust strip (T09)
- [ ] Click a "before-after" cell's city — verify chartable in KPI dashboard
- [ ] All quick links resolve to correct pages
- [ ] Cross-link switches to Insights experience
- [ ] Run `npm run test:run` && `npm run build`

---

## Out of Scope

- Closing data coverage gaps (WP1 data-collection task)
- New download endpoints
- Insights experience content
- KPI dashboard modifications

---

## PR Checklist

- [ ] One PR covering T19 and T20
- [ ] Three cell states in text and colour with visible key
- [ ] Status tiles agree with T09 counters
- [ ] Chartable consistency with KPI dashboard
- [ ] All dashboards/tools reachable from quick links
- [ ] All tests pass
