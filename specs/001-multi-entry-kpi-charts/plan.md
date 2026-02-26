# Implementation Plan: Public Multi-Entry KPI Charts

**Branch**: `001-multi-entry-kpi-charts` | **Date**: 2026-02-26 | **Spec**: `/specs/001-multi-entry-kpi-charts/spec.md`
**Input**: Feature specification from `/specs/001-multi-entry-kpi-charts/spec.md`

## Summary

Replace hardcoded before/after KPI chart data assumptions in public data pages with a multi-entry timeline model based on `IKpiResultGroup.results[]` (already sorted oldest→newest), while preserving existing chart interactions/tooltips and adding retrocompatibility mapping so unchanged consumers do not break during deprecation.

## Technical Context

**Language/Version**: TypeScript (Astro strict preset) + React 19 islands  
**Primary Dependencies**: Astro 5, React 19, D3 7, Chart.js 4, react-chartjs-2, Tailwind 4  
**Storage**: PostgreSQL via Prisma (existing backend data source; no DB changes in this feature)  
**Testing**: Vitest 4, `@testing-library/react`, `@testing-library/user-event`  
**Target Platform**: Astro SSR web app with client React islands (public pages)  
**Project Type**: Web application (SSR + React component islands)  
**Performance Goals**: Keep current perceived chart rendering behavior for public pages; no additional client interaction cost beyond extra points  
**Constraints**: Front-end only; do not modify backend service; keep existing chart behavior/tooltips/interactions unchanged; preserve retrocompatibility during before/after deprecation  
**Scale/Scope**: Public KPI data pages and dependent chart helpers/components only, primarily:
- `src/pages/data/kpis.astro`
- `src/pages/data/modal-split.astro`
- `src/pages/living-lab-city/[labId].astro`
- `src/components/react/KPIsDashboard/*`
- `src/components/react/KpiCards/*`
- `src/lib/helpers/living-lab.ts`
- `src/types/*`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Tests-first plan exists for all new behavior (Red → Green → Refactor documented).
- [x] A new test file per new feature is listed as acceptance criteria.
- [x] Test scope includes happy path, user interactions, displayed information, and edge cases.
- [x] Astro SSR responsibilities are separated from React island interactivity.
- [x] Data layer uses Prisma + PostgreSQL only (no raw SQL in application code, no other DBs).
- [x] TypeScript strict mode remains enabled with no weakening changes.
- [x] Test implementation uses Vitest + `@testing-library/react`.

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-entry-kpi-charts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── public-kpi-data-contract.md
│   └── modal-split-series-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── pages/
│   ├── data/
│   │   ├── kpis.astro
│   │   └── modal-split.astro
│   └── living-lab-city/
│       └── [labId].astro
├── components/react/
│   ├── KPIsDashboard/
│   └── KpiCards/
├── lib/helpers/
│   └── living-lab.ts
└── types/
    ├── KPIs.ts
    └── LivingLab.ts
```

**Structure Decision**: Single Astro webapp structure. Changes remain in SSR page data shaping, shared helpers, and React island chart components/tests. No backend repository or Prisma schema change is included.

## Phase 0: Research

Research outputs are captured in `research.md` and resolve migration approach, modal split multi-entry modeling, and test/coverage strategy for this feature.

## Phase 1: Design & Contracts

Design outputs are captured in:
- `data-model.md`
- `contracts/public-kpi-data-contract.md`
- `contracts/modal-split-series-contract.md`
- `quickstart.md`

## Post-Design Constitution Check

- [x] Tests-first sequence defined (write failing tests before refactor/implementation).
- [x] New dedicated test file planned for this feature.
- [x] Test matrix includes happy path, interactions, displayed information, edge cases.
- [x] SSR-to-island boundaries preserved (Astro pages shape data, React renders charts).
- [x] No data-layer divergence (front-end only; Prisma/PostgreSQL remains only persistent layer).
- [x] TypeScript strictness preserved.
- [x] Vitest + Testing Library stack retained.

## Complexity Tracking

No constitution violations or justified exceptions required.
