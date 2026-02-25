---
description: "Task list for MCDA Custom Analysis feature implementation"
---

# Tasks: MCDA Custom Analysis

**Feature**: MCDA Custom Analysis
**Branch**: `001-mcda-custom-analysis`
**Input**: Design documents from `/specs/001-mcda-custom-analysis/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Tests are MANDATORY for all new behavior. Write tests FIRST, run to confirm they
FAIL, then implement. This feature adds three new dedicated test files (constitution requirement).

**TDD Sequence** (from plan.md): US3 → US2 → US1
- Round 1: BFF proxy endpoint (US3) — independently testable, no UI dependency
- Round 2: Job result status component + SSR results page (US2) — independently testable
- Round 3: Custom analysis form + dashboard integration (US1) — builds on US3 & US2

**Implementation ordering note**: Phases are ordered by the TDD sequence (US3 first, then US2,
then US1) despite US1 carrying the highest user-story priority (P1). This ordering ensures
each phase has its dependencies in place for real end-to-end integration, while every story
remains independently testable via mocks at any point.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — different files, or distinct test concerns a team can split
- **[Story]**: User story label mapping to spec.md priorities (US1 = P1, US2 = P2, US3 = P3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Environment Configuration)

**Purpose**: Ensure the required environment variable is documented before development begins.
No new packages are needed — this feature uses only existing dependencies.

- [x] T001 Add `JOB_RUN_IMPACT_ASSESS_ROUTE` to `.env.example` with a descriptive comment: `# URL of the external MCDA analysis service — required for POST /api/v1/job-runs (returns 500 if unset)`

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: TypeScript types shared by all three user stories MUST exist before any story
phase begins. These types are imported by the service, the API route, and the React components
across Phases 3–5.

**⚠️ CRITICAL**: No user story work can begin until T002 is complete.

- [x] T002 Add three TypeScript interfaces to `src/types/JobRun.ts` per data-model.md:
  - `CustomAnalysisInput`: `name: string` (non-empty, max 120 chars) and `goals_weights: Record<string, number>` (normalized to sum 1)
  - `CustomAnalysisJobRunRequest`: `name: string` and `goals_weights: Record<string, number>` (BFF request body shape)
  - `CustomAnalysisJobRunResponse`: `job_id: string` (BFF success response shape)
  - Also augment `IJobRunInputData` (same file) with an optional `params?: { name?: string; goals_weights?: Record<string, number>; perspective?: string }` field so that `jobRun.input_data.params.name` on the results page is type-safe rather than accessed via `[key: string]: any`

**Checkpoint**: Types defined — all three user story phases can now begin

---

## Phase 3: US3 — Submit Custom Analysis to Backend Proxy (P3) 🔌 TDD Round 1

**Goal**: `POST /api/v1/job-runs` accepts `{ name, goals_weights }`, validates input, proxies
the request to the external analysis API at `JOB_RUN_IMPACT_ASSESS_ROUTE` with the envelope
`{ params: { perspective: "user_personalized", name, goals_weights } }`, and returns
`{ job_id }` on success.

**Independent Test**: POST the endpoint with a valid payload (mocked external API via
`vi.stubGlobal('fetch', vi.fn())`) and assert: 200 + `{ job_id }` returned; the `fetch`
spy received `perspective: "user_personalized"`, the provided `name`, and the `goals_weights`
map. No UI or component rendering required.

### Tests for US3 (MANDATORY — write FIRST, run to confirm RED) ⚠️

> Write these before any implementation. Run `npm run test:run -- job-runs.post` and confirm
> ALL tests fail. Do not proceed to T007 until T006 confirms RED.

- [x] T003 [US3] Create `src/pages/api/v1/job-runs.post.test.ts` with two initial test groups:
  - Happy path: POST with valid `name` and valid `goals_weights` → 200 response with `{ job_id: "<uuid>" }` (contract scenario 1)
  - Forwarded payload shape: `fetch` spy verifies request body contains `params.perspective === "user_personalized"`, `params.name`, and `params.goals_weights` exactly as sent (contract scenario 10)
