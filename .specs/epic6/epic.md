# Epic 6: Experience Architecture & Shell

**Tasks:** T10 (M) → T12 (S) — sequential
**Wave:** B
**Total effort:** M + S
**Dependencies:** None — start immediately (Version C confirmed)

---

## Scope

The infrastructure epic. Establishes the dual-experience mechanism that all Wave B, C, and D work depends on. **No route changes path** as a result of this epic.

### T10 — Experience mechanism (first)

- Every public route declares which experience it belongs to (Data, Insights, or Shared)
- Arriving at a route sets the active experience and renders that experience's menu
- Segmented control switch in the header on every page — names both experiences, marks the active one
- Switch navigates to the counterpart route where one is defined, or to the other experience's home where none is
- Experience expressible in URL (`?view=…`) for reproducible links and screenshots (D1.4)
- Shared surfaces (Resources, FAQ, legal, add-your-city, login) keep whichever menu the visitor arrived with
- Counterpart mapping is **data-driven** — not hard-coded conditionals scattered through components

**Route ownership table:**

| Route | Experience |
|---|---|
| `/` | Landing — neither |
| `/data/kpis`, `/data/modal-split`, `/data/measures` | Data |
| `/tools/impact_analysis` | Data |
| `/tools/mcda_analysis/*` | Data |
| `/living-lab-city/[labId]` | Data (full series) |
| `/data/collection-plan` | Data (Methods) |
| `/insights/city/[labId]` | Insights |
| New Insights routes (T13–T18) | Insights |
| `/tools/resources/*`, `/faq`, `/legal-notice`, `/privacy-policy` | Shared |

### T12 — Insights menu and experience shell (second)

- Menu items: **What works · Cities · Plan for my city · Join & resources**
- No sub-menus deeper than one level
- Footer carries persistent cross-link to Data & scientific tools
- Menu renders on every Insights route; no item leads to a Data-experience route without the switch changing state

## Affected files

- `src/layouts/Layout.astro` (menu definitions, experience state)
- `src/components/react/ui/SiteNavBar.tsx` (switch control, dual menus)

## Acceptance criteria

- Every public route resolves to exactly one experience or is explicitly shared
- Landing on any route directly, with no prior state, renders a coherent menu
- Switch present and correctly marked on every public page
- No route changes path as a result of this epic
- Counterpart mapping is data, not scattered conditionals
- Insights menu renders on all Insights routes; cross-link present everywhere

## PR validation

One PR. Navigate every public route and verify menu state, switch marking, and counterpart navigation.
