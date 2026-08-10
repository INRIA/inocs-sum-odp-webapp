# Story T16 — Plan for My City (Guided Decision Tool)

**Epic:** 10 — Guided Decision Tool
**Size:** L
**Dependencies:** T04, T05, T10 (Epics 3, 4, 6)
**Branch:** `feature/epic10-guided-mcda`

---

## User Story

> As a city planner who has never used a multi-criteria decision tool, I answer three plain-language questions about my city and get a ranked shortlist of mobility measures with explanations — without encountering PROMETHEE terminology or an empty score matrix — so I can identify which measures best fit my city's priorities.

---

## Acceptance Criteria

- [ ] AC-1: A visitor reaches a ranked shortlist without encountering an empty matrix or untranslated PROMETHEE term
- [ ] AC-2: A worked example is visible before any input is required
- [ ] AC-3: Three questions (city context, priority, constraints) produce the shortlist
- [ ] AC-4: "Open in expert mode" preserves the full configuration entered in the guided flow
- [ ] AC-5: Guided results and expert results for the same inputs agree
- [ ] AC-6: The `/insights/plan` route is registered as `"insights"` in the experience registry

---

## Implementation Steps

### Step 1: Create GuidedMCDAWizard component

File: `src/components/react/Insights/GuidedMCDAWizard.tsx`

Multi-step wizard with five states: `example → context → priority → constraints → results`.

**Example step:** Show a pre-filled scenario with its result shortlist. Two actions: "Start with this example" or "Start fresh".

**Context step:** Radio cards for city type (small, mid-sized, large, suburban, university city). Each maps to a baseline goal weight profile.

**Priority step:** MCDA goals displayed as simplified 3-level sliders (Less important / Important / Most important). No PROMETHEE terms — use plain labels.

**Constraints step:** Toggleable chips for each alternative (mobility measure). User deselects inapplicable measures. All included by default.

See architecture.md section 3b for data model.

### Step 2: Create GuidedMCDAResults component

File: `src/components/react/Insights/GuidedMCDAResults.tsx`

Renders the ranked shortlist (top 5-7 measures) with:
- Rank number, measure name, plain-language reason
- Strengths and weaknesses summary (from positive/negative flow, relabelled per T04)
- "Open in expert mode" link with configuration encoded in URL

See architecture.md section 3c.

### Step 3: Implement MCDA payload construction

In `GuidedMCDAWizard.tsx`, build the `CustomMCDAPayload` from the wizard selections:
- Map priority levels to numeric weights
- Map selected alternatives to the payload format
- Submit via `ApiClient.triggerFullCustomMCDA()` (same endpoint as expert tool)
- Poll for results via `ApiClient.getJobRun()`

See architecture.md section 3d.

### Step 4: Implement expert hand-off

Build the expert URL with encoded configuration:
```typescript
const expertUrl = `${expertBaseUrl}?goals=...&alternatives=...&source=guided`;
```

See architecture.md section 3e.

### Step 5: Modify expert personalized page for hand-off

File: `src/pages/tools/mcda_analysis/user_personalized/index.astro`

Read `source`, `goals`, and `alternatives` from URL search params. When `source=guided`, pass parsed configuration as `initialGoals` and `initialAlternatives` props to `CustomAnalysisForm`.

### Step 6: Create the guided tool page

File: `src/pages/insights/plan.astro`

Fetch MCDA goals and alternatives via `ApiClient`, pass to `GuidedMCDAWizard` as props. See architecture.md section 3a.

### Step 7: Register route

File: `src/lib/experiences/registry.ts`

```typescript
{ pattern: "/insights/plan", experience: "insights" },
```

### Step 8: Write tests

```typescript
// src/components/react/Insights/GuidedMCDAWizard.test.tsx
describe("GuidedMCDAWizard", () => {
  it("shows worked example on initial render", () => { ... });
  it("advances through context → priority → constraints → results", () => { ... });
  it("builds valid CustomMCDAPayload from selections", () => { ... });
  it("constructs expert URL with encoded goals and alternatives", () => { ... });
  it("contains no PROMETHEE vocabulary in rendered text", () => { ... });
});
```

```typescript
// Add to src/lib/experiences/registry.test.ts
it("resolves /insights/plan to insights experience", () => {
  const state = resolveExperience("/insights/plan", new URLSearchParams());
  expect(state.active).toBe("insights");
});
```

### Step 9: Final verification

- [ ] Navigate to `/insights/plan` — worked example is visible
- [ ] Complete all three steps — shortlist renders with rankings
- [ ] Search all UI text for "PROMETHEE", "net flow", "score matrix" — none found
- [ ] Click "Open in expert mode" — expert page opens with pre-filled form
- [ ] Submit same inputs in expert mode — rankings match guided results
- [ ] Start fresh — no blank form or empty matrix at any step
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`

---

## Out of Scope

- Modifying existing MCDA routes (rule G3)
- New MCDA computation models or algorithms
- User account integration or saved analyses
- GAIA plane visualization in guided mode
- Backend changes to job-runs endpoint

---

## PR Checklist

- [ ] Guided flow produces a shortlist in three steps
- [ ] No PROMETHEE vocabulary anywhere in the guided path
- [ ] Worked example visible before any input
- [ ] Expert hand-off preserves full configuration
- [ ] Same inputs → same results in both modes
- [ ] Route registered in experience registry
- [ ] All tests pass
