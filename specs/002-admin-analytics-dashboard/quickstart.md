# Quickstart: Platform Analytics Dashboard

**Feature**: 002-admin-analytics-dashboard  
**Branch**: `002-admin-analytics-dashboard`

---

## Prerequisites

1. Node.js 20+
2. Running PostgreSQL instance with seeded data
3. Project dependencies installed: `npm install`

## Quick Setup

```bash
# 1. Switch to feature branch
git checkout 002-admin-analytics-dashboard

# 2. Install dependencies (if needed)
npm install

# 3. Start dev server
npm run dev
```

## Navigate to the Page

Open: `http://localhost:4321/lab-admin/analytics`

**Auth required**: Log in at `/lab-admin/login` first. Any authenticated user with lab-admin access can view the page.

## What to Verify

### 1. Metric Cards (top section)
- 4 summary cards: Living Labs count, Users (active/pending), Total KPI Results, KPI Coverage Rate
- All values should be non-negative integers (or ratios for coverage)

### 2. D3 Line Chart — KPI Results Over Time
- One colored line per living lab
- X axis: years, Y axis: count of KPI results
- Hover tooltips on data points

### 3. Analytics Alerts
- Warning cards for: labs with no KPI results, labs with no measures, KPIs with no results, pending users
- Should show zero counts if no alerts

### 4. Living Lab Metrics Table
- One row per lab: total results, KPIs covered, measures (PUSH/PULL), last updated
- All columns should have values (zero if no data)

### 5. KPI Coverage Table
- One row per main/parent KPI definition
- Shows how many labs have provided results for each KPI

### 6. D3 Bar Chart — Measures per Lab
- Grouped bars: PUSH (primary color) vs PULL (secondary color)
- One group per living lab on X axis

## Running Tests

```bash
# Run analytics-specific tests
npx vitest run src/lib/helpers/analytics.test.ts
npx vitest run src/components/react/Analytics/

# Run all tests
npx vitest run
```

## File Locations

| Component | Path |
|-----------|------|
| Main page | `src/pages/lab-admin/analytics.astro` |
| Helper functions | `src/lib/helpers/analytics.ts` |
| Helper tests | `src/lib/helpers/analytics.test.ts` |
| MetricCard (React SSR) | `src/components/react/Analytics/MetricCard.tsx` |
| AnalyticsAlerts (React SSR) | `src/components/react/Analytics/AnalyticsAlerts.tsx` |
| LivingLabMetricsTable (React SSR) | `src/components/react/Analytics/LivingLabMetricsTable.tsx` |
| KPICoverageTable (React SSR) | `src/components/react/Analytics/KPICoverageTable.tsx` |
| D3LineChartLabKPIsOvertime (React island) | `src/components/react/Analytics/D3LineChartLabKPIsOvertime.tsx` |
| D3BarChartLabMeasures (React island) | `src/components/react/Analytics/D3BarChartLabMeasures.tsx` |
| Shared types | `src/components/react/Analytics/types.ts` |
| ApiClient addition | `src/lib/api-client/ApiClient.ts` (getUsers method) |
| API route fix | `src/pages/api/v1/users.ts` (support no-filter all-users) |
