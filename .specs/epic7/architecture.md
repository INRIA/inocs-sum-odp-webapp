# Architecture — Epic 7: Landing & Onboarding Pages

**Tasks:** T11 (M) → T18 (S) — T11 first, then T18
**Wave:** B | **Effort:** M + S | **Stack:** Astro 5 SSR + React 19 islands
**Dependencies:** After Epic 5 (T09 platform counters exist) and Epic 6 (experience mechanism in place)

---

## 1. Summary

Epic 7 reworks the public landing page (`src/pages/index.astro`) into a gateway that introduces both experiences — Data & scientific tools and Insights — and extracts contribution/onboarding content into a dedicated Join & Resources page.

**T11 — Main landing homepage.** Replaces the current 6-tile "Platform features" grid with two prominent experience "doors", each naming its audience and three entry pages. Adds a trust strip showing the T09 platform counters plus a named curator role (placeholder). Retains the map teaser, hero, and transport badges. The contribution steps and FAQ teaser move to the new Join page (T18).

**T18 — Join & Resources page.** A new Astro page at `/join` composed from the contribution steps currently on the homepage, a resources library entry point (linking to `/tools/resources`), and a FAQ entry point. Reachable from both experiences via the footer and the landing page.

---

## 2. Design Decisions with Rationale

### 2.1 Two experience doors replace the 6-tile grid — not an addition alongside it

The epic spec is explicit: "Current 6-tile 'Platform features' grid → replaced by two doors." The doors are the primary content below the hero. Each door is a card naming its audience and listing three entry pages. The individual features (KPI dashboard, measures, MCDA, etc.) are not lost — they are accessible through each experience's navigation and are named as entry pages within the doors.

### 2.2 Trust strip uses `computePlatformCounters()` — no new data source

The trust strip needs six labelled figures. The `computePlatformCounters()` utility (from Epic 5, `src/lib/utils/platformCounters.ts`) already produces `sumLivingLabs`, `contributingCities`, `citiesWithData`, and more. The current `StatsSection` on the homepage already shows these. The trust strip replaces the current `StatsSection` with a more compact, horizontal layout that also shows "Last updated" and a named curator role (placeholder text until the consortium confirms).

### 2.3 Landing page stays at `/` with `experience: "landing"` — no registry change needed

The experience registry (Epic 6) already assigns `/` as `"landing"` with `active: null`. No route ownership change. The two doors link into their respective experience home routes, which are already defined in the registry.

### 2.4 Join & Resources page at `/join` — a new shared route

The new page is reachable from both experiences, so it's registered as `experience: "shared"` in the route table. The `?view=` parameter propagation from Epic 6 ensures the correct menu context is maintained.

### 2.5 Content audit: every current homepage element is accounted for

| Current element | Destination | Notes |
|---|---|---|
| `CTAHero` (hero) | Stays on `/` (T11) | Subtitle updated to mention both experiences |
| `TransportBadge` strip | Stays on `/` (T11) | Becomes hero decoration |
| `StatsSection` (6 counters) | Trust strip on `/` (T11) | Compact horizontal layout, adds curator + last update |
| `CTASection` "Platform features" (6 tiles) | Replaced by two doors on `/` (T11) | Individual features named within doors |
| `LivingLabsMapSection` | Stays on `/` (T11) | Map teaser, links to city catalogue |
| `ODPTimeline` + "Monitoring measures" | Removed from `/`, content covered by methods section (Epic 12) | The timeline is presentation-only; the flow is documented in the methods section |
| Contribution steps (5-step zigzag) | Moves to `/join` (T18) | The primary content of the new page |
| Login/signup CTAs | Present on both `/` and `/join` | Doors link to experiences; join page has account CTAs |
| FAQ intro section | Moves to `/join` (T18) | FAQ entry point within the join page |
| Commented-out `MobilityMeasures` section | Stays commented out | No change |
| Commented-out CTA sections | Stay commented out | No change |

### 2.6 No new React components for the doors — Astro markup with Tailwind

The two doors are static content with links. They don't need client-side interactivity. Using Astro markup with Tailwind classes keeps them lightweight and avoids unnecessary JavaScript. The doors are rendered as two side-by-side card elements within a grid.

### 2.7 `CTACard` component is reusable for door entry links

Each door lists three entry pages. These can reuse the existing `CTACard` component (already on the current homepage) with appropriate props. This avoids creating a new component for a structurally identical element.

---

