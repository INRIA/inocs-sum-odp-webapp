# Story T14 — Insights City Profile

**Epic:** 9 — Insights City Experience
**Size:** L
**Dependencies:** T02, T03, T06, T07, T10 (Epics 2, 4, 5, 6)
**Branch:** `feature/epic9-insights-city`

---

## User Story

> As a city planner viewing the Insights experience, I see a curated profile for a city showing what they did, what happened, and relevant lessons — without implementation-record indicators or raw single-point data — so I can quickly assess this city's mobility experience and share the page with colleagues.

---

## Acceptance Criteria

- [ ] AC-1: Insights city profile has four sections: Overview, What they did, Results at a glance, Lessons & documents
- [ ] AC-2: No implementation-record indicator appears (T02 KPIs filtered out via `IMPLEMENTATION_KPIS`)
- [ ] AC-3: No single-estimation chart appears (T03 sufficiency rule via `isChartable`)
- [ ] AC-4: Every figure carries its T07 plain-language reading, unit, reporting period, and last-updated date
- [ ] AC-5: Counterpart link resolves to the same city in the Data experience (`/living-lab-city/[labId]`)
- [ ] AC-6: A city with no data shows the T06 "Registered — no data published yet" panel
- [ ] AC-7: Push/pull measures are listed with local description and start date

---

## Implementation Steps

### Step 1: Create InsightsCityOverview component

File: `src/components/react/Insights/InsightsCityOverview.tsx`

Two-card layout: city context (population, area, country) and headline result with last-updated date. See architecture.md section 3b.

### Step 2: Create InsightsCityMeasures component

File: `src/components/react/Insights/InsightsCityMeasures.tsx`

Split measures into push and pull groups. Each measure card shows name, description, and start date. See architecture.md section 3c.

### Step 3: Create InsightsCityKPIs component

File: `src/components/react/Insights/InsightsCityKPIs.tsx`

Grid of outcome KPI cards. For each KPI:
1. Filter out implementation-record KPIs using `IMPLEMENTATION_KPIS` from `src/config/implementationKpis.ts`
2. Filter out single-estimation KPIs using `isChartable` from `src/lib/utils/kpiSufficiency.ts`
3. Render chart with T07 reading from `KPI_READINGS` config
4. Show unit, reporting period, direction-of-good, last-updated date

### Step 4: Create CityDataPending component

File: `src/components/react/Insights/CityDataPending.tsx`

T06 empty-state panel showing city name, registration date, and link to Data city page. See architecture.md section 3e.

### Step 5: Replace placeholder in city page

File: `src/pages/insights/city/[labId].astro`

Replace the "Coming soon" placeholder with:
1. Fetch lab data via `ApiClient.getLivingLab()`
2. Check city status via `getFullCityStatus()`
3. If data-pending: render `CityDataPending`
4. If has data: filter KPIs, compose four sections
5. Add counterpart link to Data city page

See architecture.md section 3a for full markup.

### Step 6: Update component barrel exports

File: `src/components/react/Insights/index.ts`

Export `InsightsCityOverview`, `InsightsCityMeasures`, `InsightsCityKPIs`, `CityDataPending`.

### Step 7: Write tests

**7a.** `src/components/react/Insights/InsightsCityKPIs.test.tsx` — verify implementation-record exclusion, chartability filter, T07 reading display.

**7b.** `src/components/react/Insights/CityDataPending.test.tsx` — verify panel renders with city name and registration date.

### Step 8: Final verification

- [ ] Navigate to a city with data — four sections render
- [ ] Navigate to a city without data — T06 panel renders, no empty charts
- [ ] Verify no implementation-record indicators visible
- [ ] Verify no single-point charts
- [ ] Check T07 readings on every KPI card
- [ ] Click counterpart link — arrives at same city in Data experience
- [ ] Click from Data city page back to Insights — counterpart works bidirectionally
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`

---

## Out of Scope

- Modifying the Data city page (`/living-lab-city/[labId].astro`)
- Insights city listing page (`/insights/cities`)
- Lessons & documents content (T17, separate story)
- KPI editing or admin functionality
- i18n / translations

---

## PR Checklist

- [ ] One PR covering T14 and T17
- [ ] Four sections render for cities with data
- [ ] T06 panel for cities without data
- [ ] No implementation-record indicators
- [ ] No single-estimation charts
- [ ] T07 readings on every figure
- [ ] Counterpart link works both ways
- [ ] All tests pass
