# SUM Open Data Platform — Frontend

> Horizon Europe funded, INRIA WP5/T5.1. Astro 5 SSR + React 19 islands.

## Quick orientation

- **Project kernel:** `project-context.md` — commands, conventions, landmines, deployment
- **Epic specs:** `.specs/epics.md` (index), `.specs/epic{N}/epic.md` + `architecture.md`
- **Roadmap:** `.specs/roadmap_review.md` — 22 tasks, 4 waves (A-D), all blocking decisions resolved
- **BMad config:** `_bmad/config.toml` + `_bmad/config.user.toml`
- **BMad output:** `_bmad-output/planning-artifacts/` and `_bmad-output/implementation-artifacts/`
- **BMad scripts:** `_bmad/scripts/` — `resolve_config.py`, `resolve_customization.py`, `memlog.py`
- **BMad custom overrides:** `_bmad/custom/{skill-name}.toml` (team) / `{skill-name}.user.toml` (personal)

## Critical conventions (read project-context.md for full list)

- **Astro SSR + React islands — hard boundary.** Never fetch data from Prisma inside React.
- **BFF pattern mandatory:** `API route -> Controller -> Service -> Repository -> Prisma`.
- **Tailwind CSS v4** via Vite plugin, NOT PostCSS. No `tailwind.config.js`.
- **TDD-first:** write failing test before implementation.
- **TypeScript strict mode** — no `any` without justification.
- **Prisma BigInt:** always convert with `.toString()` or `Number()` before JSON serialization.

## Commands

- Dev: `npm run dev` — Build: `npm run build` — Test: `npm run test:run`
- DB: `npm run db:migrate` / `db:generate` / `db:studio`

## BMad agents & skills

When running as a BMad agent or skill:
1. Always run the resolve scripts — do not read TOML manually
2. `memlog.py` lives at `_bmad/scripts/memlog.py` — use `uv run` to invoke
3. `project-context.md` is loaded via `persistent_facts` glob — do not re-derive it
4. Output goes to `_bmad-output/planning-artifacts/` (planning) or `_bmad-output/implementation-artifacts/` (code)
5. Epic-level architecture runs: set `run_folder_pattern` to `architecture-epic-{N}` to avoid collisions

### Known gaps

- `bmad-review` skill is **not installed**. Referenced by architecture `doc_standards` — skip prose polish gracefully when this skill is unavailable. The spine itself is unaffected.
