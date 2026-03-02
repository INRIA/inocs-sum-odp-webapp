# Data Model: CSV Dataset Download

**Feature**: 001-csv-download | **Date**: 2026-02-27

---

## Export Types

### 1. KPI Results Export

Produces rows from a join of five tables. Internal technical columns (`*_id`, `created_at`, `updated_at`, `user_id`) are excluded from output.

#### Source Tables

| Table | Role in Join |
|---|---|
| `kpiresults` | Primary table — one row per export row |
| `labs` | `kpiresults.living_lab_id → labs.id` |
| `kpidefinitions` | `kpiresults.kpidefinition_id → kpidefinitions.id` |
| `kpidefinitions_category` | Bridge: `kpidefinitions.id → kpidefinitions_category.kpidefinition_id` |
| `categories` | `kpidefinitions_category.category_id → categories.id` |
| `transport_mode` | Optional: `kpiresults.transport_mode_id → transport_mode.id` (nullable) |

#### Output CSV Columns

| CSV header | Source field | Type | Notes |
|---|---|---|---|
| `Lab` | `labs.name` | string | |
| `KPI Number` | `kpidefinitions.kpi_number` | string | |
| `KPI Name` | `kpidefinitions.name` | string | |
| `KPI Group` | `categories.name` | string | First category if multiple exist |
| `Metric` | `kpidefinitions.metric` | string | |
| `Value` | `kpiresults.value` | number | Float; serialized as decimal |
| `Date` | `kpiresults.date` | string | ISO date `YYYY-MM-DD` |
| `Transport Mode` | `transport_mode.name` | string or empty | Empty string when null |

#### Filters

| Param | Type | Effect |
|---|---|---|
| *(none)* | — | All KPI results for all labs |
| `living_lab_id` | positive integer | WHERE `kpiresults.living_lab_id = ?` |
| `category_id` | positive integer | WHERE `categories.id = ?` |
| `kpidefinition_id` | positive integer | WHERE `kpiresults.kpidefinition_id = ?` |
| `living_lab_id` + `kpidefinition_id` | both | Combined AND filter |

Filters are applied additively (AND). No OR multi-filter logic is required.

---

### 2. Projects (Measures Implementation) Export

Produces rows from a join of three tables. Internal columns excluded.

#### Source Tables

| Table | Role in Join |
|---|---|
| `living_lab_projects_implementation` | Primary table |
| `labs` | `living_lab_projects_implementation.living_lab_id → labs.id` |
| `projects` | `living_lab_projects_implementation.project_id → projects.id` |

#### Output CSV Columns

| CSV header | Source field | Type | Notes |
|---|---|---|---|
| `Lab` | `labs.name` | string | |
| `Project Name` | `projects.name` | string | |
| `Project Type` | `projects.type` | string | |
| `Start Date` | `living_lab_projects_implementation.start_at` | string or empty | ISO date-time, formatted as `YYYY-MM-DD`; empty string when null |
| `Description` | `living_lab_projects_implementation.description` | string or empty | Empty string when null |

#### Filters

| Param | Type | Effect |
|---|---|---|
| *(none)* | — | All measure implementations for all labs |
| `living_lab_id` | positive integer | WHERE `living_lab_projects_implementation.living_lab_id = ?` |

---

## Repository Output Types (typed rows returned by repository before serialization)

```typescript
// Returned by CsvExportRepository.findKpiResultsForCsv()
interface KpiResultCsvRow {
  lab: string;
  kpi_number: string;
  kpi_name: string;
  kpi_group: string;
  metric: string;
  value: number;
  date: string;        // YYYY-MM-DD
  transport_mode: string;  // empty string when none
}

// Returned by CsvExportRepository.findProjectsForCsv()
interface ProjectCsvRow {
  lab: string;
  project_name: string;
  project_type: string;
  start_date: string;       // YYYY-MM-DD or empty string
  description: string;      // empty string when null
}
```

---

## CSV Row Validation Rules

- `value` must be a finite number (Prisma guarantees this via Float column).
- `date` is never null (Prisma `@db.Date` not optional).
- `transport_mode` defaults to `""` when `transport_mode_id` is null.
- `start_date` defaults to `""` when `start_at` is null.
- `description` defaults to `""` when null.
- All string values are passed through the `CsvSerializer` which double-quotes and escapes `"` characters.

---

## State Transitions (component)

```
idle  ──[click]──▶  loading  ──[success]──▶  idle
                            └──[error]────▶  error_shown  ──[next render]──▶  idle
```

- `idle`: button enabled (or disabled if required filter props are absent)
- `loading`: button disabled + spinner SVG + "Downloading…" text
- `error_shown`: inline error message visible below/near button; button re-enabled after brief display timeout or on next user interaction