## 3. T11 Architecture — Main Landing Homepage

### 3a. Page structure (top to bottom)

```
1. Hero (CTAHero) — updated subtitle mentioning both experiences
2. Transport badges — hero decoration (unchanged)
3. Two experience doors — PRIMARY CONTENT
   ┌─────────────────────────┐  ┌─────────────────────────┐
   │  Data & scientific      │  │  Insights for           │
   │  tools                  │  │  decision-makers        │
   │                         │  │                         │
   │  For researchers,       │  │  For city planners,     │
   │  analysts, cities       │  │  policy makers,         │
   │  contributing data      │  │  transport operators    │
   │                         │  │                         │
   │  → KPI dashboard        │  │  → What works           │
   │  → Impact analysis      │  │  → Cities               │
   │  → Decision tool        │  │  → Plan for my city     │
   └─────────────────────────┘  └─────────────────────────┘
4. Trust strip — six figures + last update + curator
5. Map teaser (LivingLabsMapSection) — links to city catalogue
6. Add-your-city CTA — call to action for new cities
7. Footer (shared, from Layout)
```

### 3b. Two experience doors — data model

The doors are defined as a static array in the page frontmatter:

```typescript
const experienceDoors = [
  {
    id: "data",
    title: "Data & scientific tools",
    audience: "For researchers, data analysts, and cities contributing data",
    description: "Explore KPI datasets, run impact analyses, and use decision-support tools based on data collected across European cities.",
    entries: [
      { label: "KPI dashboard", href: "/data/kpis", icon: "chart" },
      { label: "Impact analysis", href: "/tools/impact_analysis", icon: "trending" },
      { label: "Decision tool", href: "/tools/mcda_analysis/", icon: "scale" },
    ],
    cta: { label: "Explore data", href: "/data/kpis" },
    colorAccent: "primary",
  },
  {
    id: "insights",
    title: "Insights for decision-makers",
    audience: "For city planners, policy makers, and transport operators",
    description: "Discover what works, compare cities, and plan sustainable mobility strategies guided by evidence from the SUM project.",
    entries: [
      { label: "What works", href: "/insights/goals", icon: "lightbulb" },
      { label: "Cities", href: "/insights/cities", icon: "buildings" },
      { label: "Plan for my city", href: "/insights/plan", icon: "map" },
    ],
    cta: { label: "Explore insights", href: "/insights" },
    colorAccent: "secondary",
  },
];
```

Each door renders as a card with:
- Title and audience tagline
- Short description
- Three entry links (using `CTACard` or simple styled `<a>` elements)
- Primary CTA button

### 3c. Trust strip — replaces current `StatsSection`

The trust strip is a compact horizontal row of six labelled figures. It reuses `computePlatformCounters()` data but renders differently from the current `StatsSection`:

```astro
<section class="bg-gray-50 border-y border-gray-200 py-6 px-4">
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-wrap justify-center gap-x-8 gap-y-3 text-center">
      {trustCounters.map(counter => (
        <div class="flex flex-col items-center">
          <span class="text-2xl font-bold text-primary">{counter.value}</span>
          <span class="text-xs text-gray-500 max-w-24">{counter.label}</span>
        </div>
      ))}
    </div>
    <div class="text-center mt-3 text-xs text-gray-400">
      <span>Curated by: {curatorName}</span>
      <span class="mx-2">·</span>
      <span>Last updated: {lastUpdated}</span>
    </div>
  </div>
</section>
```

The `trustCounters` array reuses the same six counters currently in `StatsSection`:

```typescript
const trustCounters = [
  { value: platformCounters.sumLivingLabs, label: "SUM Living Labs" },
  { value: platformCounters.contributingCities, label: "Contributing cities" },
  { value: platformCounters.citiesWithData, label: "Cities with data" },
  { value: measures?.length ?? 0, label: "Policy measures" },
  { value: transportModes?.length ?? 0, label: "Shared mobility services" },
  { value: parentKpis?.length ?? 0, label: "KPIs monitored" },
];
```

The curator name and last-updated date are placeholder values:

```typescript
const curatorName = "SUM Consortium Data Team"; // placeholder — consortium to confirm
const lastUpdated = "August 2026"; // can be derived from latest KPI result date
```

### 3d. Add-your-city CTA section

A simple call-to-action section between the map and the footer:

