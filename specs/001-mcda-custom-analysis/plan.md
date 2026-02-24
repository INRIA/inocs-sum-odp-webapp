# Implementation Plan: MCDA Custom Analysis

**Branch**: `001-mcda-custom-analysis` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-mcda-custom-analysis/spec.md`

---

## Summary

Enable users of the MCDA decision tool at `/tools/mcda_analysis` to run a custom analysis by
editing goal weights and providing an analysis name. The submission is proxied by the BFF to an
external analysis API (`JOB_RUN_IMPACT_ASSESS_ROUTE`). After a successful submission the user is
redirected to a new SSR page `/tools/mcda_analysis/results/:id` that reads the job status from
PostgreSQL via Prisma and renders the full MCDA results dashboard for completed jobs, or a
status message for jobs still in progress or failed.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict mode via `astro/tsconfigs/strict`)  
**Primary Dependencies**: Astro 5 (`@astrojs/node` SSR adapter), React 19, Prisma 6, Tailwind CSS 4, Vitest 4  
**Storage**: PostgreSQL via Prisma — `job_runs` table (existing schema, no migration needed)  
**Testing**: Vitest 4 + `@testing-library/react` 16 + `@testing-library/user-event` 14, `happy-dom` environment  
**Target Platform**: Node.js server (SSR, no static output)  
**Project Type**: Web application — Astro SSR with React islands  
**Performance Goals**: Loading indicator within 300ms of submit; results page SSR at request time  
**Constraints**: No new DB tables; no polling; anonymous platform (no auth on results page)  
**Scale/Scope**: One new React component, one new Astro page, one new API method, one modified API route

---

## Constitution Check

*Re-checked after Phase 1 design — all gates pass.*

- [x] Tests-first plan exists for all new behavior (Red → Green → Refactor documented in TDD Sequence below).
- [x] A new test file per new feature is listed as acceptance criteria (three new test files).
- [x] Test scope includes happy path, user interactions, displayed information, and edge cases.
- [x] Astro SSR responsibilities are separated from React island interactivity: results page
  orchestration in Astro, submission form and loading state in a React island.
- [x] Data layer uses Prisma + PostgreSQL only — `JobRunsService` wraps all DB reads; the
  external API call is a proxy (not a second database) and follows the established BFF pattern.
- [x] TypeScript strict mode remains enabled; no new `any` types in feature code.
- [x] Test implementation uses Vitest + `@testing-library/react`.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-mcda-custom-analysis/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0 output (all decisions documented)
├── data-model.md        ← Phase 1 output (types, data flow)
├── quickstart.md        ← Phase 1 output (developer onboarding)
├── contracts/
│   └── post-job-runs.md ← POST /api/v1/job-runs contract
├── checklists/
│   └── requirements.md  ← spec quality gate (all pass)
└── tasks.md             ← Phase 2 output (created by /speckit.tasks — NOT this command)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── JobRun.ts                            [MODIFY] Add CustomAnalysisInput,
│                                                      CustomAnalysisJobRunRequest,
│                                                      CustomAnalysisJobRunResponse types
│
├── bff/
│   └── services/
│       └── job-runs.service.ts              [MODIFY] Add triggerCustomAnalysis() method
│
├── pages/
│   ├── api/
│   │   └── v1/
│   │       ├── job-runs.ts                  [MODIFY] Add POST handler
│   │       └── job-runs.post.test.ts        [NEW]    POST handler tests ← write FIRST
│   └── tools/
│       └── mcda_analysis/
│           ├── index.astro                  [MODIFY] Pass enableCustomAnalysis={true}
│           └── results/
│               └── [id].astro               [NEW]    Job results SSR page
│
└── components/
    └── react/
        └── MCDAAnalysis/
            ├── CustomAnalysisForm.tsx        [NEW]    React island: name input,
            │                                          editable weights, submit, loading
            ├── CustomAnalysisForm.test.tsx   [NEW]    Component tests ← write FIRST
            ├── JobResultStatus.tsx           [NEW]    React island: failure / in-process
            │                                          / not-found display + Refresh btn
            ├── JobResultStatus.test.tsx      [NEW]    Status component tests ← write FIRST
            ├── MCDADashboard.tsx             [MODIFY] Add enableCustomAnalysis? prop,
            │                                          isCustomMode state, toggle button,
            │                                          loading skeleton in results panel
            └── index.ts                     [MODIFY] Export CustomAnalysisForm,
                                                       JobResultStatus
```

**No files are deleted. No existing behavior changes when `enableCustomAnalysis` is omitted
(defaults to `false`).**

**Structure Decision**: Single Astro web application. Backend code in `src/bff/`, API routes
in `src/pages/api/v1/`, React islands in `src/components/react/MCDAAnalysis/`. Matches the
existing project layout exactly. The results page lives in a `results/` sub-directory to avoid
a route conflict with the existing `[perspective].astro` at the same dynamic depth (see
`research.md` Decision 1).

---

## Component Design

### `CustomAnalysisForm.tsx`

Self-contained React island managing:
- Analysis name input (controlled, with privacy hint always visible below the input)
- `GoalsSection` with `editable={true}` and `onWeightsUpdate` to capture normalized weights
- Validation: name non-empty, at least one weight > 0
- `POST /api/v1/job-runs` fetch call on submit
- `isLoading` state: disables all inputs + button, shows spinner inside button text
- `error` state: renders `<InfoAlert variant="error">` below the form
- On success: `window.location.href = /tools/mcda_analysis/results/${job_id}`
- Calls `onLoadingChange` prop to let `MCDADashboard` render loading skeleton in results panel

