# Data Model: MCDA Custom Analysis

**Feature Branch**: `001-mcda-custom-analysis`  
**Phase**: 1 — Design  
**Date**: 2026-02-24

---

## Summary

This feature introduces no new database tables. All persistence uses the existing `job_runs`
table via the existing Prisma schema and `JobRunsRepository`. The only new data structures are
TypeScript types that describe the shape of data flowing between the React island, the BFF API
route, and the external analysis API.

---

## Existing Entity: `JobRun` (no schema change)

**Prisma model**: `job_runs` (existing, unchanged)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (UUID) | Primary key, set by external API |
| `job_name` | `String` | `"mcda_analysis_user_personalized"` for custom runs |
| `status` | `String` | `PENDING` / `STARTED` / `SUCCESS` / `FAILURE` |
| `message` | `String?` | Error message when status is `FAILURE` |
| `created_at` | `DateTime` | |
| `started_at` | `DateTime?` | |
| `completed_at` | `DateTime?` | |
| `input_data` | `Json?` | Contains `params.name` and `params.goals_weights` for custom runs — accessed via `jobRun.input_data?.params?.name`; note: `IJobRunInputData` does not currently have a typed `params` sub-object, so access goes through the `[key: string]: any` index signature. Consider adding `params?: { name?: string; goals_weights?: Record<string, number>; perspective?: string }` to `IJobRunInputData` in `src/types/JobRun.ts` as part of this feature (see T002). |
| `output_data` | `Json?` | Contains `mcda_results` when status is `SUCCESS` |

**No migration needed.** The existing schema already accommodates JSON blobs for `input_data`
and `output_data` via the `[key: string]: any` index signature on the TypeScript interfaces.

---

## Existing Enum: `JobStatus` (no change)

Defined in `src/types/JobRun.ts`:

```
PENDING  → job accepted, not yet started
STARTED  → job is running
SUCCESS  → job completed successfully; output_data contains results
FAILURE  → job failed; message field contains the reason
```

---

## New Type: `CustomAnalysisInput`

**File**: `src/types/JobRun.ts` (append to existing file)  
**Purpose**: Describes the validated, normalized payload produced by `CustomAnalysisForm`
before it is sent to the BFF.

| Field | Type | Validation Rules |
|-------|------|-----------------|
| `name` | `string` | Non-empty after `.trim()`; max 120 chars |
| `goals_weights` | `Record<string, number>` | All keys must match known goal labels; all values ≥ 0; at least one value > 0; sum normalizes to 1 |

**State transitions for `goals_weights`**:
1. User edits sliders → raw values (any non-negative float, sum may ≠ 1)
2. User clicks "Validate" in `GoalsSection` → `GoalsSection` normalizes, calls `onWeightsUpdate`
3. Parent (`CustomAnalysisForm`) stores normalized `MCDAGoal[]` in state
4. On submit → convert `MCDAGoal[]` to `Record<string, number>` and validate sum ≈ 1

---

## New Type: `CustomAnalysisJobRunRequest`

**File**: `src/types/JobRun.ts` (append to existing file)  
**Purpose**: Describes the JSON body accepted by `POST /api/v1/job-runs`.

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | User-provided analysis name |
| `goals_weights` | `Record<string, number>` | Map of goal label → normalized weight |

---

## New Type: `CustomAnalysisJobRunResponse`

**File**: `src/types/JobRun.ts` (append to existing file)  
**Purpose**: Describes the JSON body returned by `POST /api/v1/job-runs` on success.

| Field | Type | Notes |
|-------|------|-------|
| `job_id` | `string` | UUID of the newly created job run |

---

## External API Contract (read-only reference)

The external analysis API at `JOB_RUN_IMPACT_ASSESS_ROUTE` expects:

```
POST {JOB_RUN_IMPACT_ASSESS_ROUTE}
Content-Type: application/json

{
  "params": {
    "perspective": "user_personalized",
    "name": string,
    "goals_weights": {
      "Improve Accessibility": number,
      "Improve Mobility Service": number,
      "Improve Multimodality": number,
      "Noise Hinderance": number,      ← preserved spelling: matches external API exactly
      "Improve Public Transport": number,
      "Reduction of Congestion": number,
      "Reduction of Emission": number,
      "Improve Safety": number
    }
  }
}
```

> **Note — "Noise Hinderance"**: The correct English spelling is *"Hindrance"*, but the external
> API uses *"Hinderance"* (one 'n'). This spelling is intentionally preserved throughout all
> artifacts and in goal label strings to ensure exact key-matching with the external service.
> Do not "correct" this spelling in any code that maps goal labels to API keys.

And returns a JSON body containing at minimum `{ "job_id": string }`.  
This contract is owned by the external service and is documented here for reference only.
The BFF owns the translation layer between the internal representation and this format.

---

## Data Flow Diagram

```
User (browser)
  │
  │ 1. POST /api/v1/job-runs
  │    { name, goals_weights }
  ▼
BFF API Route  ←  validates input
  │
  │ 2. calls JobRunsService.triggerCustomAnalysis()
  │
  ▼
JobRunsService
  │
  │ 3. reads process.env.JOB_RUN_IMPACT_ASSESS_ROUTE
  │    POST { params: { perspective, name, goals_weights } }
  ▼
External Analysis API
  │
  │ 4. returns { job_id: string }
  ▼
JobRunsService → BFF Route → User (browser)
  │
  │ 5. window.location.href = /tools/mcda_analysis/results/:job_id
  ▼
Results Page (Astro SSR)
  │
  │ 6. JobRunsService.getJobRunById(id) → IJobRun | null
  ▼
PostgreSQL via Prisma
  │
  │ 7. returns IJobRun (status + output_data)
  ▼
Astro page branches on status:
  SUCCESS  → MCDAADashboardPage (results)
  FAILURE  → error state (static HTML)
  PENDING / STARTED → in-process state (React island with Refresh button)
  null → not-found state (static HTML)
```
