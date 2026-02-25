# Feature Specification: MCDA Custom Analysis

**Feature Branch**: `001-mcda-custom-analysis`  
**Created**: 2026-02-24  
**Status**: Planning Complete  
**Input**: User description: "Introduce custom analysis for the MCDA decision tool. Enables editable weights mode, user-named analysis submissions, proxied job-run creation, loading UX, and a dedicated results page per job ID."

## User Scenarios & Testing *(mandatory)*

**Constitution-mandated test requirements for every feature:**
- Tests MUST be authored before implementation code (TDD/SDD).
- At least one new dedicated test file MUST be added per new feature.
- Test design MUST cover happy path, user interactions, information displayed, and edge cases.
- Component/API behavior tests MUST use Vitest + `@testing-library/react`.

### User Story 1 - Compose and Launch a Custom Analysis (Priority: P1)

A user visiting `/tools/mcda_analysis` wants to run their own analysis with adjusted priority
weights rather than relying on a fixed stakeholder perspective. They switch to the "Custom
Analysis" mode, type a short name to identify the purpose of their run (with a visible hint
reminding them not to enter personal information since the platform is anonymous), and then
adjust the weight sliders for each goal in the weights section (which is already built but
currently locked). When they are satisfied with the configuration, they submit the analysis.

The application immediately shows a loading indicator inside the results section while the job
is being registered, and as soon as a job identifier is returned the user is automatically taken
to the dedicated results page for that job.

**Why this priority**: This is the entry point of the entire feature. Without it, no custom
results page can be reached. It delivers visible user value — the ability to run a personalised
analysis — as a standalone deliverable.

**Independent Test**: Can be fully tested by rendering the custom analysis form, editing weights,
filling in a name, submitting, and asserting that the loading state is displayed and the redirect
is triggered with the returned job ID. The results page is not required.

**Acceptance Scenarios**:

1. **Given** the user is on `/tools/mcda_analysis`, **When** they activate the "Custom Analysis"
   mode, **Then** the goal weights section becomes editable and a name input with a privacy hint
   is displayed.
2. **Given** the custom analysis form is visible, **When** the user types a name and adjusts
   one or more weight sliders, **Then** the total weight display reflects the changes in real time.
3. **Given** the form is complete with a name and at least one weight value, **When** the user
   submits the analysis, **Then** a loading indicator replaces the results area while the request
   is in progress.
4. **Given** the submission succeeds and a job ID is returned, **When** the response is received,
   **Then** the user is navigated to `/tools/mcda_analysis/results/<job-id>`.
5. **Given** the goal weights do not sum to 1, **When** the user submits, **Then** the weights
   are automatically normalized before submission and the user is informed of the normalization.
6. **Given** the user clears the analysis name field completely, **When** they attempt to submit,
   **Then** submission is prevented and a validation message is shown.

---

### User Story 2 - View Custom Analysis Results (Priority: P2)

After being redirected to `/tools/mcda_analysis/results/<job-id>`, the user sees the results of their
custom run rendered through the same dashboard used by pre-defined perspectives. The page is
server-rendered and checks the job status before deciding what to display.

**Why this priority**: This closes the user journey started in US1. Results are the primary
value delivered — without them the submission step has no payoff.

**Independent Test**: Can be fully tested by rendering the results page with a mock job in
`SUCCESS` status and asserting that the MCDA dashboard is shown with the correct data.

**Acceptance Scenarios**:

1. **Given** the job identified by the URL parameter is in `SUCCESS` status, **When** the page
   loads, **Then** the full MCDA results dashboard is displayed using the job's output data,
   showing rankings, insights, and the outranking graph.
2. **Given** the job is in `SUCCESS` status, **When** the page loads, **Then** the page displays
   the user-provided analysis name and the date the job was completed.
3. **Given** the job is in `FAILURE` status, **When** the page loads, **Then** an error message
   is shown explaining that the analysis could not be completed, along with a clear instruction
   to contact the platform administrator for assistance.
