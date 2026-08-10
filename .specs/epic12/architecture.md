# Architecture — Epic 12: Methods, Glossary & MCDA Enhancement

**Tasks:** T21 (L), T22 (M) — can run in parallel
**Wave:** D | **Effort:** L + M | **Stack:** Astro 5 SSR + React 19 islands
**Dependencies:** After Epics 2, 3, 4, 6 (T21 needs T02–T05, T10; T22 needs T04 only)

---

## 1. Summary

Epic 12 adds a Methods & Quality section (six new content pages) and enhances the MCDA tool with a perspective comparison view.

**T21 — Methods & quality section.** Six new Astro pages under `/methods/` that extract and consolidate methodological content currently scattered across existing pages. Source pages link to the method pages rather than repeating content. Includes a glossary page built from the `GLOSSARY` record in `src/lib/labels.ts`, FAQ promotion into the main navigation, and a data quality & curation page.

**T22 — MCDA perspective comparison.** Adds a comparison view to the MCDA tool that surfaces where the three stakeholder perspectives (Regulatory Authorities, Public Transport Operators, NSM Providers) disagree on rankings. When rankings agree within a documented tolerance, the comparison states convergence explicitly in words. All three perspectives remain individually reachable.

---

## 2. Design Decisions with Rationale

### 2.1 Methods pages are Astro pages, not database-backed

The six method pages contain explanatory prose, diagrams, and structured descriptions of the platform's methodology. This content:
- Changes at the pace of project deliverables, not user interactions
- Is authored by WP1/WP5, not computed
- Requires no API calls or dynamic data
- Fits the Astro SSR model — static content rendered at request time

Each page is a standalone `.astro` file under `src/pages/methods/`. No new API routes, controllers, or repositories needed.

### 2.2 Content extraction via linking, not duplication

The epic spec states: "Content is extracted from existing pages — source pages link to the method pages rather than repeating content." This means:

- Existing pages that contain methodology preambles (e.g., `/tools/impact_analysis`, `/tools/mcda_analysis/`) keep a brief summary and link to the relevant method page for details
- The method pages contain the full treatment
- No content is duplicated across pages

### 2.3 Glossary page renders from the existing `GLOSSARY` record

The `GLOSSARY` record in `src/lib/labels.ts` (created by Epic 3/T04) already contains technical terms with definitions. The glossary page imports this record and renders it as an alphabetically sorted definition list. New terms from T04 tooltip labels are added to the `GLOSSARY` record — the page is the rendering surface, not a separate data store.

### 2.4 FAQ is promoted out of footer into the Methods section menu

Currently, FAQ is linked from the footer and a teaser section on the homepage. After Epic 12:
- FAQ remains at `/faq` (no URL change — G2)
- FAQ gets a link in the site navigation, accessible from a "Methods & quality" menu group
- The existing footer FAQ link stays

### 2.5 MCDA comparison view is a new page, not a tab within an existing perspective

The comparison needs data from all three perspectives simultaneously. The current per-perspective pages (`/tools/mcda_analysis/{type}/{perspective}`) load results for one perspective at a time. A comparison view:
- Lives at `/tools/mcda_analysis/{type}/compare`
- Loads results for all three perspectives server-side in the Astro frontmatter
- Passes all three result sets to a React comparison component

This approach avoids client-side fetching of additional perspectives and keeps the existing per-perspective pages untouched.

### 2.6 Convergence detection uses ranking position difference

"Rankings agree within a documented tolerance" means: for a given alternative, if its ranking position across all three perspectives differs by at most N positions (default: 1), the perspectives converge on that alternative. When all alternatives converge, the comparison states "All perspectives agree on the ranking" in plain text.

The tolerance is configurable:

```typescript
const CONVERGENCE_TOLERANCE = 1; // max rank difference to consider "agreement"
```

### 2.7 Data experience routes — methods pages are Data routes

The methods pages describe the platform's data methodology and scientific framework. They belong to the Data experience. In the experience registry:

```typescript
{ pattern: "/methods", experience: "data" },   // prefix match
```

This means all `/methods/*` routes show the Data menu and the Data segment is active in the experience switch.

---

## 3. T21 Architecture — Methods & Quality Section (Six Pages)

