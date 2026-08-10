# Story T22 — MCDA Perspective Comparison

**Epic:** 12 — Methods, Glossary & MCDA Enhancement
**Size:** M
**Dependencies:** Epic 3 (T04 vocabulary — `displayCategoryName()` exists)
**Branch:** `feature/epic12-methods-mcda`

---

## User Story

> As a decision-maker, I can compare the MCDA rankings from all three stakeholder perspectives side by side, and see an explicit statement of convergence or divergence, so that I can understand whether the recommendation is robust or perspective-dependent.

---

## Acceptance Criteria

- [ ] AC-1: A comparison view exists at `/tools/mcda_analysis/{type}/compare` for both qualitative and quantitative analysis types
- [ ] AC-2: The comparison shows a ranking table with alternatives as rows and perspectives as columns
- [ ] AC-3: When rankings agree within the documented tolerance (default: 1 rank position), the comparison states convergence explicitly in words
- [ ] AC-4: When rankings disagree beyond tolerance, the divergent alternatives are highlighted with their rank spread
- [ ] AC-5: All three perspectives remain individually reachable from their existing routes
- [ ] AC-6: A "Compare perspectives" link is accessible from each individual perspective page

---

## Implementation Steps

### Step 1: Create `McdaComparisonView.tsx` component

File: `src/components/react/MCDAAnalysis/McdaComparisonView.tsx`

Create the comparison React component with:

**1a. Props interface:**
```typescript
interface PerspectiveData {
  key: string;
  label: string;
  results: McdaResults | null;
  goals: MCDAGoal[];
}

interface McdaComparisonViewProps {
  analysisType: string;
  perspectives: PerspectiveData[];
}
```

**1b. Convergence detection function** (`compareRankings`) — see architecture.md section 4c for the full implementation. Takes the perspectives array, computes rank differences per alternative, returns comparisons array, allConverge flag, and convergenceStatement string.

**1c. Ranking comparison table** — Render alternatives as rows, perspectives as columns. Each cell shows the rank position. Colour-code cells where the rank differs by more than `CONVERGENCE_TOLERANCE`:
- Agreeing cells: default text colour
- Diverging cells: `text-warning font-bold` with a warning icon

**1d. Convergence statement** — A prominent text block above or below the table:
- Green background when all converge
- Amber background when divergences exist

```tsx
<div className={`rounded-lg p-4 ${allConverge ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"} border`}>
  <p className={`text-sm font-medium ${allConverge ? "text-green-800" : "text-amber-800"}`}>
    {convergenceStatement}
  </p>
</div>
```

**1e. Goal weight comparison** — Reuse the `GoalWeightBar` component (from `src/components/react/MCDAAnalysis/GoalWeightBar.tsx`) to show side-by-side goal weights for each perspective.

**1f. Links to individual perspectives** — Each perspective column header is a link to `/{analysisType}/{perspectiveKey}`.

### Step 2: Create qualitative comparison page

File: `src/pages/tools/mcda_analysis/mcda_analysis_qualitative/compare.astro`

```astro
---
import Layout from "../../../../layouts/Layout.astro";
import { McdaComparisonView } from "../../../../components/react/MCDAAnalysis/McdaComparisonView";
import { MCDA_PERSPECTIVES } from "../../../../lib/helpers";
import ApiClient from "../../../../lib/api-client/ApiClient";

const api = new ApiClient(Astro.request);
const analysisType = "mcda_analysis_qualitative";

const perspectiveResults = await Promise.all(
  Object.keys(MCDA_PERSPECTIVES).map(async (key) => {
    const jobRun = await api.getMcdaJobRun(analysisType, key);
    return {
      key,
      label: MCDA_PERSPECTIVES[key],
      results: jobRun?.output ?? null,
      goals: jobRun?.goals ?? [],
    };
  })
);
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Tools" },
    { label: "Multi-criteria decision tool" },
    { label: "Compare perspectives" },
  ]}
  backHref="/tools/mcda_analysis/"
>
  <div class="mx-auto px-4 py-8">
    <McdaComparisonView
      analysisType={analysisType}
      perspectives={perspectiveResults}
      client:load
    />
  </div>