- [x] T004 [P] [US3] Add input validation tests to `src/pages/api/v1/job-runs.post.test.ts`: empty body → 400 `"Invalid JSON in request body"`; missing `name` field → 400 `"Analysis name is required"`; `name` is empty string after `.trim()` → 400 `"Analysis name is required"`; missing `goals_weights` → 400 `"goals_weights must be provided with at least one non-zero weight"`; `goals_weights` provided but all values are `0` → 400; `goals_weights` provided with a negative value → 400 (contract: "negative values are invalid") (contract scenarios 2–6)
- [x] T005 [P] [US3] Add upstream and configuration error tests to `src/pages/api/v1/job-runs.post.test.ts`: external API returns non-2xx status → 502 `"Analysis service is unavailable. Please try again later."`; `fetch` throws a network error → 502/503 with the same safe message; `JOB_RUN_IMPACT_ASSESS_ROUTE` env var is `undefined` → 500 `"Internal Server Error"` (internal details must not be exposed in body) (contract scenarios 7–9)
- [x] T006 [US3] Run `npm run test:run -- job-runs.post` and confirm all tests are **RED** — expected: all tests fail because no implementation exists; do not proceed until confirmed

### Implementation for US3

- [x] T007 [US3] Add `triggerCustomAnalysis(name: string, goalsWeights: Record<string, number>): Promise<{ job_id: string }>` to `src/bff/services/job-runs.service.ts`:
  1. Read `process.env.JOB_RUN_IMPACT_ASSESS_ROUTE`
  2. Throw a typed config error (logged server-side only) if the variable is `undefined`
  3. POST to the external API with body `{ params: { perspective: "user_personalized", name, goals_weights: goalsWeights } }`
  4. Throw a typed upstream error if `!res.ok`
  5. Parse the response body and return `{ job_id }`
- [x] T008 [US3] Add `export const POST: APIRoute` to `src/pages/api/v1/job-runs.ts`:
  1. Parse JSON body — catch `SyntaxError` → return 400 `"Invalid JSON in request body"`
  2. Validate `name` is non-empty after `.trim()` → 400 `"Analysis name is required"`
  3. Validate `goals_weights` is a non-null object with at least one value `> 0` and no negative values → 400 `"goals_weights must be provided with at least one non-zero weight"` (negative values are also invalid per contract)
  4. Call `JobRunsService.triggerCustomAnalysis(name, goals_weights)`
  5. Return 200 with `{ job_id }` wrapped in `ApiResponse` — note: `new ApiResponse({ data: { job_id } })` serializes the body as `{ "job_id": "..." }` directly (the `ApiResponse` constructor unwraps `.data` as the response body; see `src/types/ApiResponse.ts`)
  6. Catch config error → 500 `"Internal Server Error"` (no internal details in response body)
  7. Catch upstream error → 502 `"Analysis service is unavailable. Please try again later."`
- [x] T009 [US3] Run `npm run test:run -- job-runs.post` and confirm all tests are **GREEN**

**Checkpoint**: BFF proxy fully functional and test-verified — US3 independently deliverable

---

## Phase 4: US2 — View Custom Analysis Results (P2) 📄 TDD Round 2

**Goal**: A server-rendered Astro page at `/tools/mcda_analysis/results/[id]` reads job status
from PostgreSQL via `JobRunsService.getJobRunById()` and renders: the full MCDA dashboard for
`SUCCESS` jobs (with analysis name and completion date); an error message for `FAILURE` jobs;
an in-progress message with a "Refresh page" button for `PENDING`/`STARTED` jobs; and a
not-found state when `getJobRunById` returns `null`.

**Independent Test**: Render `<JobResultStatus status="FAILURE" />`,
`<JobResultStatus status="PENDING" />`, and `<JobResultStatus status="STARTED" />` with
`@testing-library/react` and assert the correct text is displayed and the Refresh button
triggers `window.location.reload()`. No API call or Astro page required.

### Tests for US2 (MANDATORY — write FIRST, run to confirm RED) ⚠️

> Write these before any implementation. Run `npm run test:run -- JobResultStatus` and confirm
> ALL tests fail. Do not proceed to T013 until T012 confirms RED.

