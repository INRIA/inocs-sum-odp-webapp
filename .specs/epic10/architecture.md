# Architecture — Epic 10: Guided Decision Tool

**Tasks:** T16 (L)
**Wave:** C | **Effort:** L | **Stack:** Astro 5 SSR + React 19 islands
**Dependencies:** After Epics 3, 4, 6 (T04 vocabulary, T05 evidence badges, T10 experience mechanism)

---

## 1. Summary

Epic 10 adds a guided entry to the MCDA tool for the Insights experience at `/insights/plan`. Three questions (city context, priority, constraints) produce a ranked shortlist with plain-language reasons. "Open in expert mode" carries the same configuration into the existing expert tool in the Data experience. Existing MCDA routes are **untouched** (rule G3).

No PROMETHEE vocabulary in the guided path. A worked example is shown before any empty input. Guided results and expert results for the same inputs agree.

---

## 2. Design Decisions with Rationale

### 2.1 Guided flow is a React island — multi-step form state requires client-side interactivity

Unlike the static content pages, the guided tool is an interactive multi-step form. The Astro page provides the shell and initial data; a React island (`GuidedMCDAWizard`) manages the step-by-step question flow, validation, result display, and expert hand-off.

### 2.2 Three questions are answered from existing MCDA data structures

The existing MCDA tool uses `MCDAGoal` objects with weights, `CustomMCDAAlternative` objects, and a `CustomMCDAPayload` for analysis submission. The guided questions map to these structures:

1. **City context** → selects a baseline perspective (determines default weights similar to existing perspectives: Regulatory Authorities, PTO, NSM Providers)
2. **Priority** → adjusts goal weights (same `MCDAGoal[]` used by the expert tool)
3. **Constraints** → filters alternatives (same alternatives list used by the expert tool)

The architect must investigate the exact mapping between guided questions and the MCDA data structures during implementation (noted as an open question in the epic spec).

### 2.3 Guided results use the same MCDA engine — results agree by construction

The guided flow submits the same `CustomMCDAPayload` to the same `/api/v1/job-runs` endpoint used by the personalized MCDA tool (`/tools/mcda_analysis/user_personalized/`). This guarantees that guided and expert results for identical inputs agree — they use the same PROMETHEE II computation.

### 2.4 Expert hand-off encodes configuration in URL parameters

When the user clicks "Open in expert mode", the guided configuration (goal weights, selected alternatives, constraints) is encoded as URL query parameters and the user is navigated to the existing personalized MCDA page. The expert page reads these parameters and pre-fills its form.

```typescript
const expertUrl = `/tools/mcda_analysis/user_personalized/?` + new URLSearchParams({
  goals: JSON.stringify(selectedGoals),
  alternatives: JSON.stringify(selectedAlternatives),
  source: "guided",
}).toString();
```

### 2.5 Worked example pre-fills the form with a realistic scenario

Before any user input, the wizard shows a pre-filled example (e.g. "A mid-sized European city prioritizing public transport integration") with its resulting shortlist. The user can modify the example or start fresh. This ensures a visitor never faces a blank form.

### 2.6 No PROMETHEE vocabulary in the guided path

All MCDA terms are replaced with plain language (per T04):
- "Net flow" → "Overall score"
- "Positive/negative flow" → "Strengths/weaknesses"
- "Score matrix" → "Your ratings"
- "Alternatives" → "Mobility measures"
- "Criteria" → "What matters to you"
- "PROMETHEE" → not mentioned at all

### 2.7 Route belongs to the Insights experience

```typescript
{ pattern: "/insights/plan", experience: "insights" },
```

---

## 3. T16 Architecture — Guided Decision Tool

### 3a. New file: `src/pages/insights/plan.astro`

```astro
---
import Layout from "../../layouts/Layout.astro";
import { GuidedMCDAWizard } from "../../components/react/Insights/GuidedMCDAWizard";
import ApiClient from "../../lib/api-client/ApiClient";
import { getUrl } from "../../lib/helpers";

const api = new ApiClient(Astro.request);

// Fetch available MCDA goals and alternatives for the wizard
const mcdaGoals = await api.getMcdaGoals();
const mcdaAlternatives = await api.getMcdaAlternatives();

// Pre-computed worked example
const workedExample = {
  context: "mid-sized-city",
  goals: mcdaGoals.map(g => ({
    ...g,
    weight: g.defaultWeight ?? 1,
  })),
  alternatives: mcdaAlternatives.slice(0, 8),
};
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Insights", href: "/insights" },
    { label: "Plan for my city" },
  ]}
  backHref="/insights"
>
  <section class="py-12 px-4">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-3">
        Plan for my city
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Answer three questions about your city to get a ranked shortlist
        of mobility measures tailored to your priorities.
      </p>
    </div>
  </section>

  <GuidedMCDAWizard
    goals={mcdaGoals}
    alternatives={mcdaAlternatives}
    workedExample={workedExample}
    expertBaseUrl={getUrl("/tools/mcda_analysis/user_personalized/")}
    client:load
  />
</Layout>
```

