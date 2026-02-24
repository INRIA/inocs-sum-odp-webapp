# Research: MCDA Custom Analysis

**Feature Branch**: `001-mcda-custom-analysis`  
**Phase**: 0 — Outline & Research  
**Date**: 2026-02-24  
**Status**: Complete — all NEEDS CLARIFICATION items resolved

---

## Decision 1: URL for the Job Results Page

**Decision**: `/tools/mcda_analysis/results/:id`  
(file: `src/pages/tools/mcda_analysis/results/[id].astro`)

**Rationale**: The spec originally targeted `/tools/mcda_analysis/:id`, but that would place
`[id].astro` and the existing `[perspective].astro` in the same directory at the same dynamic
depth. Astro resolves the ambiguity alphabetically, meaning `[id]` would shadow
`[perspective]`, making all perspective pages unreachable. Adding a `results/` segment
eliminates the conflict with zero changes to the existing routes and is the minimal-change
approach.

**Alternatives considered**:
- Rename `[perspective].astro` to a static set of named routes (one file per perspective) —
  rejected because it requires duplicating six Astro files.
- Add a discriminating prefix to the perspective URL (e.g., `/tools/mcda_analysis/p/:perspective`) —
  rejected because it is a breaking URL change that requires redirects.

---

## Decision 2: Component Architecture — New `CustomAnalysisForm`

**Decision**: Create a new self-contained React component
`src/components/react/MCDAAnalysis/CustomAnalysisForm.tsx`. `MCDADashboard` gains one optional
prop (`enableCustomAnalysis?: boolean`) and one internal state (`isCustomMode`). When the mode
is active, `CustomAnalysisForm` replaces `GoalsSection` in the configuration panel. Everything
else in `MCDADashboard` is untouched.

**Rationale**: Keeps the open/closed principle. `GoalsSection` already supports `editable={true}`
and an `onWeightsUpdate` callback with full normalization logic — no changes needed there.
`MCDADashboard`'s results area already renders an empty-state box when `mcdaResults` is
undefined; the same slot is used for the loading indicator during submission.

**Alternatives considered**:
- Modify `MCDADashboard` extensively to embed the form logic inline — rejected because it
  mixes submission concerns with display orchestration and makes the component harder to test.
- Build a new top-level `CustomAnalysisDashboard.tsx` that duplicates the two-panel layout —
  rejected as unnecessary duplication; the existing layout is reused via the toggle mechanism.

---

## Decision 3: BFF Proxy — Service Method vs. Route-Level Fetch

**Decision**: Add a new method `triggerCustomAnalysis(name, goalsWeights)` to the existing
`JobRunsService` class. The method reads `process.env.JOB_RUN_IMPACT_ASSESS_ROUTE`, performs
a `fetch()` call to the external API, and throws a typed error on upstream failure.

**Rationale**: All existing external API calls (e.g., `auth.service.ts`) live in service
classes and use `process.env` directly (not `import.meta.env`), which is the correct runtime
access pattern for Node.js SSR code. Centralising the external call in the service keeps the
API route thin and consistent with the rest of the codebase; it also makes the external call
independently testable by spying on `fetch`.

**Alternatives considered**:
- Calling `fetch()` directly inside the POST API route — rejected because it bypasses the
  established service-layer pattern and mixes transport logic with HTTP routing.
- A generic `ExternalApiService` wrapper — rejected as over-engineering; the project has no
  other generic HTTP client and adding one would not be justified for a single external endpoint.

---

## Decision 4: POST Handler Location

**Decision**: Add `export const POST: APIRoute` to the existing file
`src/pages/api/v1/job-runs.ts` (same file as the current GET handler).

**Rationale**: The existing `src/pages/api/v1/labs/index.ts` co-locates GET and POST in the
same file — this is the established pattern. There is no need for a separate file.

**Alternatives considered**:
- A new file `src/pages/api/v1/custom-job-runs.ts` — rejected because the resource semantics
  are identical (a job run) and splitting would fragment the API contract.

