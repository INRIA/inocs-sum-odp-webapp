# Architecture — Epic 6: Experience Architecture & Shell

## Overview

This epic introduces a **dual-experience mechanism** that lets every public route declare whether it belongs to the Data experience, the Insights experience, or is Shared. A segmented control in the header lets users switch between experiences. The mechanism is data-driven — route ownership and counterpart mapping live in a single registry, not scattered conditionals.

**Governing constraints:**
- No route changes path (G2)
- Existing pages are not rebuilt (G3)
- Lab-admin routes are out of scope (G4) — they use `SidebarMenu` and are unaffected
- Only the visitor layout (`SiteNavBar`) gets the experience mechanism

---

## Core concept: Experience Registry

A single TypeScript module defines all route-to-experience mappings, counterpart pairs, and menu definitions. Every downstream component reads from this registry — nothing is hardcoded.

### Data model

```typescript
// --- Types ---

type ExperienceId = "data" | "insights";

interface RouteEntry {
  pattern: string;                            // e.g. "/data/kpis", "/living-lab-city/:labId"
  experience: ExperienceId | "shared" | "landing";
  counterpart?: string;                       // Pattern in the other experience (params preserved)
}

interface ExperienceMenu {
  id: ExperienceId;
  label: string;
  home: string;                               // Default route when switching to this experience
  items: MenuItem[];                           // Same MenuItem shape used by SiteNavBar today
}

interface ExperienceState {
  active: ExperienceId | null;                // null on landing page
  menu: MenuItem[];                           // Items for the active experience's nav
  switchSegments: { label: string; href: string; active: boolean }[];
  isShared: boolean;
  viewParam: ExperienceId | null;             // ?view= value, if present
}
```

### Route ownership table (data)

```typescript
const ROUTES: RouteEntry[] = [
  // Landing — neither experience
  { pattern: "/",                                     experience: "landing" },

  // Data experience
  { pattern: "/data/kpis",                            experience: "data" },
  { pattern: "/data/modal-split",                     experience: "data" },
  { pattern: "/data/measures",                        experience: "data" },
  { pattern: "/data/collection-plan",                 experience: "data" },
  { pattern: "/tools/impact_analysis",                experience: "data" },
  { pattern: "/tools/mcda_analysis",                  experience: "data" },   // prefix match
  { pattern: "/living-lab-city/:labId",               experience: "data",
    counterpart: "/insights/city/:labId" },

  // Insights experience
  { pattern: "/insights/city/:labId",                 experience: "insights",
    counterpart: "/living-lab-city/:labId" },
  // Future Insights routes (T13-T18) will be added here by later epics

  // Shared surfaces — keep visitor's current menu
  { pattern: "/tools/resources",                      experience: "shared" },  // prefix match
  { pattern: "/faq",                                  experience: "shared" },
  { pattern: "/legal-notice",                         experience: "shared" },
  { pattern: "/privacy-policy",                       experience: "shared" },
];
```

### Counterpart mapping

The only true bidirectional counterpart today is:

| Data route | Insights counterpart |
|---|---|
| `/living-lab-city/[labId]` | `/insights/city/[labId]` |

All other routes navigate to the other experience's **home** when the user toggles the switch. As future epics add Insights pages, they add counterpart entries to the registry — no architecture changes needed.

### Experience home routes

| Experience | Home route |
|---|---|
| Data | `/data/kpis` |
| Insights | `/insights` (placeholder — will be defined by Epic 8) |

---

## Resolution algorithm

`resolveExperience(pathname, searchParams, livingLabs)` runs server-side in `Layout.astro` frontmatter:

```
1. Strip BASE_URL prefix from pathname
2. Match pathname against ROUTES (longest prefix wins for wildcard entries)
3. Determine raw experience:
   - If match found → use match.experience
   - If no match → default to "landing"
4. For "shared" routes:
   - Read ?view= from searchParams
   - If ?view=data or ?view=insights → use that as active experience
   - Otherwise → default to "data" (the existing experience)
5. For "landing":
   - active = null (no experience highlighted in switch)
6. Build switch segments:
   - Data segment: { label: "Data & tools", href: counterpart or data home, active: active === "data" }
   - Insights segment: { label: "Insights", href: counterpart or insights home, active: active === "insights" }
   - If counterpart exists in match, resolve params from current URL
7. Build menu: select Data or Insights menu definition based on active experience
8. Return ExperienceState
```

