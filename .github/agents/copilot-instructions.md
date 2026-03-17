# inocs-sum-odp-frontend Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies
- TypeScript 5 (strict), Node.js 20, React 18 + Astro 4 (SSR), Prisma Client (MySQL), React 18, D3.js v7, `@testing-library/react`, Vitest (002-admin-analytics-dashboard)
- MySQL (via Prisma) — *note: constitution names PostgreSQL but production schema is MySQL; see compliance note below* (002-admin-analytics-dashboard)

- **Language**: TypeScript 5.x, strict mode — no `any`, no `@ts-ignore`, no weakening of tsconfig
- **Frontend framework**: Astro 4 (SSR) + React 18 islands
- **Styling**: Tailwind CSS + Catalyst UI Kit (no new UI libraries)
- **Data layer**: Prisma 5 + PostgreSQL — all DB access via Prisma in `src/bff/`; no raw SQL
- **Testing**: Vitest 2 + `@testing-library/react` + `@testing-library/user-event` + happy-dom
- **HTTP client**: `ApiClient` class at `src/lib/api-client/ApiClient.ts` (wraps fetch)

## Project Structure

```text
src/
├── bff/repositories/labs.repository.ts    # mapPrismaLabToLab — returns IKpiResultGroup[]
├── components/react/form/                  # Editable form components (React islands)
├── pages/lab-admin/                        # Admin pages (SSR, role=editor)
├── pages/data/                             # Public display pages (do NOT modify for this feature)
└── types/
    ├── KPIs.ts          # IKpi, IKpiResult, IKpiResultInput, IIKpiResultBeforeAfter, IKpiResultGroup
    └── LivingLab.ts     # ILivingLabPopulated — kpi_results: IKpiResultGroup[]
tests/
```

## Active Feature: 001-kpi-multi-value-input

### New files (tests first — must exist and fail BEFORE implementation files)
- `src/components/react/form/KpiResultList.test.tsx`
- `src/components/react/form/DefaultCollectionDate.test.tsx`
- `src/components/react/form/KpiResultList.tsx`
- `src/components/react/form/KpiResultRow.tsx`
- `src/components/react/form/KpiNewEntryRow.tsx`
- `src/components/react/form/DefaultCollectionDate.tsx`

### Files to modify
- `src/types/KPIs.ts` — add `IKpiResultGroup extends IIKpiResultBeforeAfter` with `results: IKpiResult[]`
- `src/types/LivingLab.ts` — change `kpi_results` to `IKpiResultGroup[]`
- `src/bff/repositories/labs.repository.ts` — add `results: groupedResults` in `mapPrismaLabToLab`
- `src/components/react/LivingLabKPIsEdition.tsx` — replace BeforeAndAfterDates + LivingLabKpiResultsForm
- `src/components/react/LivingLabModalSplit.tsx` — replace BeforeAndAfterDates + LivingLabKpiResultsForm
- `src/pages/lab-admin/kpis.astro` — remove valueBeforeDate/valueAfterDate props
- `src/pages/lab-admin/modal-split.astro` — remove valueBeforeDate/valueAfterDate props

### Key design decisions
- `IKpiResultGroup extends IIKpiResultBeforeAfter` + `results: IKpiResult[]` — keeps result_before/result_after for backward compat with display pages
- Default date: pass as prop; `useState(defaultDate || todayISO())` at mount in KpiNewEntryRow; `useEffect([defaultDate])` ONLY for unsaved (id-less) rows — do NOT copy the LivingLabKpiResultForm bug that patches saved entries
- Per-row edit state is local to KpiResultRow (multiple useState); parent owns entries array only
- Keys: stable numeric DB id; `"new"` sentinel for open add-row
- No new npm packages; no DB schema change; no new API endpoints

## Commands

## Code Style

- TypeScript strict throughout; no `any`; explicit return types on exported functions
- Named React component exports (not default) except where existing code uses default
- Test mocking: `vi.hoisted` + `vi.mock` factory for ApiClient (see `LivingLabForm.test.tsx`)
- Use `userEvent.setup()` for interactions; `waitFor` for async assertions
- Tailwind + Catalyst UI Kit only for styling

## Recent Changes
- 002-admin-analytics-dashboard: Added TypeScript 5 (strict), Node.js 20, React 18 + Astro 4 (SSR), Prisma Client (MySQL), React 18, D3.js v7, `@testing-library/react`, Vitest
- 002-admin-analytics-dashboard: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
- 001-csv-download: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