4. **Given** the job is in any status other than `SUCCESS` or `FAILURE` (i.e. still running),
   **When** the page loads, **Then** a message reading "The job is currently in process. Please
   try again by refreshing the page" is displayed along with a "Refresh page" button that reloads
   the page.
5. **Given** no job with the requested ID exists, **When** the page loads, **Then** a not-found
   message is shown and no dashboard component is rendered.

---

### User Story 3 - Submit Custom Analysis to the Backend Proxy (Priority: P3)

The frontend's POST to the BFF `/api/v1/job-runs` endpoint must correctly proxy the request to
the external analysis API, mapping the user's name and normalized goals weights into the format
expected by that API. The external API base URL is configured through an environment variable
(`JOB_RUN_IMPACT_ASSESS_ROUTE`), keeping credentials and endpoints out of client code.

**Why this priority**: This is the integration boundary between the frontend and the external
analysis service. It is independently deployable and testable via the API route in isolation,
without requiring UI changes.

**Independent Test**: Can be fully tested by calling `POST /api/v1/job-runs` with a valid
payload and asserting the correct forwarded request shape and returned job ID, using a mocked
external API endpoint.

**Acceptance Scenarios**:

1. **Given** a valid POST request to `/api/v1/job-runs` with a name and goals weights map,
   **When** the endpoint is called, **Then** it forwards a request to the external API at
   `JOB_RUN_IMPACT_ASSESS_ROUTE` with `perspective: "user_personalized"`, the provided name,
   and the goals weights mapped by goal label.
2. **Given** the external API responds with a job ID, **When** the BFF receives the response,
   **Then** it returns the job ID to the caller in a consistent response envelope.
3. **Given** the external API is unavailable or returns an error, **When** the BFF handles the
   response, **Then** it returns a 502 or 503 error to the caller with a message that does not
   expose internal infrastructure details.
4. **Given** the `JOB_RUN_IMPACT_ASSESS_ROUTE` environment variable is not set, **When** the
   BFF endpoint is invoked, **Then** it returns a 500 error and logs the misconfiguration
   server-side, without exposing it to the client.

---

### Edge Cases

- What happens when the user submits the form while the previous submission is still loading?
  Submission MUST be disabled until the first request resolves.
- What happens when the weight for all goals is set to zero? The system must detect this,
  prevent submission, and inform the user that at least one goal must have a non-zero weight.
- What happens when the job ID in the URL is not a valid format or contains unexpected characters?
  The page MUST render a not-found state (matching FR-016 — no dashboard, no crash) rather than
  throwing an unhandled error. A missing `id` segment (e.g., direct navigation with no trailing
  path) may redirect to `/tools/mcda_analysis` instead.
- What happens when the user navigates directly to `/tools/mcda_analysis/results/<job-id>` for a job
  belonging to a different user? Since the platform is fully anonymous, all job results are
  accessible by URL (public by design). No authentication check is required.
- What happens when the analysis name contains characters that could be displayed in the
  dashboard? The name must be safely rendered without any risk of injected markup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to activate a "Custom Analysis" mode on the `/tools/mcda_analysis` page that enables editing of the goal weights section.
