# Story T18 — Join & Resources Page

**Epic:** 7 — Landing & Onboarding Pages
**Size:** S
**Dependencies:** T11 (main landing homepage must be done first)
**Branch:** `feature/epic7-landing-onboarding`

---

## User Story

> As a city representative or researcher interested in contributing, I can find a single page that explains how to join the platform, where to find resources, and where to get answers — reachable from both the Data and Insights experiences.

---

## Acceptance Criteria

- [ ] AC-1: `/join` page contains the 5-step contribution flow (extracted from old homepage)
- [ ] AC-2: A resources library entry section links to `/tools/resources`
- [ ] AC-3: A FAQ entry point section links to `/faq`
- [ ] AC-4: Login and signup CTAs are present
- [ ] AC-5: The page is reachable from both experiences (via footer or landing page CTA)
- [ ] AC-6: The `/join` route is registered as `"shared"` in the experience registry

---

## Implementation Steps

### Step 1: Create `src/pages/join.astro`

Create the new page with the Layout wrapper:

```astro
---
import Layout from "../layouts/Layout.astro";
import { RButton } from "../components/react";
import { getUrl } from "../lib/helpers";

const steps = [
  { id: 1, color: "primary", icon: "👤", title: "Create your account",
    description: "Sign up and join your existing city, or register a new one to start contributing." },
  { id: 2, color: "secondary", icon: "🏙️", title: "Describe your city",
    description: "Provide key details: name, city, and zone or area of intervention." },
  { id: 3, color: "warning", icon: "📊", title: "Collect baseline data",
    description: "Input your first round of KPI values before implementing mobility measures." },
  { id: 4, color: "info", icon: "⚙️", title: "Add your measures",
    description: "Document the mobility measures and policies implemented in your city." },
  { id: 5, color: "primary", icon: "📈", title: "Collect post-data",
    description: "Measure KPIs again to assess the impact of measures and share results." },
];
---

<Layout
  role="visitor"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Join & Resources" },
  ]}
  backHref="/"
>
  <!-- Page content sections below -->
</Layout>
```

### Step 2: Add page header

```astro
<div class="mx-auto px-4 py-8 max-w-5xl">
  <h1 class="text-3xl font-bold text-gray-900 mb-2">Join & Resources</h1>
  <p class="text-lg text-gray-600 mb-8">
    Learn how to contribute your city's data to the SUM Open Data Platform,
    access resources for data collection, and find answers to common questions.
  </p>
</div>
```

### Step 3: Add contribution steps section

Extract the 5-step zigzag timeline from the old `index.astro` (the `<section class="bg-gray-50 py-16 ...">` block). Move the markup verbatim into `join.astro`, preserving the zigzag layout with the vertical line, step markers, and cards.

### Step 4: Add resources library entry

```astro
<section class="py-12 px-4 max-w-5xl mx-auto">
  <h2 class="text-2xl font-bold text-gray-900 mb-4">Resources</h2>
  <p class="text-gray-600 mb-6">
    Access templates, guides, and tools to help you collect and calculate KPI data for your city.
  </p>
  <div class="grid sm:grid-cols-2 gap-4">
    <a href={getUrl("/tools/resources")}
       class="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <h3 class="font-semibold text-gray-900 mb-1">Resource library</h3>
      <p class="text-sm text-gray-600">Models, optimisation tools and software for integrated mobility planning.</p>
    </a>
    <a href={getUrl("/data/collection-plan")}
       class="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <h3 class="font-semibold text-gray-900 mb-1">Data collection planning</h3>
      <p class="text-sm text-gray-600">KPI framework, spreadsheet templates, and survey tools for your city.</p>
    </a>
  </div>
</section>
```

### Step 5: Add FAQ entry point

```astro
<section class="bg-white py-12 px-4 border-t border-gray-100">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-2xl font-bold text-gray-900 mb-3">Have questions?</h2>
    <p class="text-gray-600 mb-6">
      Find answers about data access, contributing results, measures, KPIs,
      and technical integration.
    </p>
    <RButton href={getUrl("/faq")} variant="primary" className="bg-primary text-light">
      Go to the FAQ →
    </RButton>
  </div>
</section>
```

### Step 6: Add login/signup CTAs

```astro
<section class="py-12 px-4">
  <div class="text-center flex flex-col md:flex-row gap-4 mx-auto justify-center">
    <RButton href="/lab-admin/login" variant="primary" className="bg-warning text-light">
      Login to your account →
    </RButton>
    <RButton href="/lab-admin/signup" variant="primary">
      Join the Platform →
    </RButton>
  </div>
</section>
```

### Step 7: Register `/join` route in experience registry

File: `src/lib/experiences/registry.ts`

Add to the `ROUTES` array in the shared routes section:

```typescript
{ pattern: "/join", experience: "shared" },
```

### Step 8: Update experience registry test

File: `src/lib/experiences/registry.test.ts`

Add a test case:

```typescript
it("resolves /join to shared experience", () => {
  const state = resolveExperience("/join", new URLSearchParams());
  expect(state.isShared).toBe(true);
});
```

### Step 9: Verification

- [ ] Navigate to `/join` — page renders with all sections
- [ ] Navigate from Data experience — menu preserved via `?view=data`
- [ ] Navigate from Insights experience — menu preserved via `?view=insights`
- [ ] Click landing page "Learn how to contribute" CTA — arrives at `/join`
- [ ] Resources links go to correct pages
- [ ] FAQ link goes to `/faq`
- [ ] Login/signup buttons work
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`

---

## Out of Scope

- Modifying the resources page (`/tools/resources`) content
- Modifying the FAQ page content
- i18n / translations
- Analytics tracking

---

## PR Checklist

- [ ] Included in same PR as T11
- [ ] `/join` page has all five sections (header, steps, resources, FAQ, CTAs)
- [ ] Route registered in experience registry
- [ ] Reachable from both experiences
- [ ] Existing test suite passes