### 3a. New pages

| Page | Route | Source | Content |
|---|---|---|---|
| Evaluation framework (SIEF) | `/methods/evaluation-framework` | Split from `/data/kpis` intro and `/data/collection-plan` | KPI framework description, SIEF methodology, evaluation criteria |
| How the data is collected | `/methods/data-collection` | Existing `/data/collection-plan` content | Data collection process, survey methodology, quality controls |
| Data quality & curation | `/methods/data-quality` | New content | Validation workflow (D1.4 §4.3.4–4.3.5), curator role (placeholder), review cadence, display rules from T02/T03/T05 |
| How the models work | `/methods/models` | Split from `/tools/impact_analysis` and `/tools/mcda_analysis/` preambles | Ridge regression for impact analysis, PROMETHEE II for MCDA, model assumptions |
| Limitations | `/methods/limitations` | Split from same preambles | Statistical limitations, data coverage, interpretation caveats |
| Glossary | `/methods/glossary` | Retained technical terms from T04 (`GLOSSARY` in `src/lib/labels.ts`) | Alphabetical term list with definitions |

### 3b. Page template

All six pages follow the same Astro template pattern:

```astro
---
import Layout from "../../layouts/Layout.astro";
import { InfoAlert } from "../../components/react";

// Page-specific data if needed
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Methods & quality" },
    { label: "Page title" },
  ]}
  backHref="/methods/evaluation-framework"
>
  <div class="mx-auto px-4 py-8 max-w-4xl prose prose-gray">
    <h1>Page Title</h1>
    <!-- Content sections -->
  </div>
</Layout>
```

### 3c. Glossary page — imports from `src/lib/labels.ts`

```astro
---
import Layout from "../../layouts/Layout.astro";
import { GLOSSARY } from "../../lib/labels";

const sortedTerms = Object.entries(GLOSSARY).sort(([a], [b]) =>
  a.localeCompare(b)
);
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Methods & quality" },
    { label: "Glossary" },
  ]}
  backHref="/methods/evaluation-framework"
>
  <div class="mx-auto px-4 py-8 max-w-4xl">
    <h1>Glossary</h1>
    <p class="text-gray-600 mb-8">
      Technical terms used across the SUM Open Data Platform.
    </p>
    <dl class="space-y-4">
      {sortedTerms.map(([term, definition]) => (
        <div class="border-b border-gray-100 pb-3">
          <dt class="font-semibold text-gray-900">{term}</dt>
          <dd class="text-gray-600 mt-1">{definition}</dd>
        </div>
      ))}
    </dl>
  </div>
</Layout>
```

### 3d. New glossary entries to add

The existing `GLOSSARY` in `src/lib/labels.ts` has 11 entries. T04 introduced tooltip labels — every tooltip term needs a glossary entry. Add entries for:

```typescript
// New entries to add to GLOSSARY in src/lib/labels.ts:
"Evidence strength badge": "A visual indicator showing the normalized ratio of data coverage for a statistical association result. Three levels: Limited, Moderate, Strong.",
"Statistical association": "A measured relationship between policy measures and KPI changes, derived from ridge regression. Not a proven causal relationship.",
"Curated domain": "A subset of KPI groups selected for their relevance to New Shared Mobility uptake. Used as the default view on the impact analysis page.",
"Living Lab": "A SUM Horizon Europe project city that is a primary research site with full project involvement.",
"Contributing city": "A city participating in the SUM Open Data Platform by contributing data, but not a core SUM Living Lab.",
"Before/after data": "KPI measurements taken before and after implementing mobility measures, enabling impact assessment.",
"Validation date": "The date a living lab's data was reviewed and confirmed by the consortium. Used to determine 'validated' status.",
```

### 3e. Data quality & curation page — placeholder content

This page documents the validation workflow (D1.4 §4.3.4–4.3.5). Key sections:

1. **Data validation workflow** — How data flows from city input through validation
2. **Curator role** — Named role responsible for data quality (placeholder: "SUM Data Curation Team")
3. **Review cadence** — How often data is reviewed (placeholder: "Quarterly review cycle")
4. **Display rules** — How evidence strength badges (T05), freshness indicators (T07), and curated defaults (T08) communicate data quality to users