- [x] T010 [US2] Create `src/components/react/MCDAAnalysis/JobResultStatus.test.tsx`: `status="FAILURE"` renders error heading and text instructing the user to contact the platform administrator; `status="PENDING"` renders "The job is currently in process. Please try again by refreshing the page."; `status="STARTED"` renders the same in-process message
- [x] T011 [P] [US2] Add interaction and detail tests to `src/components/react/MCDAAnalysis/JobResultStatus.test.tsx`: "Refresh page" button is visible when `status` is `"PENDING"` or `"STARTED"`; clicking "Refresh page" calls `window.location.reload()` (stub with `vi.stubGlobal`); optional `message` prop text is rendered within the `FAILURE` state; "Refresh page" button is NOT rendered when `status` is `"FAILURE"`
- [x] T012 [US2] Run `npm run test:run -- JobResultStatus` and confirm all tests are **RED**

### Implementation for US2

- [x] T013 [P] [US2] Create `src/components/react/MCDAAnalysis/JobResultStatus.tsx`: accept `status: 'PENDING' | 'STARTED' | 'FAILURE'` and `message?: string` props; render an error heading and "contact the platform administrator" paragraph for `FAILURE`; render the in-process message paragraph and a "Refresh page" `<button>` with `onClick={() => window.location.reload()}` for `PENDING` and `STARTED`; do not render a Refresh button for `FAILURE`; render `message` prop content when provided in `FAILURE` state
- [x] T014 [P] [US2] Create `src/pages/tools/mcda_analysis/results/[id].astro`: read `Astro.params.id`; redirect to `/tools/mcda_analysis` only if `id` is absent (empty/undefined); if `id` is present but fails a basic format check (e.g., not UUID-shaped), render a not-found state inline without crashing (per spec edge case); instantiate `JobRunsService` directly (no HTTP round-trip) and call `getJobRunById(id)` in a `try/catch`; when `jobRun === null` render a not-found message inline without crashing; branch on `JobStatus` enum — `SUCCESS`: render `MCDAADashboardPage` (read-only, no `enableCustomAnalysis`) with data from `jobRun.output_data` and `jobRun.input_data`, display `jobRun.input_data.params.name` and `jobRun.completed_at`; `FAILURE`: `<JobResultStatus status="FAILURE" message={jobRun.message} client:load />`; `PENDING`/`STARTED`: `<JobResultStatus status={jobRun.status} client:load />`
- [x] T015 [US2] Run `npm run test:run -- JobResultStatus` and confirm all tests are **GREEN**

**Checkpoint**: Results page and status component fully functional — US2 independently deliverable

---

## Phase 5: US1 — Compose and Launch a Custom Analysis (P1) 🎯 TDD Round 3 — Full MVP

**Goal**: Users on `/tools/mcda_analysis` can click a "Custom Analysis" toggle button in the
configuration panel, type an analysis name (with a permanently visible privacy hint), adjust
goal weight sliders (editable mode already supported by `GoalsSection`), and click submit. A
loading indicator appears immediately in the results panel; on success the browser navigates to
`/tools/mcda_analysis/results/<job-id>`. The `enableCustomAnalysis` prop defaults to `false`
so all existing behaviour is preserved when not set.

**Independent Test**: Render `<CustomAnalysisForm goals={mockGoals} />` with `@testing-library/react`;
assert the privacy hint is always visible; simulate name input; fire submit; assert loading
indicator appears, submit is disabled, and `window.location.href` resolves to the expected
results URL. No real API call — stub `fetch` via `vi.stubGlobal`.

### Tests for US1 (MANDATORY — write FIRST, run to confirm RED) ⚠️

> Write these before any implementation. Run `npm run test:run -- CustomAnalysisForm` and
> confirm ALL tests fail. Do not proceed to T020 until T019 confirms RED.