</Layout>
```

**Note:** The API call `api.getMcdaJobRun(analysisType, perspectiveKey)` may need to be adapted based on the actual API client method signature. Check `ApiClient` for the correct method to load a perspective's results.

### Step 3: Create quantitative comparison page

File: `src/pages/tools/mcda_analysis/mcda_analysis_quantitative/compare.astro`

Same structure as Step 2, but with `analysisType = "mcda_analysis_quantitative"`.

### Step 4: Add `comparisonUrl` prop to `MCDADashboard`

File: `src/components/react/MCDAAnalysis/MCDADashboard.tsx`

**4a.** Add to the props interface:
```typescript
comparisonUrl?: string;
```

**4b.** After the results section, render a link when `comparisonUrl` is provided:
```tsx
{comparisonUrl && (
  <div className="flex justify-center mt-6">
    <a href={comparisonUrl}
       className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
      Compare all perspectives →
    </a>
  </div>
)}
```

### Step 5: Wire comparison links in perspective pages

**5a.** File: `src/components/MCDAADashboardPage.astro` — Pass the `comparisonUrl` prop to `MCDADashboard`:
```astro
<MCDADashboard
  ...existingProps
  comparisonUrl={`/tools/mcda_analysis/${analysisType}/compare`}
  client:load
/>
```

**5b.** Verify that `analysisType` is available in the component's scope (it should be passed as a prop or derived from the URL).

### Step 6: Export `McdaComparisonView`

File: `src/components/react/MCDAAnalysis/index.ts`

Add:
```typescript
export { McdaComparisonView } from "./McdaComparisonView";
```

### Step 7: Write unit tests

File: `src/components/react/MCDAAnalysis/McdaComparisonView.test.tsx`

```typescript
import { describe, it, expect } from "vitest";
// Import compareRankings — may need to export it separately for testing

describe("compareRankings", () => {
  const mockPerspectives = [
    {
      key: "regulatory", label: "Regulatory",
      results: { ranking: ["a", "b", "c"], alternative_labels: { a: "Alpha", b: "Beta", c: "Gamma" } },
      goals: [],
    },
    {
      key: "pto", label: "PTO",
      results: { ranking: ["a", "c", "b"], alternative_labels: { a: "Alpha", b: "Beta", c: "Gamma" } },
      goals: [],
    },
    {
      key: "nsm", label: "NSM",
      results: { ranking: ["a", "b", "c"], alternative_labels: { a: "Alpha", b: "Beta", c: "Gamma" } },
      goals: [],
    },
  ];

  it("detects convergence when all ranks match within tolerance", () => {
    // Alpha is 1st everywhere — converges
    // Beta is 2nd in reg/nsm, 3rd in pto — spread 1 — converges
    // Gamma is 3rd in reg/nsm, 2nd in pto — spread 1 — converges
    // All converge within tolerance 1
  });

  it("detects divergence when spread exceeds tolerance", () => {
    // Modify a ranking so one alternative has spread > 1
  });

  it("produces convergence statement naming top alternative", () => {
    // When Alpha is 1st everywhere, statement should mention "Alpha"
  });

  it("handles empty ranking data", () => {
    // When a perspective has no results, handle gracefully
  });
});
```

### Step 8: Final verification

- [ ] Navigate to `/tools/mcda_analysis/mcda_analysis_qualitative/compare` — page loads with all 3 perspectives
- [ ] Navigate to `/tools/mcda_analysis/mcda_analysis_quantitative/compare` — page loads with all 3 perspectives
- [ ] Ranking comparison table shows correct ranks per perspective
- [ ] Convergence statement appears when ranks agree
- [ ] Divergence highlights appear when ranks disagree
- [ ] "Compare all perspectives" link appears on individual perspective pages
- [ ] Individual perspective pages continue to work unchanged
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`

---

## Out of Scope

- Modifying the MCDA calculation or model
- Comparison for personalized/custom analysis type
- User-configurable convergence tolerance (hardcoded default)
- D3 visualisation of comparison (table-based for now)
- Sensitivity analysis across perspectives

---

## PR Checklist

- [ ] Included in same PR as T21
- [ ] Comparison pages load for both analysis types
- [ ] Convergence statement appears when applicable
- [ ] All three perspectives remain individually reachable
- [ ] "Compare" link accessible from perspective pages
- [ ] Unit tests for convergence detection
- [ ] All tests pass