```astro
<section class="py-12 px-4 text-center">
  <h2 class="text-2xl font-bold text-gray-900 mb-3">
    Add your city to the platform
  </h2>
  <p class="text-gray-600 mb-6 max-w-2xl mx-auto">
    Contribute your city's mobility data and join the European network
    of cities working toward seamless shared urban mobility.
  </p>
  <div class="flex flex-col sm:flex-row gap-4 justify-center">
    <RButton href="/join" variant="primary">
      Learn how to contribute →
    </RButton>
    <RButton href="/lab-admin/signup" variant="secondary">
      Create an account →
    </RButton>
  </div>
</section>
```

### 3e. What gets removed from `index.astro`

| Removed element | Reason |
|---|---|
| `CTASection` "Open Data Platform features" (6-tile grid) | Replaced by two experience doors |
| `StatsSection` component usage | Replaced by inline trust strip |
| `ODPTimeline` + "Monitoring measures" CTA section | Content covered by Epic 12 methods section |
| Contribution steps (5-step zigzag) | Moved to `/join` (T18) |
| FAQ intro section | Moved to `/join` (T18) |
| Login/signup CTA buttons at bottom | Replaced by add-your-city CTA |

### 3f. What stays on `index.astro`

| Kept element | Notes |
|---|---|
| `CTAHero` | Subtitle updated |
| `TransportBadge` strip | Unchanged, hero decoration |
| `LivingLabsMapSection` | Unchanged, map teaser |
| API data fetching (labs, measures, KPIs, transport modes) | Still needed for trust strip and map |
| `computePlatformCounters()` | Still needed for trust strip |
| All imports for kept components | Unchanged |

---

## 4. T18 Architecture — Join & Resources Page

### 4a. New file: `src/pages/join.astro`

A new Astro page that composes content extracted from the current homepage:

```astro
---
import Layout from "../layouts/Layout.astro";
import { RButton, FAQAccordion } from "../components/react";
import { getUrl } from "../lib/helpers";

const steps = [
  {
    id: 1, color: "primary", icon: "👤",
    title: "Create your account",
    description: "Sign up and join your existing city, or register a new one to start contributing.",
  },
  {
    id: 2, color: "secondary", icon: "🏙️",
    title: "Describe your city",
    description: "Provide key details: name, city, and zone or area of intervention.",
  },
  {
    id: 3, color: "warning", icon: "📊",
    title: "Collect baseline data",
    description: "Input your first round of KPI values before implementing mobility measures.",
  },
  {
    id: 4, color: "info", icon: "⚙️",
    title: "Add your measures",
    description: "Document the mobility measures and policies implemented in your city.",
  },
  {
    id: 5, color: "primary", icon: "📈",
    title: "Collect post-data",
    description: "Measure KPIs again to assess the impact of measures and share results.",
  },
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
  <!-- Page header -->
  <!-- Contribution steps (extracted from homepage) -->
  <!-- Resources library entry (links to /tools/resources) -->
  <!-- FAQ entry point (links to /faq) -->
  <!-- Login/signup CTAs -->
</Layout>
```

### 4b. Page sections

1. **Page header** — Title "Join & Resources", subtitle explaining the platform's contribution model
2. **Contribution steps** — The 5-step zigzag timeline extracted verbatim from the current homepage (same markup, same `steps` array)
3. **Resources library entry** — A card section linking to `/tools/resources` (data collection plan, spreadsheet templates, survey templates)
4. **FAQ entry point** — A card section linking to `/faq` with a brief description
5. **Login/signup CTAs** — The `RButton` pair currently at the bottom of the homepage

### 4c. Route registration

Add the new route to the experience registry:

```typescript
// In src/lib/experiences/registry.ts, ROUTES array:
{ pattern: "/join", experience: "shared" },
```

This ensures the page inherits the visitor's current experience menu via `?view=` propagation.

### 4d. Navigation entries

The join page needs to be reachable from:

1. **Landing page** — "Add your city" CTA links to `/join`
2. **Footer** — Add "Join & Resources" to the footer sections (in `Layout.astro` footer menu definition)
3. **Insights menu** — Epic 6 already has `{ href: "/insights/resources", label: "Join & resources" }` in the Insights menu. Update the href to `/join`

---

## 5. File Change Summary

| File | Status | Task | What changes |
|---|---|---|---|
| `src/pages/index.astro` | **Modify** | T11 | Replace 6-tile grid with two doors, replace StatsSection with trust strip, remove contribution steps and FAQ section, add add-your-city CTA |
| `src/pages/join.astro` | **New** | T18 | Join & Resources page with contribution steps, resources entry, FAQ entry |
| `src/lib/experiences/registry.ts` | **Modify** | T18 | Add `/join` route entry as `"shared"` |

