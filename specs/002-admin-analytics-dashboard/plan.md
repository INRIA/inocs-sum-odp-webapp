# Implementation Plan: Platform Analytics Dashboard

**Branch**: `002-admin-analytics-dashboard` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-admin-analytics-dashboard/spec.md`

## Summary

Add a new read-only SSR Astro page at `/lab-admin/analytics` that displays platform-wide metrics for administrators. The page retrieves all living labs (with KPI results and measures), KPI definitions, and users via `ApiClient`, computes aggregated analytics in Astro frontmatter, and passes data as props to 6 React components. Four components render server-side as static HTML (MetricCard, AnalyticsAlerts, LivingLabMetricsTable, KPICoverageTable). Two D3-based chart components require `client:load` for DOM access (D3LineChartLabKPIsOvertime, D3BarChartLabMeasures).

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node.js 20, React 18  
**Primary Dependencies**: Astro 4 (SSR), Prisma Client (MySQL), React 18, D3.js v7, `@testing-library/react`, Vitest  
**Storage**: MySQL (via Prisma) — *note: constitution names PostgreSQL but production schema is MySQL; see compliance note below*  
**Testing**: Vitest + `@testing-library/react` + `@testing-library/user-event`, `happy-dom`  
**Target Platform**: Node.js SSR server (Astro), browser-side React islands for D3 charts  
**Project Type**: Web application (SSR + React islands / BFF pattern)  
**Performance Goals**: Page loads within 3 seconds for up to 50 living labs, 500 KPI results, 200 measures  
**Constraints**: No new database engines; no raw SQL; strict TypeScript; data aggregation server-side only; D3 charts require client:load for DOM access  
**Scale/Scope**: Platform analytics for ~50 labs × ~50 KPI definitions × multi-year dates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] Tests-first plan exists for all new behavior (Red → Green → Refactor documented).
- [x] A new test file per new feature is listed as acceptance criteria.
- [x] Test scope includes happy path, user interactions, displayed information, and edge cases.
- [x] Astro SSR responsibilities are separated from React island interactivity.
- [x] TypeScript strict mode remains enabled with no weakening changes.
- [x] Test implementation uses Vitest + `@testing-library/react`.
- [⚠] Data layer uses Prisma + **MySQL** only — constitution says PostgreSQL but the live `schema.prisma` uses MySQL. This is a pre-existing discrepancy. The feature follows the actual schema (MySQL via Prisma) and does not introduce any raw SQL or secondary databases. Exception documented here.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-analytics-dashboard/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── README.md        ← No new external contracts (read-only page)
└── tasks.md             ← Phase 2 output
```

### Source Code

```text
src/
├── pages/lab-admin/
│   └── analytics.astro              ← NEW: SSR page with data aggregation
│
├── lib/helpers/
│   ├── analytics.ts                 ← NEW: analytics computation helpers
│   └── analytics.test.ts            ← NEW: helper unit tests
│
├── lib/api-client/
│   └── ApiClient.ts                 ← MODIFIED: add getUsers() method
│
├── pages/api/v1/
│   └── users.ts                     ← MODIFIED: support no-filter all-users query
│
└── components/react/Analytics/
    ├── index.ts                     ← NEW: barrel export
    ├── types.ts                     ← NEW: shared TypeScript interfaces
    ├── MetricCard.tsx               ← NEW: summary metric card (SSR-only)
    ├── MetricCard.test.tsx          ← NEW: component tests
    ├── AnalyticsAlerts.tsx          ← NEW: alert cards (SSR-only)
    ├── AnalyticsAlerts.test.tsx     ← NEW: component tests
    ├── LivingLabMetricsTable.tsx    ← NEW: per-lab metrics table (SSR-only)
    ├── LivingLabMetricsTable.test.tsx  ← NEW: component tests
    ├── KPICoverageTable.tsx         ← NEW: KPI coverage table (SSR-only)
    ├── KPICoverageTable.test.tsx    ← NEW: component tests
    ├── D3LineChartLabKPIsOvertime.tsx   ← NEW: D3 line chart (client:load)
    ├── D3LineChartLabKPIsOvertime.test.tsx  ← NEW: component tests
    ├── D3BarChartLabMeasures.tsx    ← NEW: D3 bar chart (client:load)
    └── D3BarChartLabMeasures.test.tsx   ← NEW: component tests
```

**Structure Decision**: Single Astro project following existing BFF layering. All new files placed in their conventional locations within the existing `src/` hierarchy. React components grouped under a new `Analytics/` directory following the established pattern (e.g., `KpiCards/`, `MCDAAnalysis/`).

---

## Phase 0: Research Findings

> See [research.md](./research.md) for full rationale. Summary of resolved unknowns:

| Unknown | Decision |
|---|---|
| Retrieving all KPI results | Use `ApiClient.getLivingLabs()` which returns populated `kpi_results` per lab; aggregate in Astro frontmatter |
| User counts | Add `getUsers()` to ApiClient, fix `/api/v1/users` route to support no-filter query |
| Main/parent KPI identification | Filter `kpis.filter(k => !k.parent_kpi_id)` — parent_kpi_id null means main KPI |
| KPI coverage calculation | Build parent ID mapping, resolve child results to parents, coverage = covered Set size / total parents |
| D3 line chart | New `D3LineChartLabKPIsOvertime` component — different data shape than existing charts |
| D3 bar chart | New `D3BarChartLabMeasures` component for grouped PUSH/PULL bars per lab |
| Component architecture | All 6 components are React; 4 SSR-rendered (no client:*), 2 D3 charts use client:load |
| Theme colors in D3 | Read CSS custom properties at runtime via `getComputedStyle()` |