```astro
<InfoAlert title="Placeholder content" icon="warning" variant="warning" client:load>
  <p>The curator role and review cadence must be confirmed by the consortium.
  Current values are placeholders.</p>
</InfoAlert>
```

### 3f. Source page modifications — add links to method pages

The source pages that currently contain methodology content need to be modified to link to the new method pages instead of repeating the content:

**`src/pages/tools/impact_analysis.astro`** — Add a link to `/methods/models` and `/methods/limitations` near the top of the page, replacing or supplementing the existing methodology accordion content.

**`src/pages/tools/mcda_analysis/index.astro`** — Add a link to `/methods/models` in the methodology section, specifically for PROMETHEE methodology.

**`src/pages/data/collection-plan.astro`** — Add a link to `/methods/data-collection` and `/methods/evaluation-framework`. The collection plan page may keep its own content but cross-references the methods pages for framework details.

**`src/pages/data/kpis.astro`** — Add a link to `/methods/evaluation-framework` where the SIEF framework is introduced.

### 3g. FAQ promotion

The FAQ page (`src/pages/faq.astro`) already exists at `/faq`. To promote it into the navigation:

1. Add a "Methods & quality" menu group to the Data experience menu in `src/lib/experiences/registry.ts`
2. Include FAQ as an item in this group

```typescript
// In DATA_MENU.items, add a new group:
{
  label: "Methods & quality",
  subItems: [
    { href: "/methods/evaluation-framework", label: "Evaluation framework" },
    { href: "/methods/data-collection", label: "Data collection" },
    { href: "/methods/data-quality", label: "Data quality" },
    { href: "/methods/models", label: "How the models work" },
    { href: "/methods/limitations", label: "Limitations" },
    { href: "/methods/glossary", label: "Glossary" },
    { href: "/faq", label: "FAQ" },
  ],
},
```

### 3h. Experience registry updates

Add routes for all method pages:

```typescript
// In ROUTES array:
{ pattern: "/methods", experience: "data" },   // prefix match covers all /methods/* routes
```

---

## 4. T22 Architecture — MCDA Perspective Comparison

### 4a. New comparison page

File: `src/pages/tools/mcda_analysis/{type}/compare.astro` (one for qualitative, one for quantitative)

Since both analysis types (qualitative and quantitative) share the same comparison logic, create a shared component and two thin page wrappers.

**Qualitative:** `src/pages/tools/mcda_analysis/mcda_analysis_qualitative/compare.astro`
**Quantitative:** `src/pages/tools/mcda_analysis/mcda_analysis_quantitative/compare.astro`

Each page:
1. Loads MCDA results for all three perspectives server-side
2. Passes all three result sets to the comparison component
3. Uses the same `Layout` and breadcrumb pattern as the existing perspective pages

```astro
---
import Layout from "../../../../layouts/Layout.astro";
import MCDAADashboardPage from "../../../../components/MCDAADashboardPage.astro";
import { McdaComparisonView } from "../../../../components/react/MCDAAnalysis/McdaComparisonView";
import { MCDA_PERSPECTIVES } from "../../../../lib/helpers";
import ApiClient from "../../../../lib/api-client/ApiClient";

const api = new ApiClient(Astro.request);
const analysisType = "mcda_analysis_qualitative"; // or quantitative

// Load results for all three perspectives
const perspectiveResults = await Promise.all(
  Object.keys(MCDA_PERSPECTIVES).map(async (perspectiveKey) => {
    const jobRun = await api.getMcdaJobRun(analysisType, perspectiveKey);
    return {
      key: perspectiveKey,
      label: MCDA_PERSPECTIVES[perspectiveKey],
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
  <McdaComparisonView
    analysisType={analysisType}
    perspectives={perspectiveResults}
    client:load
  />
</Layout>
```

### 4b. New component: `src/components/react/MCDAAnalysis/McdaComparisonView.tsx`

Props:

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

The component renders:

1. **Ranking comparison table** — alternatives as rows, perspectives as columns, cells show rank position. Cells are colour-coded to highlight disagreements.