Total: **1 new file**, **2 modified files**. One PR covering both T11 and T18.

---

## 6. Implementation Order

### T11 — Main landing homepage (implement first)

1. **Update `src/pages/index.astro`** — Define `experienceDoors` array in frontmatter
2. **Replace the `CTASection` "Platform features"** with two-door card layout using Astro markup and Tailwind
3. **Replace `StatsSection`** with compact trust strip (inline markup, reuses `computePlatformCounters()` data)
4. **Add add-your-city CTA section** between the map and footer
5. **Remove** the contribution steps section, ODPTimeline section, and FAQ section (these move to `/join`)
6. **Update hero subtitle** to mention both experiences
7. **Verify** the landing page renders with doors, trust strip, map, and add-your-city CTA

**Verification checkpoint:** After T11, the homepage has a hero, transport badges, two experience doors, a trust strip, the city map, and an add-your-city CTA. No content is lost — it's either on the page or explicitly moved to `/join`.

### T18 — Join & Resources page (implement second, needs T11)

1. **Create `src/pages/join.astro`** with contribution steps extracted from old homepage
2. **Add resources library entry** section linking to `/tools/resources`
3. **Add FAQ entry point** section linking to `/faq`
4. **Add login/signup CTAs** at the bottom
5. **Register `/join` route** in `src/lib/experiences/registry.ts` as `"shared"`
6. **Update navigation** — ensure `/join` is linked from the landing page CTA and the footer
7. **Verify** the join page is reachable from both experiences and shows the complete contribution flow

---

## 7. Testing Strategy

### Manual verification (per PR checklist in epic.md)

| Check | How |
|---|---|
| Two doors are largest below hero | Visual inspection — doors occupy the main content area |
| Each door names audience and three entries | Check text content of each door card |
| Trust strip shows six figures | Compare against current StatsSection values |
| Trust strip shows curator and last update | Verify placeholder text renders |
| Every homepage element is accounted for | Cross-reference content audit table (section 2.5) |
| Join page is reachable from both experiences | Navigate from Data menu, Insights menu, landing page |
| No content lost from current homepage | Compare old vs new page side by side |
| Map teaser links to city catalogue | Click through from map section |

### Unit tests

No new unit tests are required for this epic. The changes are primarily layout/markup changes in Astro pages. The experience registry test suite (from Epic 6) should be updated to cover the new `/join` route:

```typescript
// Add to src/lib/experiences/registry.test.ts
it("resolves /join to shared experience", () => {
  const state = resolveExperience("/join", new URLSearchParams());
  expect(state.isShared).toBe(true);
});
```

---

## 8. Open Questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| OQ-1 | What is the curator role name for the trust strip? "SUM Consortium Data Team" is a placeholder. | Consortium | T11 trust strip text |
| OQ-2 | Should "Last updated" derive from the latest KPI result date automatically, or be a manually set date? | Product | T11 trust strip |
| OQ-3 | Should the Insights door entry links be active (leading to placeholder pages) or disabled with "Coming soon" badges until Epics 8-10 are implemented? | Product/UX | T11 door rendering |
| OQ-4 | Should the ODPTimeline content be preserved anywhere, or is it fully superseded by Epic 12's methods section? | Product | T11 content removal |

---

## 9. Out of Scope

- **Experience mechanism changes** — Epic 6's registry and resolution logic are unchanged
- **New React components** — The doors are Astro markup; no new interactive components needed
- **Content for Insights entry pages** — Epics 8, 9, 10 create those pages; the doors only link to them
- **Footer restructuring** — Only adds a link to `/join`; footer layout stays the same
- **Mobile responsiveness overhaul** — Standard Tailwind responsive classes; no dedicated mobile redesign

---

## 10. Downstream Impact

| Epic | How it interacts |
|---|---|
| 8 (Insights Goals) | Door entry "What works" becomes live when `/insights/goals` is created |
| 9 (Insights Cities) | Door entry "Cities" becomes live when `/insights/cities` is created |
| 10 (Guided Tool) | Door entry "Plan for my city" becomes live when `/insights/plan` is created |
| 12 (Methods & MCDA) | May link to the methods section from the trust strip or add-your-city CTA |
