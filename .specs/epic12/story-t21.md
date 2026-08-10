# Story T21 — Methods & Quality Section

**Epic:** 12 — Methods, Glossary & MCDA Enhancement
**Size:** L
**Dependencies:** Epics 2, 3, 4, 6 (T02–T05, T10 must be complete)
**Branch:** `feature/epic12-methods-mcda`

---

## User Story

> As a platform visitor, I can find a dedicated section explaining the platform's methodology, data quality practices, and glossary so that I understand how the data is collected, validated, and analysed — without reading scattered preambles across multiple pages.

---

## Acceptance Criteria

- [ ] AC-1: Six method pages exist under `/methods/` — evaluation framework, data collection, data quality, models, limitations, glossary
- [ ] AC-2: Each method page's source content is identified; the source page links to the method page rather than repeating the full content
- [ ] AC-3: Data quality & curation page names a curator role and a review cadence (placeholder acceptable)
- [ ] AC-4: Every T04 tooltip term has a corresponding glossary entry on `/methods/glossary`
- [ ] AC-5: FAQ is reachable from a "Methods & quality" menu group in the Data experience navigation, not only the footer
- [ ] AC-6: All method pages belong to the Data experience (show Data menu)

---

## Implementation Steps

### Step 1: Create method page files

Create the directory `src/pages/methods/` and six Astro page files:

- `src/pages/methods/evaluation-framework.astro`
- `src/pages/methods/data-collection.astro`
- `src/pages/methods/data-quality.astro`
- `src/pages/methods/models.astro`
- `src/pages/methods/limitations.astro`
- `src/pages/methods/glossary.astro`

Each page uses the shared template (see architecture.md section 3b):

```astro
---
import Layout from "../../layouts/Layout.astro";
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Methods & quality" },
    { label: "PAGE TITLE" },
  ]}
  backHref="/methods/evaluation-framework"
>
  <div class="mx-auto px-4 py-8 max-w-4xl">
    <h1>PAGE TITLE</h1>
    <!-- Content -->
  </div>
</Layout>
```

### Step 2: Write evaluation framework page

File: `src/pages/methods/evaluation-framework.astro`

Content sourced from the SIEF framework description currently in `/data/collection-plan.astro` (the "KPI SIEF Framework & Formulas" section and the `KpisFrameworkDiagram` component) and the KPI page intro.

Sections:
1. What SIEF is and why it exists
2. The KPI framework diagram (import `KpisFrameworkDiagram` component)
3. Evaluation criteria and methodology
4. Link to the KPI Framework PDF download

### Step 3: Write data collection page

File: `src/pages/methods/data-collection.astro`

Content sourced from `/data/collection-plan.astro`. Include:
1. Overview of the data collection process
2. The 4-step collection plan (reuse the `collectionPlanSteps` data or reference it)
3. Available resources for data collectors
4. "Why your data matters" rationale

### Step 4: Write data quality & curation page

File: `src/pages/methods/data-quality.astro`

New content with placeholder values:
1. Data validation workflow (based on D1.4 §4.3.4–4.3.5)
2. Curator role: "SUM Data Curation Team" (placeholder)
3. Review cadence: "Quarterly review cycle" (placeholder)
4. Display rules explaining how T02/T03/T05 badge thresholds, freshness indicators, and evidence badges communicate quality to users
5. `InfoAlert` warning that curator role and cadence are placeholders

### Step 5: Write models page

File: `src/pages/methods/models.astro`

Content sourced from the methodology accordions in:
- `/tools/impact_analysis.astro` — ridge regression approach
- `/tools/mcda_analysis/` — PROMETHEE II methodology

Sections:
1. Impact analysis model (ridge regression) — what it does, inputs, outputs, assumptions
2. MCDA model (PROMETHEE II) — what it does, inputs, outputs, assumptions
3. Link back to each tool for hands-on use

### Step 6: Write limitations page

File: `src/pages/methods/limitations.astro`

Content sourced from the disclaimers in:
- `ImpactAnalysisDashboard` PageNavigation disclaimer
- MCDA dashboard disclaimer
- General data coverage limitations

Sections:
1. Statistical limitations — association vs causation, sample size
2. Data coverage — number of cities, time periods, missing data
3. Interpretation caveats — how to use the results responsibly

### Step 7: Write glossary page

File: `src/pages/methods/glossary.astro`

Import `GLOSSARY` from `src/lib/labels.ts`, sort entries alphabetically, render as a definition list. See architecture.md section 3c for the full markup.

### Step 8: Add new glossary entries

File: `src/lib/labels.ts`

Add entries to the `GLOSSARY` record (see architecture.md section 3d). Ensure every T04 tooltip term has an entry. Verify by cross-referencing the label mapping table in the roadmap.

### Step 9: Update experience registry

File: `src/lib/experiences/registry.ts`

**9a.** Add route entry:
```typescript
{ pattern: "/methods", experience: "data" },
```

**9b.** Add "Methods & quality" menu group to `DATA_MENU.items`:
```typescript
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

### Step 10: Add cross-links in source pages

**10a.** `src/pages/data/kpis.astro` — Add a note linking to `/methods/evaluation-framework` where the framework is introduced.

**10b.** `src/pages/data/collection-plan.astro` — Add links to `/methods/data-collection` and `/methods/evaluation-framework`.

**10c.** `src/pages/tools/impact_analysis.astro` — Add links to `/methods/models` and `/methods/limitations`.

**10d.** `src/pages/tools/mcda_analysis/index.astro` — Add link to `/methods/models` in the methodology section.

### Step 11: Update experience registry tests

File: `src/lib/experiences/registry.test.ts`

```typescript
it("resolves /methods/glossary to data experience", () => {
  const state = resolveExperience("/methods/glossary", new URLSearchParams());
  expect(state.active).toBe("data");
});

it("resolves /methods/models to data experience", () => {
  const state = resolveExperience("/methods/models", new URLSearchParams());
  expect(state.active).toBe("data");
});
```

### Step 12: Final verification

- [ ] Navigate all six `/methods/*` routes — pages render with content
- [ ] Click cross-links on source pages — arrive at correct method pages
- [ ] Glossary page shows all entries alphabetically sorted
- [ ] "Methods & quality" menu group visible in Data experience navigation
- [ ] FAQ accessible from the menu
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`

---

## Out of Scope

- Final prose authoring (WP1/WP5 responsibility)
- Diagrams or illustrations beyond the existing `KpisFrameworkDiagram`
- i18n / translations
- Insights experience navigation changes

---

## PR Checklist

- [ ] One PR covering T21 and T22
- [ ] Six method pages render with content
- [ ] Source pages link to method pages
- [ ] Glossary has all T04 terms
- [ ] FAQ in menu navigation
- [ ] Data quality page has placeholder curator and cadence
- [ ] All tests pass
