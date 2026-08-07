# Project Kernel — SUM Open Data Platform Frontend

## Identity
- **SUM ODP webapp** — Horizon Europe funded, INRIA WP5/T5.1. EU deliverables and PO review milestones apply.
- Three-service platform (this frontend, Laravel admin back-office, FastAPI impact API) — all owned by the same developer.
- Single MySQL database shared across all three services — schema changes affect all.
- Under 10 living labs (European cities) currently active; platform is in growth phase.

## Commands
- Dev: `npm run dev` (port 4321)
- Build: `npm run build`
- Test: `npm run test` (vitest, watch mode) — `npm run test:run` for single pass
- Coverage: `npm run test:coverage`
- DB migrate: `npm run db:migrate` — DB generate: `npm run db:generate` — DB studio: `npm run db:studio`

## Conventions that differ from defaults
- **Astro SSR + React islands — hard boundary.** Never fetch data from Prisma inside React. Fetch in Astro page, pass serialized props.
- **BFF pattern mandatory:** `API route → Controller → Service → Repository → Prisma` — never import prisma directly.
- **Prisma BigInt:** MySQL uses `@db.UnsignedBigInt` — `JSON.stringify` throws on BigInt. Always convert with `.toString()` or `Number()`.
- **Tailwind CSS v4** via Vite plugin (`@tailwindcss/vite`), NOT PostCSS. No `tailwind.config.js` — use CSS `@theme` blocks.
- **TDD-first:** write failing test before implementation. Every feature needs a test file.
- **Catalyst UI kit** (`src/components/react-catalyst-ui-kit/`) is a local vendored copy of Headless UI components — treat as read-only reference, extend via composition not modification.
- **TypeScript strict mode** — no `any` without justification. Types in `src/types/`.

## Landmines
- `docs/` contains legacy static HTML output, not project documentation — do not treat as a documentation directory.
- The admin back-office is a separate Laravel app at `odp-admin.*` — cross-service user creation uses a shared `USER_CREATION_API_KEY`.
- Impact analysis API is internal-network only (FastAPI) — called via `JOB_RUN_IMPACT_ASSESS_ROUTE` env var.
- Rate limiter is in-memory (token-bucket) — resets on server restart. MCDA jobs have a separate, stricter limiter (3 req/min, 5 min block).
- Auth uses `auth-astro` + credentials provider + JWT (24h). Middleware protects `/lab-admin/**` routes.
- KPI definitions have a self-referencing `parent_kpi_id` hierarchy — always check if you need top-level or child KPIs.

## Current roadmap
- **V2 redesign driven by EU PO review feedback** — 22 tasks across 4 waves (see `.specs/roadmap_review.md`).
- **Wave A (corrections):** T01–T09. Version-independent bug fixes and display rules. Can ship immediately.
- **Wave B (experience split):** T10–T13. Two-experience architecture (Decision-maker Insights / Data & scientific tools) behind a switch. Requires consortium confirmation of Version C.
- **Wave C (Insights pages):** T14–T18. Curated decision-maker surface. Depends on Wave B.
- **Wave D (Data pages):** T19–T22. Coverage matrix, downloads, methods section. Mostly version-independent.
- **Minimum credible PO response:** Wave A alone answers 11/16 PO comments.
- **Blocking decisions** from consortium pending: Version C confirmation, curator role naming, terminology, goal→KPI mapping, evidence-strength thresholds.

## Deployment
- Docker multi-stage build → GitLab Container Registry (`registry.gitlab.inria.fr/inocs-lab/...`)
- Production on CapRover (INRIA infrastructure) at `odp.sum-project.eu`
- CI/CD: GitHub Actions, manual dispatch only