- [x] T016 [US1] Create `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx`: form renders without crashing given a `goals` prop; privacy hint `<p>` is present in the DOM on every render; a name `<input>` element is present; `GoalsSection` receives `editable={true}`; a submit button is present and labelled appropriately
- [x] T017 [P] [US1] Add interaction and happy path tests to `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx`: typing in the name input reflects in the controlled state; clicking submit calls `fetch` (stubbed) with `POST /api/v1/job-runs` and body `{ name, goals_weights }`; a loading indicator is visible while the fetch is pending; the submit button is disabled while `isLoading` is `true`; on a successful response `window.location.href` equals `/tools/mcda_analysis/results/<returned-job-id>`
- [x] T018 [P] [US1] Add edge-case and error tests to `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx`: submitting with an empty name is prevented and a validation message is shown; submitting when all goal weights are zero is prevented and a validation message is shown; when the API returns an error response, an `<InfoAlert variant="error">` is rendered with descriptive error text; clicking submit a second time while `isLoading` is `true` does not trigger a second `fetch` call (double-submission prevented)
- [x] T019 [US1] Run `npm run test:run -- CustomAnalysisForm` and confirm all tests are **RED**

### Implementation for US1

- [x] T020 [US1] Create `src/components/react/MCDAAnalysis/CustomAnalysisForm.tsx`:
  1. Accept `goals: MCDAGoal[]` and `onLoadingChange?: (loading: boolean) => void` props
  2. Render a controlled name `<input>` (max 120 chars)
  3. Render the privacy hint `<p>` as a permanent sibling below the input: "Your analysis name is not linked to any personal identity. Do not include names, emails, or other identifying information."
  4. Render `<GoalsSection goals={...} editable={true} onWeightsUpdate={setCurrentGoals} />`
  5. On submit: validate name non-empty after trim; validate at least one weight `> 0`; validate weights sum ≈ 1 (i.e., `GoalsSection.handleValidate` has been clicked — if not normalized, show an inline message prompting the user to click "Validate" first, or auto-normalize and display an inline notification per FR-005); show inline validation messages on any failure
  6. Set `isLoading=true` and call `onLoadingChange?.(true)` before the fetch
  7. POST `{ name: name.trim(), goals_weights }` (built from `MCDAGoal[]` using `goal.name` as key and `goal.weight` as value) to `/api/v1/job-runs`
  8. On success: set `window.location.href = /tools/mcda_analysis/results/${data.job_id}`
  9. On error: set `error` state and render `<InfoAlert variant="error">`
  10. Disable all inputs and the submit button while `isLoading` is `true`
- [x] T021 [US1] Modify `src/components/react/MCDAAnalysis/MCDADashboard.tsx`:
  1. Add optional `enableCustomAnalysis?: boolean` prop (default `false`)
  2. Add `isCustomMode: boolean` and `isSubmitting: boolean` `useState` hooks
  3. When `enableCustomAnalysis` is `true`, render a toggle button in the configuration panel header to switch between custom and standard modes
  4. In the goals `section`: render `<CustomAnalysisForm goals={goals} onLoadingChange={setIsSubmitting} />` when `isCustomMode` is `true`; otherwise render the existing `<GoalsSection goals={goals} editable={false} />`
  5. In the results panel: render an `animate-pulse` loading skeleton with an SVG spinner in place of `<ResultsSection>` when `isSubmitting` is `true`
  6. All behaviour when `enableCustomAnalysis` is `false` or omitted remains unchanged
- [x] T022 [P] [US1] Add named exports for `CustomAnalysisForm` and `JobResultStatus` to `src/components/react/MCDAAnalysis/index.ts`
- [x] T023 [P] [US1] Pass `enableCustomAnalysis={true}` to `<MCDADashboard>` in `src/pages/tools/mcda_analysis/index.astro`
- [x] T024 [US1] Run `npm run test:run -- CustomAnalysisForm` and confirm all tests are **GREEN**

**Checkpoint**: All three user stories are independently functional and test-verified — full feature deliverable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: TypeScript compliance, full test-suite validation, and manual verification against
the quickstart.md checklist before the feature branch is considered merge-ready.

