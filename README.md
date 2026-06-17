# SUM Open Data Platform

The **SUM Open Data Platform** (ODP) is a web application to monitor, collect, and publish shared mobility policy data from European cities in the [SUM project](https://www.sum-project.eu/). Living-lab cities submit policy measures and Key Performance Indicators (KPIs); the public can browse, compare, and analyse the aggregated data.

- **Living Lab contributors** log in to a protected dashboard to submit KPI results and policy measures for their city.
- **Researchers / city planners / visitors ** browse public data, explore KPI trends, compare cities on a map, and run multi-criteria decision analysis (MCDA).
- **Administrators** manage labs, users, and validate submitted data.

**Stack:** Astro 5 SSR (`@astrojs/node`) · React 19 islands · Tailwind CSS v4 · Prisma 6 + MySQL · `auth-astro` (credentials + JWT) · Chart.js / D3 · Leaflet · Vitest.

> **This repository is one of three components** that make up the production platform — see [The production platform](#the-production-platform) below.

---

## The production platform

The live product, **[odp.sum-project.eu](https://odp.sum-project.eu)**, is built from three coupled web services that share a single MySQL database and run as containers on one managed server.

| Component | Repository | Owner | Role |
| :--- | :--- | :--- | :--- |
| **Public website + Living Lab editor space** *(this repo)* | [INRIA/inocs-sum-odp-webapp](https://github.com/INRIA/inocs-sum-odp-webapp) | INRIA | Public consultation surface and the authenticated space where Living Lab cities submit measures and KPI results. Served at `odp.sum-project.eu`. |
| **Administration back-office** | [SUM-project/SUM-Open-data-Platform](https://github.com/SUM-project/SUM-Open-data-Platform) | UTwente | Editorial / moderation back-office used by consortium administrators. Served at `odp-admin.sum-project.eu`. |
| **Impact analysis API** | [INRIA/sum-impact-assessment-models](https://github.com/INRIA/sum-impact-assessment-models) | INRIA | Runs the data analysis powering the platform's decision tools (MCDA / impact assessment). Internal network service — not publicly reachable. |

All three components read from and write to the **shared MySQL database**, which is the single source of truth for labs, measures, KPI definitions, KPI results, users, messages and impact-analysis results. The two front-facing components additionally call the Impact analysis API over an internal HTTP interface to trigger and read analysis jobs.

The platform has one external dependency: the **Eurostat GISCO** geocoding service, queried server-side by this webapp to autocomplete a Living Lab's city, country and coordinates (the editor's browser never reaches GISCO directly).

```mermaid
graph TB
    subgraph external["External users"]
        public["Public visitors<br/>(researchers, cities, mobility providers)"]
        ll["Living Lab editors<br/>(European cities)"]
        admins["SUM ODP administrators<br/>(consortium moderators)"]
    end

    subgraph platform["SUM Open Data Platform"]
        subgraph inria["INRIA-owned components"]
            frontend["Public website with <br/>lab editor space <br/>odp.sum-project.eu"]
            impact["Impact analysis API<br/>(Internal network service)"]
        end

        subgraph utwente["UTwente-owned component"]
            admin["Administration back-office<br/>odp-admin.sum-project.eu"]
        end

        db[("Shared MySQL database<br/>")]
    end

    gisco["Eurostat GISCO<br/>geocoding service<br/>gisco-services.ec.europa.eu"]

    public ==>|HTTPS| frontend
    ll ==>|HTTPS, authenticated| frontend
    admins ==>|HTTPS, authenticated| admin

    frontend <--> db
    admin <--> db
    impact <--> db

    frontend -.intranet.-> impact
    admin -.intranet.-> impact

    frontend -.Public internet.-> gisco
```

---

## Prerequisites

- **Node.js 20+** (the production image uses Node 20)
- **MySQL 8** running locally (or reachable via `DATABASE_URL`)
- **npm**


---

## Getting started (local development)

The platform is several services sharing **one MySQL database** (see [The production platform](#the-production-platform)). There are two ways to run it locally — both load the same baseline data once:

- **Option A — Full stack in Docker.** Fastest path to a complete, working environment (this app + admin + impact API + DB), straight from the published images.
- **Option B — Run this app from the command line.** Run the *dependencies* in Docker and the webapp from source (with hot reload), for active development on this repository.

> **You need:** Docker + Docker Compose (both options), and Node.js 20+ with npm (Option B only).

All commands below are run from the repository root.

### Option A — Full stack with Docker Compose

1. **Set your secrets.** Open [`docker-compose.yml`](docker-compose.yml) and replace every value marked `# << CHANGE >>` (DB password, `AUTH_SECRET`, and the shared API keys — the comments explain which keys must match across services).

2. **Pull and start** all four services:

   ```bash
   docker compose pull
   docker compose up -d
   ```

   | Service | URL |
   | :--- | :--- |
   | webapp (this repo) | <http://localhost:4321> |
   | admin back-office | <http://localhost:8000> |
   | impact analysis API | internal only (not published) |
   | MySQL database | `localhost:3306` |

3. **Load baseline data** — see [Load baseline data](#load-baseline-data) below.

4. Open <http://localhost:4321>. Create a login with [Create your admin account](#create-your-admin-account).

### Option B — Run this app from the command line

Run the other services in Docker, and this webapp from source:

1. **Start the dependencies only** (DB, admin, impact API):

   ```bash
   docker compose up -d db admin impact-api
   ```

   > The impact API isn't published to the host by default. If you need this app to reach it, uncomment its `ports:` block in [`docker-compose.yml`](docker-compose.yml) (e.g. `8001:8000`).

2. **Install dependencies and create your env file:**

   ```bash
   npm install
   cp .env.example .env
   ```

3. **Point `.env` at the running services** (passwords/keys must match `docker-compose.yml`):

   ```dotenv
   DATABASE_URL="mysql://sumodp:<db-password>@localhost:3306/sumodp"
   AUTH_SECRET="<same as compose>"
   ODP_ADMIN_HOST_PRIVATE="http://localhost:8000"
   ODP_ADMIN_HOST_PUBLIC="http://localhost:8000"
   USER_CREATION_API_KEY="<same as compose>"
   # only if you published the impact API in step 1:
   JOB_RUN_IMPACT_ASSESS_ROUTE="http://localhost:8001/jobs/runs/mcda_analysis_custom"
   JOB_RUN_IMPACT_API_KEY="<same as compose INTERNAL_API_KEY>"
   ```

4. **Load baseline data** — see [Load baseline data](#load-baseline-data) below.

5. **Generate the Prisma client and run** the dev server:

   ```bash
   npm run db:generate
   npm run dev
   ```

   The app is served at <http://localhost:4321>.

### Load baseline data

The schema is defined by Prisma; the reference/seed data lives in plain SQL files. Apply the schema, then the seed files **in order**, against the running database (containerised or local). Replace `<db-password>`:

```bash
# 1. Schema
mysql -h 127.0.0.1 -u sumodp -p<db-password> sumodp < prisma/migrations/0_init/migration.sql

# 2. Seed data — keep this order (foreign keys depend on it)
mysql -h 127.0.0.1 -u sumodp -p<db-password> sumodp < prisma/migrations/01-chore_init.sql             # roles, projects (policy measures), kpi definitions, kpi categories
mysql -h 127.0.0.1 -u sumodp -p<db-password> sumodp < prisma/migrations/02-access_init.sql            # users, labs
mysql -h 127.0.0.1 -u sumodp -p<db-password> sumodp < prisma/migrations/03-items_init.sql             # categories, items
mysql -h 127.0.0.1 -u sumodp -p<db-password> sumodp < prisma/migrations/04-impact_analysis_groups.sql # MCDA goal categories
mysql -h 127.0.0.1 -u sumodp -p<db-password> sumodp < prisma/migrations/05-kpiresults_init_2023.sql   # KPI results
mysql -h 127.0.0.1 -u sumodp -p<db-password> sumodp < prisma/migrations/06-lab_projects_init_2025.sql # lab project implementations
```

> **Developing with the CLI (Option B)?** You can instead let Prisma create/reset the schema with `npm run db:init`, then import only the six seed files above.

> **Admin back-office:** the Laravel admin app shares this database and manages some of its own tables via its own migrations. If you need the admin UI fully working, also run `docker compose exec admin php artisan migrate` (see [SUM-project/SUM-Open-data-Platform](https://github.com/SUM-project/SUM-Open-data-Platform)).

### Create your admin account

Account creation goes through the admin back-office (the first MVP kept that responsibility there for backwards compatibility), so the **`admin` service must be running** — it is, if you started the stack above. There is no shared admin password. To get a fully privileged account on a fresh environment:

1. Open <http://localhost:4321/lab-admin/signup> and sign up. The new account is created as a **lab editor** (`role_id = 2`) and is activated automatically.
2. Promote yourself to **admin** (`role_id = 1`) directly in the database:

   ```sql
   UPDATE users SET role_id = 1 WHERE email = 'you@example.com';
   ```

3. Log out and back in — your session now has full admin access (all labs + the management space).

> Admin is determined by `role_id = 1` (see [`src/lib/helpers/roles.ts`](src/lib/helpers/roles.ts)). The `roles` table is seeded by `data_init.sql`: `1 = Admin`, `2 = Creator/editor`, `3 = Member`.

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env` — it documents every variable. The essentials:

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | ✅ | MySQL connection string, e.g. `mysql://user:pass@localhost:3306/odp` |
| `AUTH_SECRET` | ✅ | Secret used to sign auth JWTs (any random string) |
| `ODP_ADMIN_HOST_PUBLIC` / `ODP_ADMIN_HOST_PRIVATE` | ✅ | Public / internal base URL of the app |
| `USER_CREATION_API_KEY` | ✅ | Internal key guarding the signup endpoint |
| `SIGNUP_LAB_EDITOR_ROLE_ID` / `SIGNUP_AUTO_ACTIVATE` | – | Role and activation applied to new signups |
| `SMTP_*` / `ADMIN_EMAILS` | – | Admin email notifications (without `SMTP_HOST`, emails print to the console) |
| `JOB_RUN_IMPACT_ASSESS_ROUTE` / `JOB_RUN_IMPACT_API_KEY` | – | External MCDA analysis service for `POST /api/v1/job-runs` |
| `RATE_LIMIT_*` / `JOB_RUN_RATE_LIMIT_*` | – | Request rate limiting |

---

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run test` | Run all tests once |
| `npm run test:tdd` | Run tests in watch mode |
| `npm run test:coverage` | Generate a coverage report |
| `npm run db:init` | Reset the DB and apply all migrations |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:push` | Push schema to the DB without a migration (dev only) |

---

## Deployment

The app ships as a Docker image, built and pushed **by CI**

**Image:** `inocs-sum-odp-webapp`
**Registry:** `registry.gitlab.inria.fr/inocs-lab/inocs-sum-docker-images/inocs-sum-odp-webapp`
**Browse tags:** <https://gitlab.inria.fr/inocs-lab/inocs-sum-docker-images/container_registry/4215>

### Release flow

1. Bump `version` in [`package.json`](package.json).
2. Trigger the **"Build and Push Docker image to GitLab Registry"** workflow ([`.github/workflows/build-push-docker.yml`](.github/workflows/build-push-docker.yml)) — it runs manually (`workflow_dispatch`).
3. CI builds the multi-stage [`Dockerfile`](Dockerfile) and pushes two tags: the `package.json` version and `latest`.
4. The image is deployed via **CapRover (on INRIA infrastructure as of may 2026)**, which pulls the new image. Set the runtime environment variables (see above) in the CapRover app configuration.

The container runs `node ./dist/server/entry.mjs` and listens on port **4321**.

---

## Contributor rules

Project governance is defined in [`.specify/memory/constitution.md`](.specify/memory/constitution.md) for Spec Kit assisted development; AI-assistant instructions are in [`.github/copilot-instructions.md`](.github/copilot-instructions.md). In short:

- **TDD first** — write a failing test before implementing; every feature adds at least one test.
- **Astro SSR + React islands** — Astro pages do routing and server-side data fetching; React islands handle interactive UI only. Never query Prisma from a React component.
- **BFF pattern** — all DB access flows through `src/bff/`: `API route → Controller → Service → Repository → Prisma`.
- **TypeScript strict mode** stays on; **MySQL via Prisma** is the only data layer; **Vitest + Testing Library** for all tests.