---

## Decision 5: Results Page Data Access

**Decision**: Instantiate `JobRunsService` directly in the Astro frontmatter of the results
page. Do not go through `ApiClient` or an internal HTTP round-trip.

**Rationale**: The existing `src/pages/tools/resources/[id].astro` uses `ApiClient`, but
`ApiClient` only wraps the internal BFF endpoints over HTTP, adding an unnecessary network
hop. Instantiating the service directly is what the `MCDAADashboardPage.astro` component
also does for job data fetching. Direct instantiation is faster and simpler for an SSR page.

**Alternatives considered**:
- Using `ApiClient.getJobRunById` — rejected because `ApiClient` adds an internal HTTP call
  on the same server, which is a round-trip with no benefit.

---

## Decision 6: Loading State During Submission

**Decision**: Manage loading state inside `CustomAnalysisForm` using a local `isLoading`
boolean. While loading, the results area of `MCDADashboard` shows an inline `animate-pulse`
skeleton plus an SVG spinner. The `GoalsSection` sliders and the Submit button are both
disabled during loading.

**Rationale**: There is no shared `<Spinner>` component in the codebase. The established
pattern (seen in `LoginForm.tsx`, `LivingLabKpiResultForm.tsx`) is to manage `isLoading`
locally and apply Tailwind's `animate-pulse` / `opacity-50 cursor-not-allowed` classes. Adding
a dedicated spinner component is out of scope for this feature.

**Alternatives considered**:
- Introducing a new `<Spinner>` component — deferred; it would be a valid refactor but is
  separate from this feature's scope.

---

## Decision 7: `JobStatus` Enum vs. Raw Strings

**Decision**: Import and use the `JobStatus` enum from `src/types/JobRun.ts` in all new code
that branches on job status. The four values are: `PENDING`, `STARTED`, `SUCCESS`, `FAILURE`.

**Rationale**: The enum already exists in the types file (confirmed in research). Using it
prevents typos in status comparisons and satisfies the TypeScript strict-mode constraint.
The two "in-process" statuses (`PENDING` and `STARTED`) are treated identically in the UI
(show the "job in process" message with the Refresh button).

---

## Decision 8: Privacy Hint Implementation

**Decision**: Implement the privacy hint as a visible `<p>` tag with `text-gray-500 text-sm`
styling, rendered as a sibling element directly below the analysis name `<input>` field inside
`CustomAnalysisForm`. The hint text: *"Your analysis name is not linked to any personal
identity. Do not include names, emails, or other identifying information."*

**Rationale**: The hint must be visible at all times (SC-006, FR-003). Making it a tooltip
would hide it by default and fail the success criterion.

---

## Decision 9: Request Payload Mapping

**Decision**: The `CustomAnalysisForm` sends the following body to `POST /api/v1/job-runs`:

```json
{
  "name": "<user-provided analysis name>",
  "goals_weights": {
    "Improve Accessibility": 0.118,
    "Improve Mobility Service": 0.164,
    "Improve Multimodality": 0.132,
    "Noise Hinderance": 0.064,
    "Improve Public Transport": 0.119,
    "Reduction of Congestion": 0.146,
    "Reduction of Emission": 0.145,
    "Improve Safety": 0.112
  }
}
```

The BFF wraps this in the format expected by the external API:

```json
{
  "params": {
    "perspective": "user_personalized",
    "name": "<user-provided analysis name>",
    "goals_weights": { ... }
  }
}
```

The `goals_weights` map is built from `MCDAGoal[]` by using `goal.name` as the key and
`goal.weight` as the value. `MCDAGoal.name` values in the existing data match the eight labels
the external API expects.

**Alternatives considered**:
- Sending `MCDAGoal[]` array directly and transforming in the BFF — chosen over sending the
  map from the client to keep the frontend representation consistent with the existing
  `GoalsSection` data structure.

---

## Open Questions (None — all resolved)

All items that were initially unknown are resolved above. No NEEDS CLARIFICATION remains.
