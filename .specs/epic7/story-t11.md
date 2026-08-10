# Story T11 — Main Landing Homepage

**Epic:** 7 — Landing & Onboarding Pages
**Size:** M
**Dependencies:** Epic 5 (T09 platform counters), Epic 6 (experience mechanism)
**Branch:** `feature/epic7-landing-onboarding`

---

## User Story

> As a first-time visitor, I see two clear entry points — one for exploring data and tools, one for decision-maker insights — so I can choose the path that matches my role, plus a trust strip that shows the platform's scale and credibility.

---

## Acceptance Criteria

- [ ] AC-1: Two experience doors are the largest element below the hero; each names its audience and three entry pages
- [ ] AC-2: Trust strip shows six labelled figures (same values as current StatsSection) plus a named curator role (placeholder OK) and a "last updated" indicator
- [ ] AC-3: Transport badges remain as hero decoration
- [ ] AC-4: Map teaser (LivingLabsMapSection) remains and links to city catalogue
- [ ] AC-5: An "Add your city" CTA links to `/join` (T18 page)
- [ ] AC-6: Every piece of current homepage content is accounted for (retained, merged, re-homed, or explicitly documented as superseded)
- [ ] AC-7: The 6-tile "Platform features" grid is no longer rendered

---

## Implementation Steps

### Step 1: Define experience doors data in `index.astro` frontmatter

Add the `experienceDoors` array after the existing data-fetching code (see architecture.md section 3b for the data model). Each door has: `id`, `title`, `audience`, `description`, `entries[]` (label + href + icon), `cta` (label + href), and `colorAccent`.

### Step 2: Replace the 6-tile grid with two doors

**Remove** the `CTASection` with title "Open Data Platform features" and its 6 `CTACard` children (lines ~190–252 in current `index.astro`).

**Replace with** a two-column grid of door cards:

```astro
<section class="py-12 px-4">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-2xl font-bold text-center text-gray-900 mb-8">
      Choose your entry point
    </h2>
    <div class="grid md:grid-cols-2 gap-6">
      {experienceDoors.map(door => (
        <div class={`rounded-2xl border-2 border-${door.colorAccent}/20 bg-white p-8 shadow-sm hover:shadow-md transition-shadow`}>
          <h3 class={`text-xl font-bold text-${door.colorAccent} mb-1`}>{door.title}</h3>
          <p class="text-sm text-gray-500 mb-3">{door.audience}</p>
          <p class="text-gray-600 mb-6">{door.description}</p>
          <div class="space-y-2 mb-6">
            {door.entries.map(entry => (
              <a href={getUrl(entry.href)} class="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary">
                <span class="text-gray-400">→</span> {entry.label}
              </a>
            ))}
          </div>
          <RButton href={getUrl(door.cta.href)} variant="primary" className={`bg-${door.colorAccent}`}>
            {door.cta.label} →
          </RButton>
        </div>
      ))}
    </div>
  </div>
</section>
```

### Step 3: Replace `StatsSection` with trust strip

**Remove** the `StatsSection` component usage (lines ~136–172 in current `index.astro`).

**Replace with** a compact inline trust strip section:

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

Define `trustCounters`, `curatorName`, and `lastUpdated` in the frontmatter (see architecture.md section 3c).

### Step 4: Remove sections that move to `/join`

**Remove** the contribution steps section (the `<section class="bg-gray-50 py-16 ...">` block with the 5-step zigzag timeline, lines ~265–349).

**Remove** the FAQ intro section (the `<section class="bg-white py-12 ...">` block, lines ~387–409).

**Remove** the `ODPTimeline` + "Monitoring measures" CTA section (the `CTASection` wrapping `ODPTimeline`, lines ~256–263).

**Remove** the `steps` array from frontmatter (lines ~67–108), the `ODPTimeline` import, and the `StatsSection` import. Keep imports for `CTAHero`, `TransportBadge`, `LivingLabsMapSection`, `RButton`, `CTACard`.

### Step 5: Add add-your-city CTA section

After the `LivingLabsMapSection`, add:

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

### Step 6: Update hero subtitle

Update the `CTAHero` subtitle to mention both experiences:

**Before:** `"A first-of-its-kind, Pan-European Open Data Platform tracking the impact of policy measures on New Shared Mobility seamless integration with Public Transport across 9 SUM Living Labs and Contributing cities."`

**After:** `"A Pan-European Open Data Platform for decision-makers and researchers — delivering insights and data on New Shared Mobility integration with Public Transport across SUM Living Labs and Contributing cities."`

### Step 7: Final verification

- [ ] Visual inspection: doors are the primary content below hero
- [ ] Counter check: trust strip values match the current StatsSection
- [ ] Content audit: compare with architecture.md section 2.5 table
- [ ] Map section renders correctly
- [ ] Add-your-city CTA links to `/join`
- [ ] Run `npm run build` to verify no build errors

---

## Out of Scope

- Creating the `/join` page (T18)
- Implementing Insights entry pages (Epics 8-10)
- Mobile-specific responsive overhaul
- Content changes to the map section

---

## PR Checklist

- [ ] One PR covering T11 and T18
- [ ] Two doors render as the primary element below hero
- [ ] Trust strip shows 6 figures + curator + last update
- [ ] Every current homepage element accounted for
- [ ] No 6-tile grid visible
- [ ] Visual review screenshots attached to PR
