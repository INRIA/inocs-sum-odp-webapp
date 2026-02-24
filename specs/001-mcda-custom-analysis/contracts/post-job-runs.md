# API Contract: POST /api/v1/job-runs

**Resource**: Job Runs  
**Operation**: Create a custom MCDA analysis job run  
**File**: `src/pages/api/v1/job-runs.ts` (POST handler added to existing file)  
**Feature Branch**: `001-mcda-custom-analysis`

---

## Endpoint

```
POST /api/v1/job-runs
Content-Type: application/json
```

---

## Authentication

None required. The platform is anonymous; no session or token is expected.

---

## Request Body

```json
{
  "name": "string (required, non-empty, max 120 chars)",
  "goals_weights": {
    "Improve Accessibility": "number (required, ≥ 0)",
    "Improve Mobility Service": "number (required, ≥ 0)",
    "Improve Multimodality": "number (required, ≥ 0)",
    "Noise Hinderance": "number (required, ≥ 0)",
    "Improve Public Transport": "number (required, ≥ 0)",
    "Reduction of Congestion": "number (required, ≥ 0)",
    "Reduction of Emission": "number (required, ≥ 0)",
    "Improve Safety": "number (required, ≥ 0)"
  }
}
```

**Constraints**:
- `name` must be a non-empty string after trimming whitespace.
- `goals_weights` must be a non-null object with at least one value > 0.
- All weight values must be ≥ 0 (negative values are invalid).
- The weights are expected to already sum to approximately 1 (normalization is the client's
  responsibility via `GoalsSection.handleValidate`). The BFF forwards them as-is.

**Example**:

```json
{
  "name": "Urban mobility priorities — Geneva pilot",
  "goals_weights": {
    "Improve Accessibility": 0.118204003,
    "Improve Mobility Service": 0.164257155,
    "Improve Multimodality": 0.131881625,
    "Noise Hinderance": 0.063675546,
    "Improve Public Transport": 0.119422265,
    "Reduction of Congestion": 0.145589093,
    "Reduction of Emission": 0.144952956,
    "Improve Safety": 0.112017357
  }
}
```

---

## Success Response — `200 OK`

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | `string` (UUID) | ID of the newly created job run |

---

## Error Responses

| HTTP Status | Condition | Response Body |
|-------------|-----------|---------------|
| `400 Bad Request` | Body is not valid JSON | `{ "error": "Invalid JSON in request body" }` |
| `400 Bad Request` | `name` is missing or empty | `{ "error": "Analysis name is required" }` |
| `400 Bad Request` | `goals_weights` is missing or all zero | `{ "error": "goals_weights must be provided with at least one non-zero weight" }` |
| `500 Internal Server Error` | `JOB_RUN_IMPACT_ASSESS_ROUTE` env var not set | `{ "error": "Internal Server Error" }` (details logged server-side only) |
| `502 Bad Gateway` | External analysis API returned an error | `{ "error": "Analysis service is unavailable. Please try again later." }` |
| `503 Service Unavailable` | External analysis API could not be reached | `{ "error": "Analysis service is unavailable. Please try again later." }` |

---

## Behavior

1. BFF validates `name` and `goals_weights` — returns `400` if invalid.
2. BFF calls `JobRunsService.triggerCustomAnalysis(name, goals_weights)`.
3. Service forwards to external API with envelope:
   ```json
   { "params": { "perspective": "user_personalized", "name": "...", "goals_weights": {...} } }
   ```
4. On external API success, service returns `{ job_id }`.
5. BFF returns `200` with `{ job_id }`.
6. Client navigates to `/tools/mcda_analysis/results/:job_id`.

---

## Test Contract

These scenarios MUST be covered by tests in `src/pages/api/v1/job-runs.post.test.ts`:

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Valid name + valid weights | `200` with `{ job_id }` |
| 2 | Empty body | `400` |
| 3 | Missing `name` | `400` |
| 4 | Empty `name` after trim | `400` |
| 5 | Missing `goals_weights` | `400` |
| 6 | All weights are zero | `400` |
| 7 | External API returns 500 | `502` |
| 8 | External API unreachable (fetch throws) | `502` or `503` |
| 9 | `JOB_RUN_IMPACT_ASSESS_ROUTE` not set | `500` |
| 10 | Correct forwarded payload shape (perspective, name, goals_weights) | verified via spy |