### ?view= parameter behavior

| Route type | ?view= present | ?view= absent |
|---|---|---|
| Data route | Ignored (path determines experience) | Data |
| Insights route | Ignored (path determines experience) | Insights |
| Shared route | Uses ?view= value | Defaults to "data" |
| Landing | Ignored | null (no experience) |

**Link propagation**: When rendering nav links to shared routes, the current experience is appended as `?view={active}`. This ensures that navigating from a Data page to `/faq` produces `/faq?view=data`, preserving the menu context.

---

## Menu definitions

### Data experience menu (T10 — extracted from current Layout.astro)

```typescript
const DATA_MENU: ExperienceMenu = {
  id: "data",
  label: "Data & scientific tools",
  home: "/data/kpis",
  items: [
    { label: "Home", href: "/" },
    { label: "Living Labs", subItems: [] },       // populated from API at runtime
    {
      label: "Data",
      subItems: [
        { href: "/data/measures", label: "Policy measures" },
        { href: "/data/kpis", label: "KPIs" },
        { href: "/data/modal-split", label: "Modal split" },
        { href: "/data/collection-plan", label: "Data collection process" },
      ],
    },
    {
      label: "Tools",
      subItems: [
        { href: "/tools/impact_analysis", label: "Impact analysis" },
        { href: "/tools/mcda_analysis/", label: "Multi-criteria decision tool" },
      ],
    },
    { href: "/tools/resources", label: "Resources" },
  ],
};
```

This is exactly today's `menuItems` array — no behavior change for existing Data pages.

### Insights experience menu (T12)

```typescript
const INSIGHTS_MENU: ExperienceMenu = {
  id: "insights",
  label: "Insights",
  home: "/insights",                              // placeholder until Epic 8
  items: [
    { label: "Home", href: "/" },
    { href: "/insights/goals", label: "What works" },          // Epic 8
    { href: "/insights/cities", label: "Cities" },             // Epic 9
    { href: "/insights/plan", label: "Plan for my city" },     // Epic 10
    { href: "/insights/resources", label: "Join & resources" },// content TBD
  ],
};
```

**Note:** Insights menu items initially point to routes that don't exist yet. Later epics (8, 9, 10) will create these pages. Until then, these are placeholder hrefs — the menu renders, but clicking leads to 404. This is acceptable: Epic 6 establishes the **shell**, not the content.

---

## File changes

### New file: `src/lib/experiences/registry.ts`

**Purpose:** Single source of truth for route ownership, counterpart mapping, and menu definitions.

Contents:
1. Type definitions (`ExperienceId`, `RouteEntry`, `ExperienceMenu`, `ExperienceState`)
2. `ROUTES` array — route ownership table
3. `DATA_MENU` and `INSIGHTS_MENU` definitions
4. `resolveExperience(pathname, searchParams)` — the resolution function
5. `buildCounterpartUrl(currentPath, match)` — extract params from current path and inject into counterpart pattern
6. `appendViewParam(href, experience)` — append `?view=` to shared route links

Exported API:
```typescript
export type { ExperienceId, ExperienceState };
export { resolveExperience };
```

### New file: `src/components/react/ui/ExperienceSwitch.tsx`

**Purpose:** Segmented control rendered in the navbar header area.

Props:
```typescript
interface ExperienceSwitchProps {
  segments: { label: string; href: string; active: boolean }[];
}
```

Renders two pill-shaped buttons side by side:
- Active segment: filled `bg-primary text-white`
- Inactive segment: `border border-primary text-primary` with hover state
- Each segment is an `<a>` tag (full-page navigation, no client-side routing needed)
- On the landing page, neither segment is active (both outlined)

