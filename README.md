# SUM Open Data Platform

The **SUM Open Data Platform** (ODP) is a web application built to monitor, collect, and publish shared mobility policy data from European cities participating in the [SUM project](https://www.sum-project.eu/). Living-lab cities submit policy measures and Key Performance Indicators (KPIs); the public can then browse, compare, and analyse the aggregated data to inform future shared mobility policies.

## About

The platform supports the full lifecycle of policy data:

- **Living Lab contributors** log in to a protected admin dashboard to submit KPI results and policy measures for their city.
- **Researchers and city planners** can browse public data pages, explore KPI trends, compare cities on a map, and run multi-criteria decision analysis (MCDA) to evaluate shared mobility strategies.
- **Administrators** can manage labs, users, and validate submitted data.

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 5 SSR (`output: "server"`) + `@astrojs/node` standalone adapter |
| Client interactivity | React 19 islands via `@astrojs/react` |
| Styling | Tailwind CSS v4 (Vite plugin) |
| ORM | Prisma 6 |
| Database | MySQL (`mysql2`) |
| Auth | `auth-astro` — credentials provider, JWT sessions, `bcrypt` |
| Charts | Chart.js + `react-chartjs-2`, D3.js |
| Maps | Leaflet + `react-leaflet` |
| Animation | Motion (Framer Motion v12) |
| UI primitives | Headless UI v2, Heroicons v2, Catalyst UI kit (local copy) |
| Testing | Vitest 4, happy-dom, `@testing-library/react`, `@testing-library/user-event` |

## Project Structure

```
src/
├── middleware.ts          # Auth guard (/lab-admin/**) + rate limiter
├── pages/
│   ├── index.astro        # Public landing page
│   ├── data/              # Public data browsing pages
│   ├── tools/             # Analysis tools (MCDA, impact analysis)
│   ├── lab-admin/         # Protected living-lab contributor dashboard
│   └── api/v1/            # REST API endpoints (Astro API routes)
├── bff/                   # Backend-for-Frontend
│   ├── db/                # Prisma client singleton
│   ├── repositories/      # Data access layer (one file per Prisma model)
│   ├── services/          # Business logic
│   ├── controllers/       # Request/response shaping
│   └── index.ts           # Central re-export
├── components/
│   ├── react/             # React island components (charts, maps, forms)
│   ├── react-catalyst-ui-kit/  # Local Catalyst component library
│   └── *.astro            # Server-rendered Astro components
├── layouts/               # Astro layout wrappers
├── types/                 # Shared TypeScript interfaces
└── lib/
    ├── api-client/        # Fetch wrappers for client-side API calls
    ├── helpers/
    └── utils/
```

## Commands

All commands are run from the root of the project:

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run all tests once |
| `npm run test:coverage` | Generate coverage report |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:push` | Push schema to DB without migration (dev only) |

## Environment Variables

Minimum required for local development (`.env`):

```env
DATABASE_URL="mysql://user:password@localhost:3306/odp"
AUTH_SECRET="<random-secret>"
AUTH_TRUST_HOST=true
ODP_ADMIN_HOST_PUBLIC="http://localhost:4321"
```

## Engineering Constitution (Contributor Rules)

Project governance is defined in [`.specify/memory/constitution.md`](.specify/memory/constitution.md). Agent instructions for AI-assisted development are in [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

- **TDD/SDD**: write failing tests first, then implement. Every new feature must add at least one new test file.
- **Astro SSR + React islands boundary**: Astro pages handle routing and server-side data fetching; React islands handle interactive UI only. Never fetch from Prisma inside a React component.
- **BFF pattern**: all DB access goes through `src/bff/` — `API route → Controller → Service → Repository → Prisma`.
- **TypeScript strict mode**: `strict: true` must remain enabled. No untyped escape hatches.
- **MySQL via Prisma**: the only approved data layer. No raw SQL in application code.
- **Testing stack**: Vitest + `@testing-library/react` for all component and API behaviour tests.
