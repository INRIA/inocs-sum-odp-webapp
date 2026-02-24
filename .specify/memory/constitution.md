<!--
Sync Impact Report
- Version change: N/A (template) → 1.0.0
- Modified principles:
	- [PRINCIPLE_1_NAME] → I. Test-First Delivery (NON-NEGOTIABLE)
	- [PRINCIPLE_2_NAME] → II. Astro SSR + React Islands Separation
	- [PRINCIPLE_3_NAME] → III. Prisma + PostgreSQL as the Only Data Layer
	- [PRINCIPLE_4_NAME] → IV. TypeScript Strictness Everywhere
	- [PRINCIPLE_5_NAME] → V. Standardized Frontend and API Testing Stack
- Added sections:
	- Architecture and Technology Constraints
	- Delivery Workflow and Quality Gates
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/commands/*.md (directory not present in this repository)
- Follow-up TODOs:
	- None
-->

# INOCS SUM ODP Webapp Constitution

## Core Principles

### I. Test-First Delivery (NON-NEGOTIABLE)
Every new behavior MUST begin with tests written before implementation code (TDD/SDD).
For each new feature, at least one new dedicated test file MUST be added as explicit acceptance
criteria and MUST fail before implementation starts. Teams MUST follow Red → Green → Refactor.
Rationale: this guarantees requirement traceability, prevents untestable designs, and enforces
delivery confidence.

### II. Astro SSR + React Islands Separation
Rendering responsibilities MUST stay separated: Astro SSR handles page composition and server-side
concerns, while React islands handle isolated client interactivity only. New work MUST NOT mix
static content concerns with client-dynamic logic in the same layer when an island boundary is
appropriate. Rationale: clear boundaries reduce hydration errors, improve performance, and keep
maintenance predictable.

### III. Prisma + PostgreSQL as the Only Data Layer
All persistent data access MUST go through Prisma targeting PostgreSQL. Raw SQL in application
code MUST NOT be introduced, and no additional database engines may be used for feature
implementation. Schema and data-access changes MUST be represented through Prisma schema updates
and migrations. Rationale: one data-access contract improves consistency, safety, and operability.

### IV. TypeScript Strictness Everywhere
TypeScript strict mode MUST remain enabled and enforced across the repository. New code MUST NOT
introduce weakened compiler settings, untyped escape hatches without explicit justification, or
unchecked public interfaces. Rationale: strict typing is a primary defense against runtime defects
in SSR and client-island integration.

### V. Standardized Frontend and API Testing Stack
Component and API behavior tests MUST use Vitest and `@testing-library/react` (with
`@testing-library/user-event` where interaction is required). Test coverage for each new feature
MUST include: happy path, user interactions, information displayed to users, and relevant edge
cases. Rationale: one shared testing stack ensures coherent test quality and developer velocity.

## Architecture and Technology Constraints

- Astro pages and layouts MUST remain the SSR orchestration layer.
- React code MUST be implemented as islands/components with explicit interactive scope.
- Backend-for-frontend database access in `src/bff/` MUST use Prisma client abstractions.
- PostgreSQL is the only approved production persistence engine.
- TypeScript configuration MUST extend strict presets and preserve strict checking in CI.

## Delivery Workflow and Quality Gates

1. Define user story and acceptance criteria.
2. Create a new test file per feature and write failing tests first.
3. Implement minimal code to pass tests while preserving architecture boundaries.
4. Refactor with tests green and strict TypeScript checks passing.
5. Pull requests MUST document:
	 - the new test file path,
	 - proof of coverage for happy path, interactions, displayed information, and edge cases,
	 - confirmation that Astro SSR and React island boundaries are preserved,
	 - confirmation that only Prisma/PostgreSQL data access was used.

## Governance
This constitution supersedes conflicting local practices for specification, planning, and delivery.
Amendments require: (a) documented proposal, (b) review/approval by project maintainers,
and (c) propagation updates to affected templates under `.specify/templates/` in the same change.

Versioning policy:
- MAJOR: removes or redefines a principle in a backward-incompatible way.
- MINOR: adds a new principle/section or materially expands mandatory guidance.
- PATCH: clarifications, wording improvements, and non-semantic edits.

Compliance review expectations:
- Every pull request review MUST include a constitution compliance check.
- Any justified exception MUST be documented in the feature plan under complexity/compliance notes.
- Periodic audits SHOULD be performed each release cycle to verify template and workflow alignment.

**Version**: 1.0.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-24