Dimensions: compact, sits between the logo and the menu items in the navbar. On mobile sidebar, renders as a horizontal pair above the menu items.

### Modified: `src/layouts/Layout.astro`

**Current state:** Hardcoded `menuItems` array in frontmatter. Passes it to `SiteNavBar`.

**Changes:**

1. Import `resolveExperience` from `src/lib/experiences/registry.ts`
2. Call `resolveExperience(Astro.url.pathname, Astro.url.searchParams)` in frontmatter
3. Inject dynamic Living Labs into the resolved menu (same API call that exists today)
4. Pass `experienceState` to `SiteNavBar` instead of hardcoded `menuItems`
5. Pass `experienceState` to `Footer` for the cross-link

**What gets removed:**
- The hardcoded `menuItems` array (moved to `registry.ts` as `DATA_MENU`)
- The manual Living Labs menu item construction stays but moves into a helper

**What stays the same:**
- The role-based rendering (`visitor` vs `editor`/`admin`)
- The `SidebarMenu` branch — unaffected, no experience mechanism
- The API call for living labs
- The breadcrumb/backHref props

```astro
---
// ... existing imports ...
import { resolveExperience, type ExperienceState } from "../lib/experiences/registry";

// ... existing API calls ...

// Resolve experience from current URL
const experienceState = resolveExperience(
  Astro.url.pathname,
  Astro.url.searchParams,
  labsItems,     // inject dynamic Living Labs into menu
);
---

<!-- visitor layout -->
<SiteNavBar
  menuItems={experienceState.menu}
  experience={experienceState}
  userInfo={userInfo}
  currentLivingLab={currentLivingLab}
  client:load
>
  ...
</SiteNavBar>

<Footer sections={footerMenuItems} experience={experienceState} />
```

### Modified: `src/components/react/ui/SiteNavBar.tsx`

**Changes:**

1. Accept new `experience` prop of type `ExperienceState`
2. Render `ExperienceSwitch` component in the navbar between logo and menu items
3. In the mobile sidebar, render `ExperienceSwitch` above the menu sections

**What stays the same:**
- The `MenuItem` interface and rendering logic
- The Catalyst UI Kit usage (`Navbar`, `Dropdown`, `StackedLayout`, etc.)
- The user menu / Manage Labs dropdown
- The login button logic

```tsx
interface Props {
  menuItems?: MenuItem[];
  experience?: ExperienceState;     // new
  children?: React.ReactNode;
  userInfo?: { name: string; email: string; avatar?: string };
  currentLivingLab?: SessionLivingLabCookie;
}

// In the navbar:
<Navbar className="flex flex-row w-full min-w-0 flex-1">
  <BrandLogo className="mx-4" />
  {experience && <ExperienceSwitch segments={experience.switchSegments} />}
  <NavbarSpacer />
  {/* existing menu items rendering ... */}
</Navbar>
```

### Modified: `src/components/Footer.astro`

**Changes:**

1. Accept optional `experience` prop
2. When active experience is "insights", render a cross-link section:
   `"Explore Data & scientific tools"` linking to Data home (`/data/kpis`)
3. When active experience is "data" (or null), no cross-link needed (existing footer links already cover Data navigation)

The cross-link is a simple addition — a styled link row above the existing footer sections. Not a structural change.

---

## What does NOT change

| Item | Why |
|---|---|
| Route file paths (`src/pages/**`) | G2: No page is deleted or moved |
| Page content and data fetching | G3: Existing pages are not rebuilt |
| `SidebarMenu.tsx` | Lab-admin uses a separate nav; no experience mechanism |
| API routes (`src/pages/api/**`) | G4: Backend out of scope |
| Authentication flow | Out of scope |
| Footer structure/content | Only adds cross-link; sections stay the same |

---

## Sequence: T10 then T12

### T10 — Experience mechanism (implement first)