```
| Alternative           | Regulatory | PTO  | NSM Providers |
|-----------------------|-----------|------|---------------|
| Bike-sharing          | 1st       | 2nd  | 1st           |
| E-scooter integration | 3rd       | 1st  | 4th ⚠         |
| MaaS platform         | 2nd       | 3rd  | 2nd           |
| ...                   | ...       | ...  | ...           |
```

2. **Convergence statement** — When rankings agree within tolerance, display:
   - "All perspectives agree: [Alternative] ranks first across all stakeholder viewpoints."
   - When there's disagreement: "Perspectives diverge on [Alternative]: ranked 1st by Regulatory but 4th by NSM Providers."

3. **Disagreement highlights** — For each alternative where perspectives diverge beyond tolerance, show which perspectives disagree and by how much.

4. **Goal weight comparison** — A visual comparison of how each perspective weights the MCDA goals (using the existing `GoalWeightBar` component).

5. **Net flow comparison chart** — Side-by-side net flow scores for each alternative across perspectives.

6. **Links to individual perspectives** — Each perspective column header links to the full single-perspective view.

### 4c. Convergence detection logic

```typescript
const CONVERGENCE_TOLERANCE = 1;

interface RankComparison {
  alternativeKey: string;
  alternativeLabel: string;
  ranks: { perspectiveKey: string; perspectiveLabel: string; rank: number }[];
  maxDifference: number;
  converges: boolean;
}

function compareRankings(perspectives: PerspectiveData[]): {
  comparisons: RankComparison[];
  allConverge: boolean;
  convergenceStatement: string;
} {
  // Get ranking arrays from each perspective
  const perspectiveRankings = perspectives
    .filter(p => p.results?.ranking)
    .map(p => ({
      key: p.key,
      label: p.label,
      ranking: p.results!.ranking!,
      labels: p.results!.alternative_labels ?? {},
    }));

  if (perspectiveRankings.length < 2) {
    return { comparisons: [], allConverge: true, convergenceStatement: "" };
  }

  // Build comparison for each alternative
  const allAlternatives = new Set(
    perspectiveRankings.flatMap(p => p.ranking)
  );

  const comparisons: RankComparison[] = Array.from(allAlternatives).map(altKey => {
    const ranks = perspectiveRankings.map(p => ({
      perspectiveKey: p.key,
      perspectiveLabel: p.label,
      rank: p.ranking.indexOf(altKey) + 1,
    }));
    const rankValues = ranks.map(r => r.rank).filter(r => r > 0);
    const maxDifference = Math.max(...rankValues) - Math.min(...rankValues);

    return {
      alternativeKey: altKey,
      alternativeLabel: perspectiveRankings[0].labels[altKey] ?? altKey,
      ranks,
      maxDifference,
      converges: maxDifference <= CONVERGENCE_TOLERANCE,
    };
  });

  const allConverge = comparisons.every(c => c.converges);

  let convergenceStatement: string;
  if (allConverge) {
    const topAlternative = comparisons.find(c =>
      c.ranks.every(r => r.rank === 1)
    );
    if (topAlternative) {
      convergenceStatement = `All perspectives agree: "${topAlternative.alternativeLabel}" ranks first across all stakeholder viewpoints.`;
    } else {
      convergenceStatement = "All perspectives agree on the overall ranking within the documented tolerance.";
    }
  } else {
    const divergent = comparisons
      .filter(c => !c.converges)
      .map(c => `"${c.alternativeLabel}" (spread: ${c.maxDifference} positions)`)
      .join(", ");
    convergenceStatement = `Perspectives diverge on: ${divergent}.`;
  }

  return { comparisons, allConverge, convergenceStatement };
}
```

### 4d. Navigation entry for comparison view

Add a "Compare perspectives" link to the MCDA analysis pages. In each perspective page's navigation, add:

```astro
<a href={`/tools/mcda_analysis/${analysisType}/compare`}
   class="text-sm text-primary hover:underline">
  Compare all perspectives →
</a>
```

Also add it to the MCDADashboard component as an optional action button when a perspective is selected.

### 4e. MCDADashboard prop addition

File: `src/components/react/MCDAAnalysis/MCDADashboard.tsx`

Add an optional `comparisonUrl` prop:

