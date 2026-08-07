# Epic 7: Landing & Onboarding Pages

**Tasks:** T11 (M) → T18 (S) — T11 first, then T18
**Wave:** B
**Total effort:** M + S
**Dependencies:** After **Epic 5** (T11 needs T09 counters) and **Epic 6** (both need the experience mechanism)

---

## Scope

### T11 — Main landing homepage (first)

Rework `src/pages/index.astro` into the shared landing page (belongs to neither experience).

Blocks in order:
1. Hero — states what a visitor can do
2. **Two experience doors** — primary content; each names its audience and three entry pages
3. **Trust strip** — T09 counters + last update + named curator (placeholder OK)
4. Map teaser — links to city catalogue
5. Add-your-city
6. Shared footer strip

Changes from current homepage:
- Current 6-tile "Platform features" grid → replaced by two doors
- Mobility-types illustration → hero decoration, not a standalone section
- No content is lost — each block is retained, merged, or re-homed; spec must state where

Reference: `ODP_V3_homepage_sketch.html` screen ①

### T18 — Join & resources (second, needs T11)

New page composed from:
- Contribution steps — inventory from current `src/pages/index.astro`
- Resources library entry
- FAQ entry point

Reachable from both experiences.

## Acceptance criteria

- Two doors are the largest element below the hero; each names its audience and three entry pages
- Trust strip shows six labelled figures and a named curating role (placeholder OK)
- Every piece of current homepage content is accounted for (retained, merged, or re-homed)
- Join & resources is reachable from both experiences

## PR validation

One PR. Visual review of homepage and join page. Confirm no content lost from current `src/pages/index.astro`.