1. Create `src/lib/experiences/registry.ts` with types, route table, Data menu, and `resolveExperience()`
2. Create `src/components/react/ui/ExperienceSwitch.tsx`
3. Modify `Layout.astro` to use `resolveExperience()` and pass state to `SiteNavBar`
4. Modify `SiteNavBar.tsx` to accept `experience` prop and render `ExperienceSwitch`
5. Verify: every existing public route renders the same menu as before (Data menu)

**Verification checkpoint**: After T10, all existing pages work identically. The segmented control appears but only the Data segment is active. The Insights segment links to the Insights home (placeholder).

### T12 — Insights menu and experience shell (implement second)

1. Add Insights menu definition to registry (`INSIGHTS_MENU`)
2. Add Insights route entries to the route table (placeholders for T13-T18)
3. Wire `resolveExperience()` to return the Insights menu when on an Insights route
4. Add footer cross-link logic to `Footer.astro`
5. Verify: navigating to an Insights route shows the Insights menu; switch marks Insights as active

---

## Testing strategy

### Manual verification (per PR checklist in epic.md)

Navigate every public route and verify:

| Check | How |
|---|---|
| Menu state | Each Data route shows the Data menu; shared routes show menu matching `?view=` |
| Switch marking | Segmented control highlights the correct experience on every page |
| Counterpart navigation | `/living-lab-city/5` switch goes to `/insights/city/5` (once route exists) |
| ?view= reproducibility | `/faq?view=data` and `/faq?view=insights` render different menus |
| Direct landing | Opening any route directly (no prior state) renders a coherent menu |
| Cross-link | Footer shows "Explore Data & scientific tools" on Insights routes |
| No path changes | All existing URLs resolve to the same content as before |

### Unit tests for registry

```typescript
// src/lib/experiences/registry.test.ts
describe("resolveExperience", () => {
  it("resolves /data/kpis to data experience", () => { ... });
  it("resolves /faq to shared, defaults to data without ?view=", () => { ... });
  it("resolves /faq?view=insights to insights experience", () => { ... });
  it("resolves / to landing (active = null)", () => { ... });
  it("resolves /living-lab-city/5 with counterpart /insights/city/5", () => { ... });
  it("resolves unknown route to landing by default", () => { ... });
  it("injects living lab items into Data menu", () => { ... });
});
```

---

## File change summary

| File | Change | Task |
|---|---|---|
| `src/lib/experiences/registry.ts` | **New** — route table, menus, resolution logic | T10 |
| `src/components/react/ui/ExperienceSwitch.tsx` | **New** — segmented control component | T10 |
| `src/components/react/ui/index.ts` | **Modify** — export ExperienceSwitch | T10 |
| `src/layouts/Layout.astro` | **Modify** — use resolveExperience, pass state | T10 |
| `src/components/react/ui/SiteNavBar.tsx` | **Modify** — accept experience prop, render switch | T10 |
| `src/components/Footer.astro` | **Modify** — add cross-link for Insights | T12 |
| `src/lib/experiences/registry.ts` | **Modify** — add Insights menu and routes | T12 |
| `src/lib/experiences/registry.test.ts` | **New** — unit tests for resolution logic | T10+T12 |

Total: **3 new files**, **4 modified files**. One PR covering both T10 and T12.

---

## Downstream impact

Epic 6 is the foundation for all Wave B, C, and D epics. Here's how they interact:

| Epic | How it uses the experience mechanism |
|---|---|
| 7 (Landing & Onboarding) | May update landing page to introduce both experiences |
| 8 (Insights Goals) | Adds routes to `ROUTES` table and fleshes out Insights menu `href`s |
| 9 (Insights Cities) | Adds `/insights/city/[labId]` implementation; counterpart pair becomes functional |
| 10 (Guided Tool) | Adds route + menu item to Insights menu |
| 11 (Data Console) | Adds routes to Data menu |
| 12 (Methods & MCDA) | Adds routes to Data menu |

Each downstream epic only needs to:
1. Add entries to `ROUTES` in `registry.ts`
2. Update the relevant menu's `items` array
3. Create the actual page files

No architectural changes required.