- [x] T025 [P] Run `npx tsc --noEmit` and resolve any TypeScript strict mode violations in all new and modified files: `src/types/JobRun.ts`, `src/bff/services/job-runs.service.ts`, `src/pages/api/v1/job-runs.ts`, `src/pages/tools/mcda_analysis/results/[id].astro`, `src/components/react/MCDAAnalysis/CustomAnalysisForm.tsx`, `src/components/react/MCDAAnalysis/JobResultStatus.tsx`, `src/components/react/MCDAAnalysis/MCDADashboard.tsx`, `src/components/react/MCDAAnalysis/index.ts`, `src/pages/tools/mcda_analysis/index.astro`
- [x] T026 [P] Run `npm run test:run` and verify all three new test suites pass with zero failures: `src/pages/api/v1/job-runs.post.test.ts`, `src/components/react/MCDAAnalysis/JobResultStatus.test.tsx`, `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx`
- [ ] T027 Execute quickstart.md manual verification checklist:
  - Start the dev server: `npm run dev`
  - Open `http://localhost:4321/tools/mcda_analysis`
  - Click the "Custom Analysis" toggle — confirm the goals section becomes editable and the privacy hint is visible below the name input
  - Type an analysis name and adjust one or more weight sliders
  - Click submit — confirm the loading indicator appears within 300 ms and the submit button is disabled
  - Confirm the browser navigates to `http://localhost:4321/tools/mcda_analysis/results/<job-id>`
  - On the results page, verify correct state rendering for `SUCCESS` (full dashboard), `FAILURE` (error + admin contact message), and `PENDING`/`STARTED` (in-process message + Refresh button) jobs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS** all user story phases; T002 must complete before T003
- **US3 Phase (Phase 3)**: Depends on Phase 2 — can start as soon as T002 is done
- **US2 Phase (Phase 4)**: Depends on Phase 2 — can start as soon as T002 is done (parallel with US3 if team-staffed)
- **US1 Phase (Phase 5)**: Depends on Phase 2; benefits from US3 (real POST endpoint) and US2 (real results page) being complete — implement last per TDD sequence
- **Polish (Phase 6)**: Depends on all user story phases being complete (T009, T015, T024 all GREEN)

### User Story Dependencies

- **US3 (P3 — TDD Round 1)**: Independently testable via mocked `fetch`; no dependency on US1 or US2; start after Phase 2
- **US2 (P2 — TDD Round 2)**: Independently testable via mocked `JobRunsService`; no dependency on US1 or US3; start after Phase 2
- **US1 (P1 — TDD Round 3)**: Independently testable via mocked `fetch`; implement after US3 and US2 so real end-to-end integration works without additional wiring

### Within Each User Story (TDD Order)

1. Write ALL tests for the story (T_xx, T_xx+1, T_xx+2) — may split across team with [P] tasks
2. Run tests → verify **RED** (do not skip this gate)
3. Implement service/model layer
4. Implement component/route layer
5. Wire integration (exports, page props)
6. Run tests → verify **GREEN**
7. Proceed to next story

### Parallel Opportunities

**Phase 3 (US3) — Test Writing** (team-parallelizable; three developers, same file, merge after):

- T003 (happy path + payload shape) by Dev A
- T004 (validation error cases) by Dev B `[P]`
- T005 (upstream + config error cases) by Dev C `[P]`

**Phase 4 (US2) — Implementation** (truly parallel; different files, no edit conflict):

- T013 (`JobResultStatus.tsx`) by Dev A `[P]`
- T014 (`results/[id].astro`) by Dev B `[P]`

**Phase 5 (US1) — Test Writing** (team-parallelizable; three developers, same file, merge after):

- T016 (render + accessibility tests) by Dev A
- T017 (interaction + happy path tests) by Dev B `[P]`
- T018 (edge case + error tests) by Dev C `[P]`

**Phase 5 (US1) — Wiring** (truly parallel; different files; only after T020 and T021 complete):

- T022 (`index.ts` export barrel) by Dev A `[P]`
- T023 (`index.astro` prop) by Dev B `[P]`

**Phase 6 — Polish** (truly parallel; independent concerns):

- T025 (TypeScript check) and T026 (full test run) can execute simultaneously `[P]`

---

## Parallel Example: User Story 3 (BFF Proxy)

```bash
# After T002 completes, write US3 tests — split across team then merge:
Task T003: "Create job-runs.post.test.ts — happy path + payload shape (scenarios 1, 10)"
Task T004: "Add validation error tests to job-runs.post.test.ts (scenarios 2–6)"  # [P]
Task T005: "Add upstream/config error tests to job-runs.post.test.ts (scenarios 7–9)" # [P]

# After T006 confirms RED, implement in dependency order (service before route):
Task T007: "Add triggerCustomAnalysis() to src/bff/services/job-runs.service.ts"
Task T008: "Add POST handler to src/pages/api/v1/job-runs.ts"
```