```typescript
interface MCDADashboardProps {
  // ... existing props ...
  comparisonUrl?: string;  // NEW
}
```

When provided, render a link button in the results section:

```typescript
{comparisonUrl && (
  <div className="flex justify-center mt-4">
    <a href={comparisonUrl}
       className="text-sm font-medium text-primary hover:underline">
      Compare all perspectives →
    </a>
  </div>
)}
```

### 4f. Existing perspective pages stay untouched

The individual perspective pages (`/tools/mcda_analysis/{type}/{perspective}`) continue to work exactly as before. T22 adds a comparison view alongside them — it does not modify, replace, or wrap the existing pages.

---

## 5. File Change Summary

| File | Status | Task | What changes |
|---|---|---|---|
| `src/pages/methods/evaluation-framework.astro` | **New** | T21 | SIEF evaluation framework page |
| `src/pages/methods/data-collection.astro` | **New** | T21 | Data collection process page |
| `src/pages/methods/data-quality.astro` | **New** | T21 | Data quality & curation page (placeholder curator/cadence) |
| `src/pages/methods/models.astro` | **New** | T21 | How the models work page |
| `src/pages/methods/limitations.astro` | **New** | T21 | Limitations page |
| `src/pages/methods/glossary.astro` | **New** | T21 | Glossary page (renders from `GLOSSARY` in labels.ts) |
| `src/lib/labels.ts` | **Modify** | T21 | Add new glossary entries for T04/T05 terms |
| `src/lib/experiences/registry.ts` | **Modify** | T21 | Add `/methods` route, add "Methods & quality" menu group to Data menu, add FAQ to menu |
| `src/pages/tools/impact_analysis.astro` | **Modify** | T21 | Add link to `/methods/models` and `/methods/limitations` |
| `src/pages/tools/mcda_analysis/index.astro` | **Modify** | T21 | Add link to `/methods/models` |
| `src/pages/data/collection-plan.astro` | **Modify** | T21 | Add link to `/methods/data-collection` and `/methods/evaluation-framework` |
| `src/pages/data/kpis.astro` | **Modify** | T21 | Add link to `/methods/evaluation-framework` |
| `src/pages/tools/mcda_analysis/mcda_analysis_qualitative/compare.astro` | **New** | T22 | Qualitative MCDA comparison page |
| `src/pages/tools/mcda_analysis/mcda_analysis_quantitative/compare.astro` | **New** | T22 | Quantitative MCDA comparison page |
| `src/components/react/MCDAAnalysis/McdaComparisonView.tsx` | **New** | T22 | Comparison React component |
| `src/components/react/MCDAAnalysis/MCDADashboard.tsx` | **Modify** | T22 | Add optional `comparisonUrl` prop |
| `src/components/react/MCDAAnalysis/index.ts` | **Modify** | T22 | Export `McdaComparisonView` |
| `src/lib/experiences/registry.test.ts` | **Modify** | T21 | Add test for `/methods/*` route resolution |

Total: **9 new files**, **9 modified files**. One PR covering both T21 and T22.

---

## 6. Implementation Order

### T21 — Methods & quality section (can start immediately after prerequisites)

1. **Create `src/pages/methods/` directory** and six page files with the shared template structure
2. **Write content for the evaluation-framework page** — extract SIEF description from `/data/kpis` and `/data/collection-plan`
3. **Write content for the data-collection page** — consolidate from `/data/collection-plan`
4. **Write content for the data-quality page** — new content with placeholder curator and cadence
5. **Write content for the models page** — extract ridge regression description from impact analysis, PROMETHEE from MCDA
6. **Write content for the limitations page** — extract caveats from impact analysis and MCDA preambles
7. **Create the glossary page** — import `GLOSSARY` from labels.ts, render sorted definition list
8. **Add new glossary entries** to `src/lib/labels.ts`
9. **Update experience registry** — add `/methods` route, add "Methods & quality" menu group with FAQ
10. **Modify source pages** — add cross-links to method pages
11. **Add registry test** for `/methods/*` route
12. **Verify** all six pages render, source pages link correctly, FAQ is in the menu