### 3b. GuidedMCDAWizard component

`src/components/react/Insights/GuidedMCDAWizard.tsx`

A multi-step wizard with four states: Example → Questions (3 steps) → Results.

```typescript
interface GuidedMCDAWizardProps {
  goals: MCDAGoal[];
  alternatives: McdaAlternative[];
  workedExample: WorkedExample;
  expertBaseUrl: string;
}

type WizardStep = "example" | "context" | "priority" | "constraints" | "results";
```

**Step 0 — Worked example:**
Shows a realistic pre-filled scenario with its shortlist result. Two buttons: "Start with this example" (modifies the example) or "Start fresh" (clears and begins at step 1).

**Step 1 — City context:**
"What kind of city do you have?"
- Options: Small/mid-sized/large city, suburban area, university city
- Each option maps to a baseline weight profile for the MCDA goals
- Presented as radio cards, not a dropdown

**Step 2 — Priority:**
"What matters most to you?"
- Shows the MCDA goals as slider controls (simplified — 3 levels: Less important / Important / Most important)
- The slider values map to goal weights in the `MCDAGoal` structure
- No PROMETHEE terminology — labels say "Environmental impact", "Cost efficiency", etc.

**Step 3 — Constraints:**
"Are there measures you want to exclude?"
- Shows available alternatives as toggleable chips
- User can deselect measures that don't apply to their context
- Default: all included

**Results:**
- Submits the configuration as a `CustomMCDAPayload` to `/api/v1/job-runs`
- Displays a ranked shortlist (top 5-7 measures)
- Each result card shows: rank, measure name, plain-language reason, strength/weakness summary
- "Open in expert mode" button with configuration encoded in URL

### 3c. Results display component

`src/components/react/Insights/GuidedMCDAResults.tsx`

```typescript
interface GuidedResult {
  rank: number;
  alternativeName: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  plainReason: string;
}

interface GuidedMCDAResultsProps {
  results: GuidedResult[];
  expertUrl: string;
}

export function GuidedMCDAResults({ results, expertUrl }: GuidedMCDAResultsProps) {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Your shortlist
      </h2>
      <p className="text-gray-600 mb-6">
        Based on your priorities, these measures rank highest.
      </p>

      <div className="space-y-4 mb-8">
        {results.map(r => (
          <div key={r.rank} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl font-bold text-primary">#{r.rank}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{r.alternativeName}</h3>
                <p className="text-sm text-gray-600 mt-1">{r.plainReason}</p>
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="text-green-600">
                    Strengths: {r.strengths.join(", ")}
                  </span>
                  <span className="text-amber-600">
                    Weaknesses: {r.weaknesses.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-500 mb-3">
          Want to adjust weights, add criteria, or explore the full analysis?
        </p>
        <a href={expertUrl}
           className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
          Open in expert mode →
        </a>
      </div>
    </div>
  );
}
```

### 3d. MCDA payload construction

The guided wizard builds the same `CustomMCDAPayload` used by the expert personalized tool:

```typescript
function buildMcdaPayload(
  selectedGoals: MCDAGoal[],
  selectedAlternatives: McdaAlternative[],
  analysisType: string
): CustomMCDAPayload {
  return {
    job_name: `mcda_${analysisType}_custom`,
    goals: selectedGoals.map(g => ({
      id: g.id,
      label: g.label,
      weight: g.weight,
      direction: g.direction,
    })),
    alternatives: selectedAlternatives.map(a => ({
      key: a.key,
      label: a.label,
      scores: a.scores,
    })),
  };
}
```

This is submitted to `/api/v1/job-runs` via `ApiClient.triggerFullCustomMCDA()` — the same endpoint used by the expert tool. The result is polled via `ApiClient.getJobRun(jobId)`.

### 3e. Expert hand-off URL

```typescript
function buildExpertUrl(
  expertBaseUrl: string,
  goals: MCDAGoal[],
  alternatives: McdaAlternative[]
): string {
  const params = new URLSearchParams();
  params.set("goals", JSON.stringify(goals.map(g => ({ id: g.id, weight: g.weight }))));
  params.set("alternatives", JSON.stringify(alternatives.map(a => a.key)));
  params.set("source", "guided");
  return `${expertBaseUrl}?${params.toString()}`;
}
```

The expert personalized MCDA page (`/tools/mcda_analysis/user_personalized/index.astro`) must read these query parameters and pre-fill the `CustomAnalysisForm` when `source=guided` is present.

### 3f. Expert page modification for guided hand-off

`src/pages/tools/mcda_analysis/user_personalized/index.astro`

Read `source`, `goals`, and `alternatives` from `Astro.url.searchParams`. If `source === "guided"`, pass the pre-parsed configuration as `initialGoals` and `initialAlternatives` props to the `CustomAnalysisForm` component.

---

## 4. File Change Summary