- **FR-002**: The custom analysis mode MUST display a text input for the user to name their analysis.
- **FR-003**: The name input MUST display a hint informing users that no personal information should be entered, as all analyses are anonymous.
- **FR-004**: Users MUST be able to adjust the weight of each goal independently using the already-existing weight editing interface (currently controlled by the `editable` prop on `GoalsSection`).
- **FR-005**: The system MUST normalize goal weights to sum to 1 before submitting, and MUST inform the user if normalization was applied. *(Normalization is performed by `GoalsSection.handleValidate` when the user clicks "Validate". `CustomAnalysisForm` MUST additionally guard at submit time: if weights are not yet normalized — because the user never clicked Validate — the form MUST block submission and prompt the user to click "Validate" first, or auto-normalize and inform the user inline.)*
- **FR-006**: Submission MUST be prevented if the analysis name is empty or if all goal weights are zero.
- **FR-007**: On submission, the results section MUST display a loading indicator while the job creation request is in progress.
- **FR-008**: The submission MUST be disabled and the user MUST NOT be able to trigger a second job while one is already pending.
- **FR-009**: The BFF endpoint `POST /api/v1/job-runs` MUST accept a custom analysis payload and forward it to the external analysis API configured at `JOB_RUN_IMPACT_ASSESS_ROUTE`.
- **FR-010**: The forwarded request MUST use `perspective: "user_personalized"`, the user-provided name, and the normalized goals weights keyed by goal label.
- **FR-011**: Upon a successful response, the system MUST navigate the user to `/tools/mcda_analysis/results/<job-id>`.
- **FR-012**: The page `/tools/mcda_analysis/results/<job-id>` MUST be server-rendered and MUST retrieve the job status and data by job ID at request time.
- **FR-013**: If the job status is `SUCCESS`, the page MUST render the full MCDA results dashboard (reusing `MCDAADashboardPage.astro`) with the job's output data, the analysis name, and the completion date.
- **FR-014**: If the job status is `FAILURE`, the page MUST display an error message and instructions to contact the platform administrator.
- **FR-015**: If the job is in any other status, the page MUST display a status message and a "Refresh page" button that reloads the current URL.
- **FR-016**: If no job is found for the given ID, the page MUST display a not-found state without crashing.
- **FR-TEST-001**: Feature MUST include at least one new test file as acceptance criteria.
- **FR-TEST-002**: Feature tests MUST be created before implementation and initially fail.
- **FR-ARCH-001**: Feature MUST preserve Astro SSR and React islands separation of concerns: the results page orchestration happens in Astro; submission, loading state, and weight editing happen in a React island.
- **FR-DATA-001**: Job status retrieval on the results page MUST use the existing `JobRunsService` (Prisma-backed). The external API call is a proxy, not direct data access.
- **FR-TS-001**: Feature MUST satisfy TypeScript strict-mode constraints without weakening config.

### Key Entities

- **CustomAnalysisInput**: Represents the parameters of a user-initiated analysis. Contains: user-provided name (free text, non-empty), goals weights (map of goal label to numeric weight, normalized to sum 1), fixed perspective identifier (`user_personalized`).
- **JobRun** (existing): Represents a job registered in the platform. Key attributes: unique ID, status (`SUCCESS`, `FAILURE`, or in-progress variants), input parameters, output data (MCDA results when complete), and creation timestamp.

## Assumptions

- The external analysis API at `JOB_RUN_IMPACT_ASSESS_ROUTE` is already deployed and reachable by the BFF server. Its availability is outside the scope of this feature.
- Job status polling is out of scope: the results page is a static SSR render at request time. Refresh is manual.
- All analyses are anonymous and public by URL: no user identity is attached to a custom run and no access control is required for the results page.
- The eight goal labels expected by the external API (`Improve Accessibility`, `Improve Mobility Service`, `Improve Multimodality`, `Noise Hinderance`, `Improve Public Transport`, `Reduction of Congestion`, `Reduction of Emission`, `Improve Safety`) match exactly the goal names stored in existing job run data and displayed in `GoalsSection`.
- The existing `GoalsSection` component's `editable` prop and weight-update callback are sufficient to support the editing interaction without structural changes to that component.
- The `JobRunsService.getJobRunById` method (already implemented) is sufficient to retrieve job status on the results page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from loading `/tools/mcda_analysis` to submitting a custom analysis with an adjusted weight in under 3 minutes.
- **SC-002**: The loading indicator is visible within 300ms of the user pressing the submit button, even on a slow connection.
- **SC-003**: The results page correctly reflects the three job states (success, failure, in-process) in 100% of tested scenarios.
- **SC-004**: All test cases for the new feature pass, covering happy path, user interactions, displayed information, and edge cases, before any implementation code is merged.
- **SC-005**: The BFF proxy endpoint correctly maps 100% of the user payload fields to the external API format with no field omission or mis-mapping, as verified by unit tests.
- **SC-006**: No personal information is solicited, stored, or displayed: the name hint is visible on the form in 100% of renders.