---

## Parallel Example: User Story 2 (Results Page)

```bash
# After T012 confirms RED, implement component and page in parallel:
Task T013: "Create src/components/react/MCDAAnalysis/JobResultStatus.tsx"  # [P]
Task T014: "Create src/pages/tools/mcda_analysis/results/[id].astro"       # [P]
```

---

## Parallel Example: User Story 1 (Custom Analysis Form)

```bash
# After T019 confirms RED, implement form then dashboard modification:
Task T020: "Create src/components/react/MCDAAnalysis/CustomAnalysisForm.tsx"
Task T021: "Modify src/components/react/MCDAAnalysis/MCDADashboard.tsx"

# After T020 and T021 complete, wire exports and page prop in parallel:
Task T022: "Export new components in src/components/react/MCDAAnalysis/index.ts"   # [P]
Task T023: "Pass enableCustomAnalysis={true} in src/pages/tools/mcda_analysis/index.astro" # [P]
```

---

## Implementation Strategy

### MVP First (Full Feature via TDD Sequence)

Following the TDD sequence from plan.md (US3 → US2 → US1):

1. Complete Phase 1: Setup (T001 — env var documented)
2. Complete Phase 2: Foundational (**CRITICAL BLOCKER** — T002 types defined)
3. Complete Phase 3: US3 BFF proxy (T003–T009, tests GREEN) — API independently verifiable
4. Complete Phase 4: US2 Results page (T010–T015, tests GREEN) — results UX independently verifiable
5. Complete Phase 5: US1 Custom analysis form (T016–T024, tests GREEN) ← **Full MVP delivered**
6. Complete Phase 6: Polish (T025–T027 — TypeScript strict, all test suites green, manual checklist)

### Incremental Delivery

Each completed phase is independently deployable:

1. **T001–T002**: Foundation ready (env documented, types defined)
2. **T003–T009**: BFF proxy endpoint live — testable via `curl` or Postman without any UI change
3. **T010–T015**: Results page live — navigating to `/tools/mcda_analysis/results/<id>` works end-to-end
4. **T016–T024**: Custom analysis form live — full user journey: configure → submit → redirect → view results ← **Full MVP**
5. **T025–T027**: Production-ready — TypeScript strict passes, all 3 test suites green, manual QA done

---

## Notes

- `[P]` on test tasks (T004, T005, T011, T017, T018) indicates team-parallelizable test concerns;
  a single developer writes them sequentially in the same file
- `[P]` on implementation tasks (T013, T014, T022, T023, T025, T026) indicates truly independent
  files with no edit conflicts
- **RED gate tasks** (T006, T012, T019) are mandatory checkpoints — no implementation begins
  for a story until its RED confirmation passes
- **GREEN gate tasks** (T009, T015, T024) are mandatory checkpoints — a story is not considered
  complete until its GREEN confirmation passes
- `vi.stubGlobal('fetch', vi.fn())` is required in `beforeEach` for both `job-runs.post.test.ts`
  and `CustomAnalysisForm.test.tsx`; see quickstart.md for the common pitfall
- `JOB_RUN_IMPACT_ASSESS_ROUTE` must be set in `.env` for manual testing (T027); if missing,
  `POST /api/v1/job-runs` returns 500 and logs the misconfiguration server-side only
- `MCDADashboard.tsx` change is backward-compatible: `enableCustomAnalysis` defaults to `false`,
  preserving all existing perspective-based behaviour on the unchanged dashboard pages
- Constitution compliance checklist for PR review: new test file per feature ✓ (three new files),
  TDD Red→Green→Refactor ✓, Vitest + `@testing-library/react` ✓, Astro SSR / React island
  boundary ✓ (results page in Astro; form + status in React islands), Prisma + PostgreSQL only ✓
  (`JobRunsService.getJobRunById` for all DB reads; external call is a proxy), TypeScript strict ✓