| File | Status | Task | What changes |
|---|---|---|---|
| `src/pages/insights/plan.astro` | **New** | T16 | Guided decision tool page |
| `src/components/react/Insights/GuidedMCDAWizard.tsx` | **New** | T16 | Multi-step wizard component |
| `src/components/react/Insights/GuidedMCDAResults.tsx` | **New** | T16 | Results shortlist component |
| `src/components/react/Insights/index.ts` | **Modify** | T16 | Add new component exports |
| `src/lib/experiences/registry.ts` | **Modify** | T16 | Add `/insights/plan` route entry as `"insights"` |
| `src/pages/tools/mcda_analysis/user_personalized/index.astro` | **Modify** | T16 | Read guided hand-off parameters, pre-fill form |
| `src/lib/experiences/registry.test.ts` | **Modify** | T16 | Add test for `/insights/plan` route resolution |

Total: **3 new files**, **4 modified files**. One PR for T16.

---

## 5. Implementation Order

1. **Create `GuidedMCDAWizard`** — implement the four-step wizard (example, context, priority, constraints)
2. **Create `GuidedMCDAResults`** — results shortlist with plain-language reasons
3. **Create `src/pages/insights/plan.astro`** — page shell, fetch goals/alternatives, pass to wizard
4. **Implement MCDA payload construction and submission** — reuse `ApiClient.triggerFullCustomMCDA()`
5. **Implement expert hand-off URL** — encode configuration in query parameters
6. **Modify expert personalized page** — read hand-off parameters, pre-fill form
7. **Register route** in experience registry
8. **Add tests** — wizard step transitions, payload construction, expert URL encoding
9. **Verify** — walk through the guided flow, verify shortlist, click "open in expert mode", confirm configuration preserved and results match

**Verification checkpoint:** A visitor reaches a shortlist in three steps without encountering PROMETHEE vocabulary or a blank form. Expert hand-off preserves the configuration. Same inputs produce same results in both guided and expert modes.

---

## 6. Testing Strategy

### Manual verification (per PR checklist in epic.md)

| Check | How |
|---|---|
| Worked example shown before input | Navigate to `/insights/plan` — example is visible |
| No PROMETHEE/technical terms | Read all UI text for vocabulary violations |
| Three questions produce a shortlist | Complete the wizard — shortlist renders |
| Expert hand-off preserves configuration | Click "Open in expert mode" — verify pre-filled form |
| Guided and expert results agree | Submit same inputs in both — compare rankings |
| No empty matrix or blank form | Start fresh — each step has default selections or instructions |

### Unit tests

```typescript
// src/components/react/Insights/GuidedMCDAWizard.test.tsx
describe("GuidedMCDAWizard", () => {
  it("shows worked example as first step", () => { ... });
  it("progresses through three question steps", () => { ... });
  it("builds valid MCDA payload from selections", () => { ... });
  it("constructs expert hand-off URL with encoded configuration", () => { ... });
  it("uses no PROMETHEE terminology in any UI text", () => { ... });
});

describe("buildMcdaPayload", () => {
  it("produces payload compatible with triggerFullCustomMCDA", () => { ... });
  it("maps priority levels to numeric weights", () => { ... });
});
```

```typescript
// Add to src/lib/experiences/registry.test.ts
it("resolves /insights/plan to insights experience", () => {
  const state = resolveExperience("/insights/plan", new URLSearchParams());
  expect(state.active).toBe("insights");
});
```

---

## 7. Open Questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| OQ-1 | What are the exact three guided questions and their answer options? The epic spec says they are "defined in the analysis data" — architect must investigate the MCDA data structure. | WP5/T5.2 | T16 question flow |
| OQ-2 | How do city context options map to baseline goal weight profiles? Each context option needs a predefined weight set. | WP5/T5.2 | T16 step 1 |
| OQ-3 | Should the worked example use real MCDA results or a static pre-computed result? Real results require an API call on page load. | Product | T16 worked example |
| OQ-4 | What analysis type should the guided tool use — qualitative or quantitative? Or should the user choose? | WP5/T5.2 | T16 payload construction |
| OQ-5 | Should the expert personalized page show a banner "Pre-filled from guided tool" when `source=guided`? | UX | T16 expert hand-off |

---

## 8. Out of Scope

- **Modifying existing MCDA routes** — all existing pages untouched (rule G3)
- **New MCDA computation model** — uses the same PROMETHEE II engine
- **MCDA perspective pages** — those are expert-only, handled by Epic 12
- **User accounts or saved analyses** — guided flow is anonymous, stateless
- **Backend changes** — uses existing `/api/v1/job-runs` endpoint

---

## 9. Downstream Impact

| Consumer | What it uses | When |
|---|---|---|
| Epic 8 (Insights Goals) | Goal pages may link to "Plan for my city" | Cross-epic navigation |
| Epic 9 (Insights Cities) | City profiles may link to the guided tool | Cross-epic navigation |
| Expert MCDA page | Reads guided hand-off parameters | T16 hand-off |