---

## Phase 1: Design & Architecture

### Data Model

> See [data-model.md](./data-model.md) for full entity details and computed interfaces.

**Source entities (read-only — no schema changes)**:
- `labs` (living labs with kpi_results and projects)
- `kpidefinitions` (KPI definitions with parent_kpi_id)
- `kpiresults` (KPI result values)
- `projects` + `living_lab_projects_implementation` (measures)
- `users` (platform users)

**Computed data structures** (TypeScript interfaces in `analytics.ts`):
- `MetricCardData` — summary card display
- `LabKpiTimelineSeries` — D3 line chart data
- `AlertCardData` — analytics alerts
- `LivingLabMetricsRow` — per-lab table row
- `KpiCoverageRow` — KPI coverage table row
- `LabMeasuresBarData` — D3 bar chart data

---

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│  analytics.astro (SSR frontmatter)                  │
│                                                     │
│  1. ApiClient.getLivingLabs()  → ILivingLabPopulated[] │
│  2. ApiClient.getKPIs({})     → IKpi[]              │
│  3. ApiClient.getMeasures()   → IProject[]          │
│  4. ApiClient.getUsers()      → User[]              │
│                                                     │
│  analytics.ts helper functions:                     │
│  - computeMetricCards()                             │
│  - computeLabKpiTimeline()                          │
│  - computeAlerts()                                  │
│  - computeLabMetricsTable()                         │
│  - computeKpiCoverageTable()                        │
│  - computeLabMeasuresBar()                          │
│                                                     │
│  Pass computed data as props to components ↓        │
├─────────────────────────────────────────────────────┤
│  REACT COMPONENTS (SSR-only, no client:*)           │
│  MetricCard, AnalyticsAlerts, LivingLabMetricsTable │
│  KPICoverageTable                                   │
├─────────────────────────────────────────────────────┤
│  REACT ISLANDS (client:load — D3 requires DOM)      │
│  D3LineChartLabKPIsOvertime, D3BarChartLabMeasures  │
└─────────────────────────────────────────────────────┘
```

---

### API Client Addition

Add new method to `ApiClient.ts`:

```typescript
async getUsers(options?: { status?: string }): Promise<User[] | null> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  return this.request<User[]>(`/users${params.toString() ? `?${params}` : ""}`);
}
```

### API Route Fix

Update `GET /api/v1/users` to support no-filter all-users query:

```typescript
// In src/pages/api/v1/users.ts
// If no filters provided, call userService.getAllUsers() instead of findUsers({})
const hasFilters = status || role_id;
const users = hasFilters 
  ? await userService.findUsers({ status, role_id })
  : await userService.getAllUsers();
```

---

### Component Architecture

| Component | Type | Rendering | Props |
|-----------|------|-----------|-------|
| MetricCard | React | SSR (no client:*) | `MetricCardData` |
| AnalyticsAlerts | React | SSR (no client:*) | `AlertCardData[]` |
| LivingLabMetricsTable | React | SSR (no client:*) | `LivingLabMetricsRow[]` |
| KPICoverageTable | React | SSR (no client:*) | `KpiCoverageRow[]` |
| D3LineChartLabKPIsOvertime | React | client:load | `LabKpiTimelineSeries[]` |
| D3BarChartLabMeasures | React | client:load | `LabMeasuresBarData[]` |

**SSR-only components**: Imported into Astro without `client:*` directive — Astro renders them to static HTML server-side with zero client JavaScript.

**D3 chart components**: Require `client:load` because D3 needs DOM access for SVG rendering, responsive sizing, and hover tooltips.

---

### Test Scope

| Test file | Coverage |
|---|---|
| `src/lib/helpers/analytics.test.ts` | All computation helpers: metric aggregation, timeline grouping, alerts, table data |
| `src/components/react/Analytics/MetricCard.test.tsx` | Renders label, value, icon, color classes |
| `src/components/react/Analytics/AnalyticsAlerts.test.tsx` | Renders alerts by severity, shows items list |
| `src/components/react/Analytics/LivingLabMetricsTable.test.tsx` | Table renders all columns, handles empty data |
| `src/components/react/Analytics/KPICoverageTable.test.tsx` | Table renders KPI rows, coverage counts |
| `src/components/react/Analytics/D3LineChartLabKPIsOvertime.test.tsx` | SVG renders, axes present, data points displayed |
| `src/components/react/Analytics/D3BarChartLabMeasures.test.tsx` | SVG renders, grouped bars present, labels displayed |

---

## Compliance Notes

1. **MySQL vs PostgreSQL**: Feature uses MySQL via Prisma client as per the actual `schema.prisma`. No raw SQL introduced. Pre-existing constitution discrepancy — not a new deviation introduced by this feature.
2. **SSR/Island separation**: Data aggregation happens in Astro frontmatter (SSR). 4 components render as static HTML. 2 D3 components hydrate client-side for DOM access only.
3. **Tests-first**: All components and helpers have corresponding test files. Tests will be written before implementation following TDD.
4. **No new external contracts**: This is a read-only page consuming existing data via ApiClient. Only addition is `getUsers()` method wrapping existing endpoint.