**Props**:
```typescript
interface CustomAnalysisFormProps {
  goals: MCDAGoal[];
  onLoadingChange?: (loading: boolean) => void;
}
```

### `JobResultStatus.tsx`

Lightweight React island for the results page non-success states:
- `FAILURE`: error heading + "contact the platform administrator" message + optional job message
- `PENDING` / `STARTED`: "The job is currently in process. Please try again by refreshing the
  page." + "Refresh page" button (`onClick: () => window.location.reload()`)

**Props**:
```typescript
interface JobResultStatusProps {
  status: 'PENDING' | 'STARTED' | 'FAILURE';
  message?: string;
}
```

### `MCDADashboard.tsx` — minimal changes

```typescript
// New optional prop (preserves all existing behaviour when not passed)
enableCustomAnalysis?: boolean;  // default: false

// New internal state
const [isCustomMode, setIsCustomMode] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

In `configurationContent`, `section id="goals"`:
- `enableCustomAnalysis && isCustomMode` → render `<CustomAnalysisForm goals={goals} onLoadingChange={setIsSubmitting} />`
- otherwise → existing `<GoalsSection goals={goals} editable={false} />`
- Toggle button rendered only when `enableCustomAnalysis === true`

In results section: when `isSubmitting` is `true`, render loading skeleton in place of `<ResultsSection>`.

### `src/pages/tools/mcda_analysis/results/[id].astro` — SSR logic

```
1. Read Astro.params.id
2. If !id → redirect /tools/mcda_analysis
3. Instantiate JobRunsService; call getJobRunById(id) wrapped in try/catch → redirect on error
4. If jobRun === null → render not-found state inline (no redirect)
5. Branch on jobRun.status using JobStatus enum:
   SUCCESS  → MCDAADashboardPage (read-only: no enableCustomAnalysis)
              with data extracted from jobRun.output_data and jobRun.input_data
   FAILURE  → <JobResultStatus status="FAILURE" message={jobRun.message} client:load />
   PENDING / STARTED → <JobResultStatus status={jobRun.status} client:load />
```

---

## `POST /api/v1/job-runs` Handler Logic

```
1. Parse JSON body → 400 "Invalid JSON in request body" on failure
2. Validate name (non-empty after trim) → 400 "Analysis name is required"
3. Validate goals_weights (non-null object, at least one value > 0)
   → 400 "goals_weights must be provided with at least one non-zero weight"
4. Call JobRunsService.triggerCustomAnalysis(name, goals_weights)
   ├─ Read process.env.JOB_RUN_IMPACT_ASSESS_ROUTE
   ├─ If undefined → throw configuration error (logged server-side)
   ├─ fetch(route, POST, { params: { perspective: "user_personalized", name, goals_weights } })
   ├─ If !res.ok → throw upstream error
   └─ Return { job_id } from parsed response
5. Return 200: new ApiResponse({ data: { job_id } })
6. Catch:
   - Config error → 500
   - Upstream error → 502 "Analysis service is unavailable. Please try again later."
```

---

## TDD Sequence (tests written FIRST)

**Round 1 — BFF Proxy (US3)**
1. Write `src/pages/api/v1/job-runs.post.test.ts` (10 scenarios in contract doc)
2. `npm run test:run -- job-runs.post` → all RED
3. Add `triggerCustomAnalysis` to `JobRunsService`
4. Add `POST` export to `job-runs.ts`
5. Tests GREEN

**Round 2 — Status Component (US2)**
1. Write `src/components/react/MCDAAnalysis/JobResultStatus.test.tsx`
2. Tests RED
3. Implement `JobResultStatus.tsx` + `results/[id].astro`
4. Tests GREEN

**Round 3 — Custom Analysis Form (US1)**
1. Write `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx`
2. Tests RED
3. Implement `CustomAnalysisForm.tsx`
4. Modify `MCDADashboard.tsx` and `index.astro`
5. Tests GREEN

---

## Test Coverage Requirements

| Category | Files | What must be covered |
|----------|-------|---------------------|
| Happy path | `job-runs.post.test.ts`, `CustomAnalysisForm.test.tsx` | Successful submission → 200 + `job_id`; form navigates to results URL |
| User interactions | `CustomAnalysisForm.test.tsx`, `JobResultStatus.test.tsx` | Name input change; GoalsSection receives `editable={true}`; Submit button click; Refresh button click |
| Information displayed | `CustomAnalysisForm.test.tsx`, `JobResultStatus.test.tsx` | Privacy hint visible; loading indicator visible; error alert text; FAILURE message; in-process message |
| Edge cases | `job-runs.post.test.ts`, `CustomAnalysisForm.test.tsx` | Empty name; all-zero weights; API error; env var missing; double submission prevented |

---

## Complexity Tracking

No constitution violations. No justifications needed.

---

## Post-Design Constitution Re-Check

| Gate | Status | Notes |
|------|--------|-------|
| Tests-first | ✅ PASS | TDD sequence documented with explicit RED-first rounds |
| New test file per feature | ✅ PASS | Three new files: `.post.test.ts`, `CustomAnalysisForm.test.tsx`, `JobResultStatus.test.tsx` |
| Coverage scope | ✅ PASS | All four categories in coverage requirements table |
| Astro SSR / React island boundary | ✅ PASS | Results page in Astro; form + status in React islands |
| Prisma + PostgreSQL only | ✅ PASS | `JobRunsService.getJobRunById` for DB reads; external call is a proxy |
| TypeScript strict | ✅ PASS | All new interfaces defined; no `any` in contracts |
| Vitest + @testing-library/react | ✅ PASS | All tests use this stack |
