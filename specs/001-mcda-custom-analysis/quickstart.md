# Quickstart: MCDA Custom Analysis

**Feature Branch**: `001-mcda-custom-analysis`  
**Audience**: Developer picking up this feature for the first time

---

## Prerequisites

- Node.js ≥ 18  
- A running PostgreSQL instance with the app schema applied  
- A `.env` file at the repository root (copy from `.env.example` if it exists)  
- The external analysis API must be reachable (or mocked — see "Running Tests" below)

---

## 1. Add the Required Environment Variable

Add the following to your `.env` file:

```env
# URL of the external MCDA analysis service (required for POST /api/v1/job-runs)
JOB_RUN_IMPACT_ASSESS_ROUTE=https://<your-analysis-api-host>/run
```

> **Never commit this value.** It must stay in `.env` (which is git-ignored).  
> If the variable is not set, the `POST /api/v1/job-runs` endpoint will return `500` and log
> a configuration error server-side.

---

## 2. Install Dependencies

```sh
npm install
```

No new packages are needed — this feature uses only existing dependencies.

---

## 3. Start the Development Server

```sh
npm run dev
```

The app is available at `http://localhost:4321`.

---

## 4. Exercise the Feature Manually

### Step 1 — Navigate to the MCDA tool

Open `http://localhost:4321/tools/mcda_analysis` in your browser.

### Step 2 — Activate Custom Analysis mode

Click the **"Custom Analysis"** button in the left configuration panel.  
The goals section should become editable (sliders unlocked) and a name input should appear
below it with a privacy hint.

### Step 3 — Configure and submit

1. Type a short name (e.g., `My test run`) in the analysis name field.
2. Drag one or more weight sliders.
3. Click **Validate** to normalize the weights to sum to 1.
4. Click **Run Custom Analysis**.

The results area (right panel) should show a loading indicator immediately.  
After the response is received, the browser navigates to
`http://localhost:4321/tools/mcda_analysis/results/<job-id>`.

### Step 4 — View results

On the results page:
- If the job is `SUCCESS`: the full MCDA dashboard is displayed.
- If the job is `PENDING` or `STARTED`: a "job in process" message and a **Refresh page**
  button are shown. Click Refresh to re-check.
- If the job is `FAILURE`: an error message and admin contact instructions are displayed.

---

## 5. Run Tests

Tests must pass before implementation is considered complete. Write them first.

```sh
# Run all tests once
npm run test:run

# Run tests in watch mode (during development)
npm test

# Run with coverage report
npm run test:coverage
```

### New test files for this feature

| File | What it covers |
|------|---------------|
| `src/pages/api/v1/job-runs.post.test.ts` | POST handler: happy path, validation errors, proxy errors, env var missing |
| `src/components/react/MCDAAnalysis/CustomAnalysisForm.test.tsx` | Form render, name input, weight editing, loading state, redirect, error display, privacy hint presence |
| `src/components/react/MCDAAnalysis/JobResultStatus.test.tsx` | SUCCESS state display, FAILURE state display, in-process state display, Refresh button, not-found state |

### Running a specific test file

```sh
npx vitest run src/pages/api/v1/job-runs.post.test.ts
```

---

## 6. Verify Constitution Compliance Before Merging

- [ ] All three new test files exist and pass.
- [ ] Tests were written before implementation (TDD — verify via commit history).
- [ ] Coverage includes happy path, user interactions, displayed information, and edge cases.
- [ ] `src/pages/tools/mcda_analysis/results/[id].astro` handles data fetching server-side only.
- [ ] `CustomAnalysisForm.tsx` is a React island (no Astro-specific code inside it).
- [ ] `POST /api/v1/job-runs` uses `JobRunsService` (Prisma-backed) for status reads; the proxy
  call to the external API is via `process.env.JOB_RUN_IMPACT_ASSESS_ROUTE`.
- [ ] No raw SQL anywhere in new code.
- [ ] TypeScript strict mode: `npx tsc --noEmit` must exit 0 on the new files.

---

## 7. Common Issues

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| `POST /api/v1/job-runs` returns 500 | `JOB_RUN_IMPACT_ASSESS_ROUTE` not set | Add to `.env` |
| `POST /api/v1/job-runs` returns 502 | External API unreachable | Check the URL and network access |
| Results page shows "not found" for a known job ID | Job was registered in a different DB or the UUID is malformed | Check DB connection and job ID format |
| Test fails with `fetch is not defined` | `vi.stubGlobal('fetch', vi.fn())` missing in test | Add the stub in `beforeEach` |
| TypeScript error on `process.env.JOB_RUN_IMPACT_ASSESS_ROUTE` | String | undefined handling | Add a guard: `if (!route) throw new Error(...)` |
