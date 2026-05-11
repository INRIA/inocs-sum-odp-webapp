# SUM Open Data Platform — Copilot Instructions

## Project Overview

This is the **SUM Open Data Platform** (ODP) webapp — an Astro 5 SSR application that collects, monitors, and publishes shared mobility policy data from European living-lab cities participating in the [SUM project](https://www.sum-project.eu/). Cities submit policy measures and KPI results; the public can browse and analyse the aggregated data.

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 5 SSR (`output: "server"`) + `@astrojs/node` standalone adapter |
| Client interactivity | React 19 islands via `@astrojs/react` |
| Styling | Tailwind CSS v4 (Vite plugin, **not** the PostCSS plugin) |
| ORM | Prisma 6 |
| Database | MySQL (`mysql2`) |
| Auth | `auth-astro` with credentials provider + JWT sessions + `bcrypt` |
| Charts | Chart.js + `react-chartjs-2`, D3.js |
| Maps | Leaflet + `react-leaflet` |
| Animation | Motion (Framer Motion v12) |
| UI primitives | Headless UI v2, Heroicons v2, Catalyst UI kit (local copy) |
| Testing | Vitest 4, happy-dom, `@testing-library/react`, `@testing-library/user-event` |

## Architecture

```
src/
├── middleware.ts          # Auth guard (protects /lab-admin/**) + rate limiter
├── pages/
│   ├── index.astro        # Public landing page
│   ├── data/              # Public data browsing pages
│   ├── tools/             # Analysis tools (MCDA, etc.)
│   ├── lab-admin/         # Protected: living-lab contributor dashboard
│   │   ├── login.astro / signup.astro
│   │   ├── kpis.astro / measures.astro / modal-split.astro
│   │   └── analytics.astro
│   └── api/v1/            # REST API endpoints (Astro API routes)
├── bff/                   # Backend-for-Frontend
│   ├── db/                # Prisma client singleton
│   ├── repositories/      # One file per Prisma model (data access only)
│   ├── services/          # Business logic (calls repositories)
│   ├── controllers/       # Request/response shaping (called by API routes)
│   └── index.ts           # Central re-export
├── components/
│   ├── react/             # React island components (client-interactive)
│   │   ├── KPIsDashboard/ / Analytics/ / ImpactAnalysis/ / MCDAAnalysis/
│   │   ├── form/          # Form components
│   │   └── ui/            # Generic UI primitives
│   ├── react-catalyst-ui-kit/  # Local Catalyst component library
│   └── *.astro            # Static/server-rendered Astro components
├── layouts/               # Astro layout wrappers
├── types/                 # Shared TypeScript interfaces (`IKpi`, `ILab`, etc.)
└── lib/
    ├── api-client/        # Fetch wrappers for client-side API calls
    ├── helpers/
    └── utils/
```

## Domain Model

| Entity | Prisma model | Description |
|---|---|---|
| Living Lab | `labs` | A participating European city |
| KPI Definition | `kpidefinitions` | KPI template with parent/child hierarchy |
| KPI Result | `kpiresults` | A measurement value for a lab + KPI + date |
| Policy Measure | `items` | A document/measure linked to a lab and KPI |
| Project | `projects` | EU project (e.g., SUM) |
| Category | `categories` | Classification for KPIs |
| Transport Mode | `transport_mode` | Mode referenced by KPI results |
| User | `users` | Lab representative or admin (credentials auth) |

## Key Conventions

### Astro SSR vs React Islands — hard boundary
- **Astro pages** handle: routing and server-side data fetching, access control, page composition, and passing serialised data as props to islands.
- **React islands** handle: interactive UI, client-side state, user input, and chart/map rendering.
- Never fetch data from Prisma inside a React component. Fetch in the Astro page, pass props down to the island.

### BFF layer (always use this for DB access)
All database access goes through `src/bff/`. Follow the pattern:

```
API route (.ts) → Controller → Service → Repository → Prisma
```

Never import `prisma` directly into pages or React components. Always go through a service.

### TypeScript — strict mode is mandatory
`tsconfig.json` has `strict: true`. Do not use `any` without a comment justification. All public interfaces must be typed. Type exports live in `src/types/`.

### Testing — TDD, tests first
- Write failing tests **before** implementation (Red → Green → Refactor).
- Every new feature needs a dedicated test file.
- Use `vitest` with `happy-dom` environment.
- React component tests use `@testing-library/react` + `@testing-library/user-event`.
- API/service tests mock the repository layer or use a test DB.
- Test files co-locate with source: `foo.service.test.ts` next to `foo.service.ts`.

### Auth
- Session provided by `auth-astro`. Access via `getSession(request)` in Astro pages/API routes.
- `context.locals.user` is set by middleware for all server-rendered pages.
- `/lab-admin/**` routes require authentication (enforced in `middleware.ts`).

### Rate limiting
- `rateLimiterController` is applied site-wide in middleware. It is a token-bucket limiter — do not bypass it in new API routes.

### Tailwind CSS v4
- Use the Vite plugin (`@tailwindcss/vite`), **not** `postcss`. Config is in `astro.config.mjs`.
- No separate `tailwind.config.js` file — use CSS `@theme` blocks if you need to extend the theme.

### API routes
- Live under `src/pages/api/v1/`. Use Astro's `APIRoute` type for handlers.
- Return JSON via `new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })`.
- Always validate input at the API boundary before passing to services.

## Common Commands

```bash
npm run dev           # Start dev server at localhost:4321
npm run build         # Production build
npm run preview       # Preview the production build
npm run test          # Vitest in watch mode
npm run test:run      # Run all tests once
npm run test:coverage # Coverage report
npm run db:migrate    # Prisma migrate dev (add new migration)
npm run db:generate   # Regenerate Prisma client after schema change
npm run db:studio     # Open Prisma Studio GUI
npm run db:push       # Push schema to DB without migration (dev only)
```

## Environment Variables

Minimum required for local dev (`.env`):

```
DATABASE_URL="mysql://user:password@localhost:3306/odp"
AUTH_SECRET="<random-secret>"
AUTH_TRUST_HOST=true
ODP_ADMIN_HOST_PUBLIC="http://localhost:4321"
```

SMTP / admin email notification variables (all optional in dev — emails log to console when `SMTP_HOST` is unset):

```
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE="false"           # "true" for implicit TLS / port 465
SMTP_USER="user@example.com"
SMTP_PASSWORD="secret"
SMTP_FROM="noreply@sum-odp.eu"
ADMIN_EMAILS="admin@example.com"   # comma-separated list
```

See `.env.example` for the full list including rate-limiter and job-run variables.


## Pitfalls

- **Astro + React hydration**: always pass serialisable props to React islands. Do not pass class instances, `Date` objects, or Prisma model instances directly — convert to plain objects first.
- **Prisma BigInt serialisation**: Prisma returns `BigInt` for `@db.UnsignedBigInt` columns. JSON.stringify will throw on BigInt. Convert with `.toString()` or `Number()` before responding.
- **`mysql2` vs PostgreSQL**: the DB is MySQL. Ignore references to PostgreSQL in older docs/constitution — the actual `schema.prisma` uses `provider = "mysql"`.
- **KPI parent/child hierarchy**: `kpidefinitions` has a self-referencing `parent_kpi_id`. Always check whether you need top-level or child KPIs for a given query.
- **Tailwind v4**: class names and theme extension syntax differ from v3. Do not Google Tailwind v3 docs for config — use the v4 docs.

