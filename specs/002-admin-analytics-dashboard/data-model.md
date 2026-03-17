# Data Model: Platform Analytics Dashboard

**Phase**: 1 | **Feature**: 002-admin-analytics-dashboard | **Date**: 2026-03-17

---

## Source Entities (read-only — no schema changes)

This feature reads existing data only. No new database tables or Prisma schema changes required.

### Living Labs (`labs`)

| Field | Type | Notes |
|-------|------|-------|
| id | BigInt (PK) | Used as grouping key |
| name | String | Display label in tables/charts |
| country | String? | Display in table |
| created_at | DateTime? | — |
| updated_at | DateTime? | — |

**Relationships used**:
- `kpiresults[]` → via `getLivingLabs()` populated include
- `living_lab_projects_implementation[]` → via populated include (projects)

### KPI Definitions (`kpidefinitions`)

| Field | Type | Notes |
|-------|------|-------|
| id | BigInt (PK) | Used for mapping results → definitions |
| kpi_number | String | Display label (e.g. "1", "2.1") |
| name | String | Display label |
| parent_kpi_id | BigInt? (FK → self) | `null` = main/parent KPI |
| type | Enum (GLOBAL, LOCAL) | Used for type breakdown |

**Main/parent KPI identification**: `parent_kpi_id IS NULL`

### KPI Results (`kpiresults`)

| Field | Type | Notes |
|-------|------|-------|
| id | BigInt (PK) | — |
| kpidefinition_id | BigInt (FK → kpidefinitions) | Links result to definition |
| living_lab_id | BigInt (FK → labs) | Links result to lab |
| value | Float | The submitted measurement |
| date | DateTime | Used for timeline aggregation (year extraction) |

**Accessed via**: `ILivingLabPopulated.kpi_results: IKpiResultGroup[]`, where each group has `results: IKpiResult[]`

### Projects/Measures (`projects` + `living_lab_projects_implementation`)

| Field | Type | Notes |
|-------|------|-------|
| projects.id | BigInt (PK) | — |
| projects.name | String | Display label |
| projects.type | String (PUSH, PULL, OTHER) | Used for type breakdown |
| impl.project_id | BigInt (FK) | Links implementation to project |
| impl.living_lab_id | BigInt (FK) | Links implementation to lab |
| impl.start_at | DateTime? | Used for "last updated" computation |
| impl.updated_at | DateTime? | Used for "last updated" computation |

### Users (`users`)

| Field | Type | Notes |
|-------|------|-------|
| id | BigInt (PK) | — |
| name | String | — |
| email | String | — |
| status | String (signup, active, disabled) | Used for active vs pending breakdown |

---

## Computed Analytics Data Structures

These are TypeScript interfaces for data computed in `src/lib/helpers/analytics.ts` and passed as props from the Astro page to components.

### MetricCardData

```typescript
/** Data for a single summary metric card */
interface MetricCardData {
  label: string;        // e.g. "Living Labs", "Users (active / pending)"
  value: string;        // Primary display value, e.g. "12", "45 / 3"
  icon?: string;        // Optional icon identifier
  color?: string;       // Tailwind color class, e.g. "text-primary"
}
```

### LabKpiTimelineData

```typescript
/** Data for the D3 line chart — one series per living lab */
interface LabKpiTimelineSeries {
  labId: number;
  labName: string;
  color: string;
  dataPoints: { year: number; count: number }[];
}
```

### AlertCardData

```typescript
/** Data for a single analytics alert card */
interface AlertCardData {
  label: string;          // e.g. "Labs with no KPI results"
  value: number;          // Count
  severity: "warning" | "danger" | "info";
  items?: string[];       // Optional list of affected entity names
}
```

### LivingLabMetricsRow

```typescript
/** One row in the living lab metrics table */
interface LivingLabMetricsRow {
  labId: number;
  labName: string;
  totalResultEntries: number;      // All KPI results (including child KPIs)
  kpisCoveredCount: number;        // Distinct main/parent KPIs with results
  totalMainKpis: number;           // Total main/parent KPI definitions
  pushMeasuresCount: number;
  pullMeasuresCount: number;
  lastUpdatedAt: string | null;    // ISO date string or null
}
```

### KpiCoverageRow

```typescript
/** One row in the KPI coverage table */
interface KpiCoverageRow {
  kpiId: number;
  kpiNumber: string;            // e.g. "1", "2", "3"
  kpiName: string;
  kpiType: "GLOBAL" | "LOCAL";
  labsWithResultsCount: number; // How many labs have submitted results
  totalLabs: number;            // Total number of labs as a reference
}
```

### LabMeasuresBarData

```typescript
/** Data for the D3 bar chart — one group per living lab */
interface LabMeasuresBarData {
  labName: string;
  pushCount: number;
  pullCount: number;
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  analytics.astro (SSR frontmatter)                  │
│                                                     │
│  1. ApiClient.getLivingLabs()  → ILivingLabPopulated[] │
│  2. ApiClient.getKPIs({})     → IKpi[]              │
│  3. ApiClient.getMeasures()   → IProject[]          │
│  4. ApiClient.getUsers()      → User[]              │
│                                                     │
│  ┌───────────────────────────────┐                  │
│  │  analytics.ts helpers         │                  │
│  │  - computeMetricCards()       │                  │
│  │  - computeLabKpiTimeline()    │                  │
│  │  - computeAlerts()            │                  │
│  │  - computeLabMetricsTable()   │                  │
│  │  - computeKpiCoverageTable()  │                  │
│  │  - computeLabMeasuresBar()    │                  │
│  └───────────────────────────────┘                  │
│                                                     │
│  Pass computed data as props ↓                      │
├─────────────────────────────────────────────────────┤
│  REACT COMPONENTS (SSR-only, no client:* → zero JS)  │
│  ┌──────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │MetricCard│ │AnalyticsAlerts│ │LivingLabMetrics│  │
│  │ (×4)     │ │              │ │   Table        │  │
│  └──────────┘ └──────────────┘ └────────────────┘  │
│  ┌──────────────────┐                               │
│  │KPICoverageTable  │                               │
│  └──────────────────┘                               │
├─────────────────────────────────────────────────────┤
│  REACT ISLANDS (client:load — D3 requires DOM)       │
│  ┌───────────────────────┐ ┌──────────────────────┐ │
│  │D3LineChartLabKPIs     │ │D3BarChartLabMeasures │ │
│  │  Overtime             │ │                      │ │
│  └───────────────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Mapping: KPI Result → Parent KPI

To determine coverage of main/parent KPIs:

```
For each IKpiResult in a lab's kpi_results:
  1. Get kpidefinition_id from the result
  2. Look up the IKpi definition
  3. If definition.parent_kpi_id is not null → use parent_kpi_id as the "covered parent"
  4. If definition.parent_kpi_id is null → this IS a parent KPI, use definition.id
  5. Add resolved parent ID to the "covered" set for that lab
```

This ensures a parent KPI is counted as "covered" whether the result was submitted against the parent directly or against any of its children.