**Verification checkpoint:** All six method pages render with content. Source pages link to them. FAQ appears in the navigation menu. Glossary page shows all terms alphabetically sorted.

### T22 — MCDA perspective comparison (can start as soon as Epic 3 is done)

1. **Create `McdaComparisonView.tsx`** with ranking comparison table, convergence detection, and goal weight comparison
2. **Create qualitative comparison page** `mcda_analysis_qualitative/compare.astro`
3. **Create quantitative comparison page** `mcda_analysis_quantitative/compare.astro`
4. **Add `comparisonUrl` prop** to `MCDADashboard.tsx`
5. **Export `McdaComparisonView`** from MCDAAnalysis index
6. **Wire comparison links** in existing perspective pages
7. **Verify** comparison page loads all three perspectives, convergence statement appears when applicable, disagreements are highlighted

---

## 7. Testing Strategy

### Manual verification (per PR checklist in epic.md)

| Check | How |
|---|---|
| Each method page has content | Navigate all six `/methods/*` routes |
| Source pages link to method pages | Click links on `/data/kpis`, `/tools/impact_analysis`, `/tools/mcda_analysis/`, `/data/collection-plan` |
| Glossary shows all T04 terms | Count entries on `/methods/glossary` against `GLOSSARY` record |
| FAQ reachable from menu | Click "FAQ" in the "Methods & quality" menu group |
| MCDA comparison loads all perspectives | Navigate to `/tools/mcda_analysis/mcda_analysis_qualitative/compare` |
| Convergence statement appears | Test with perspective combinations — check text |
| All three perspectives individually reachable | Navigate each perspective page directly |

### Unit tests

```typescript
// src/components/react/MCDAAnalysis/McdaComparisonView.test.tsx
describe("compareRankings", () => {
  it("detects convergence when all ranks match", () => { ... });
  it("detects convergence within tolerance of 1", () => { ... });
  it("detects divergence when spread exceeds tolerance", () => { ... });
  it("produces a convergence statement naming the top alternative", () => { ... });
  it("produces a divergence statement listing divergent alternatives", () => { ... });
  it("handles missing ranking data gracefully", () => { ... });
});
```

```typescript
// Add to src/lib/experiences/registry.test.ts
it("resolves /methods/glossary to data experience", () => {
  const state = resolveExperience("/methods/glossary", new URLSearchParams());
  expect(state.active).toBe("data");
});
```

---

## 8. Open Questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| OQ-1 | Who is the named curator for the data quality page? "SUM Data Curation Team" is a placeholder. | Consortium | T21 data-quality page content |
| OQ-2 | What is the review cadence? "Quarterly" is a placeholder. | Consortium | T21 data-quality page content |
| OQ-3 | Should the MCDA comparison include the personalized/custom analysis type, or only the expert survey and KPI-based types? | Product | T22 comparison page scope |
| OQ-4 | What is the appropriate convergence tolerance? Default is 1 rank position. Should this be configurable by the user? | Product/UX | T22 convergence detection |
| OQ-5 | Should the methods pages include diagrams or illustrations beyond text? If so, who provides them? | WP1/WP5 | T21 page content |

---

## 9. Out of Scope

- **Database schema changes** — All method pages are static content; no migrations
- **New API routes** — Method pages are pure Astro content; MCDA comparison reuses existing API calls
- **Rebuilding existing MCDA pages** — T22 adds a comparison view alongside; existing perspective pages are unchanged
- **Auto-generating glossary terms** — Terms are manually curated in `src/lib/labels.ts`
- **Insights experience integration** — Method pages are Data routes; Insights may link to them later but that's not in scope
- **Content authoring** — The dev creates the page structure and placeholder content; final prose is authored by WP1/WP5

---

## 10. Downstream Impact

| Consumer | What it uses | When |
|---|---|---|
| Epic 7 (Landing) | May link to methods section from trust strip or add-your-city CTA | Phase 3 |
| Epic 8 (Insights Goals) | May link to the models page for methodology context | Phase 4 |
| Epic 9 (Insights Cities) | May link to data quality page for curation context | Phase 4 |
| Future glossary expansion | New terms are added to `GLOSSARY` in `src/lib/labels.ts`; the glossary page renders automatically | Ongoing |
