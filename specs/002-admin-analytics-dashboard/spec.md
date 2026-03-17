# Feature Specification: Platform Analytics Dashboard

**Feature Branch**: `002-admin-analytics-dashboard`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "New page lab-admin/analytics that will display general metrics for the platform, for living labs, users, kpi results and measures. The SSR astro page will retrieve data from the backend: ApiClient. Retrieve ALL kpis for all living labs. Retrieve the KPIs definitions. Differentiate the kpi results values and the KPI definitions for main/parent only. Retrieve ALL measures for all living labs. The data will be prepared in the SSR side of the Astro page, and provided as props to the React native components. All sub components are Astro components. SSR rendered, since no interactions only data visibility."

## User Scenarios & Testing *(mandatory)*

**Constitution-mandated test requirements for every feature:**
- Tests MUST be authored before implementation code (TDD/SDD).
- At least one new dedicated test file MUST be added per new feature.
- Test design MUST cover happy path, user interactions, information displayed, and edge cases.
- Component/API behavior tests MUST use Vitest + `@testing-library/react`.

### User Story 1 - View Platform Overview Metrics (Priority: P1)

As a platform administrator, I navigate to the analytics page and immediately see high-level summary cards showing the total number of living labs, registered users, KPI definitions, KPI results submitted, and measures adopted across the entire platform. This gives me a quick snapshot of overall platform health and activity.

**Why this priority**: The overview metrics are the core value of the analytics page — without them, the page has no purpose. Every other story builds on top of this foundational view.

**Independent Test**: Can be fully tested by navigating to `/lab-admin/analytics` and verifying all summary cards render with correct aggregated counts. Delivers immediate value as a platform health indicator.

**Acceptance Scenarios**:

1. **Given** the admin is authenticated and navigates to `/lab-admin/analytics`, **When** the page loads, **Then** a summary section displays the total count of living labs on the platform.
2. **Given** the admin is on the analytics page, **When** the page loads, **Then** a summary section displays the total count of registered users.
3. **Given** the admin is on the analytics page, **When** the page loads, **Then** a summary section displays the total count of main/parent KPI definitions (excluding sub-KPIs).
4. **Given** the admin is on the analytics page, **When** the page loads, **Then** a summary section displays the total count of KPI results submitted across all living labs.
5. **Given** the admin is on the analytics page, **When** the page loads, **Then** a summary section displays the total count of measures adopted across all living labs.

---

### User Story 2 - View KPI Results Breakdown by Living Lab (Priority: P2)

As a platform administrator, I want to see a breakdown of KPI results grouped by living lab, so I can understand which labs are actively submitting data and how they compare. The view shows for each living lab how many main/parent KPI results have been submitted and which KPI categories are covered.

**Why this priority**: After seeing the totals, the admin needs to drill into KPI data per lab to identify gaps and compare activity levels. This is the primary analytical view for monitoring KPI data collection progress.

**Independent Test**: Can be fully tested by verifying a per-living-lab KPI results section renders, showing lab names alongside their KPI result counts and category coverage. Data correctness can be validated against known seed data.

**Acceptance Scenarios**:

1. **Given** the admin is on the analytics page, **When** the page loads, **Then** a section displays each living lab with the count of main/parent KPI results submitted.
2. **Given** multiple living labs exist with varying numbers of KPI results, **When** the page loads, **Then** the breakdown shows the correct per-lab count matching the actual data.
3. **Given** a living lab has no KPI results submitted, **When** the page loads, **Then** that lab is still listed with a count of zero.

---

### User Story 3 - View Measures Adoption Breakdown by Living Lab (Priority: P3)

As a platform administrator, I want to see a breakdown of measures adopted by each living lab, including how many PUSH and PULL measures each lab has implemented, so I can assess which labs are actively engaging with policy measures.

**Why this priority**: Measures adoption is a key indicator of living lab engagement with the platform's purpose. After understanding KPI activity, the admin needs visibility into policy measure uptake.

**Independent Test**: Can be fully tested by verifying a per-living-lab measures section renders, showing each lab with its count of adopted PUSH and PULL measures. Delivers standalone value for monitoring measure adoption.

**Acceptance Scenarios**:

1. **Given** the admin is on the analytics page, **When** the page loads, **Then** a section displays each living lab with the count of measures adopted, split by type (PUSH/PULL).
2. **Given** a living lab has adopted both PUSH and PULL measures, **When** the page loads, **Then** both counts are displayed for that lab.
3. **Given** a living lab has not adopted any measures, **When** the page loads, **Then** that lab is still listed with a count of zero.

---

### User Story 4 - View KPI Definitions Summary (Priority: P4)

As a platform administrator, I want to see a summary of all main/parent KPI definitions available on the platform, so I can understand the scope of the KPI framework. The summary distinguishes between GLOBAL and LOCAL KPI types and shows the total count of each.

**Why this priority**: Understanding the KPI framework scope provides context for interpreting the KPI results data. This is secondary to the actionable per-lab breakdowns.

**Independent Test**: Can be fully tested by verifying a KPI definitions section renders with correct counts of GLOBAL vs LOCAL main/parent KPIs.

**Acceptance Scenarios**:

1. **Given** the admin is on the analytics page, **When** the page loads, **Then** a section displays the total number of main/parent KPI definitions, split by GLOBAL and LOCAL type.
2. **Given** KPI definitions include both parent and child KPIs, **When** the page loads, **Then** only parent/main KPIs (those without a parent_kpi_id) are counted in the summary.

---

### Edge Cases

- What happens when the platform has no living labs registered? The page displays zero counts gracefully with no broken layouts or empty sections.
- What happens when a living lab exists but has no KPI results and no measures? The lab appears in breakdowns with zero values rather than being omitted.
- What happens when there are KPI results referencing KPI definitions that have a parent (sub-KPIs)? The breakdown correctly differentiates and only counts results for main/parent KPIs in the main summary.
- What happens when data retrieval fails for one of the data sources? The page displays an error message for the failed section while still rendering other sections that loaded successfully.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Page MUST be accessible at the route `/lab-admin/analytics` for authenticated administrators.
- **FR-002**: Page MUST retrieve all living labs from the backend and display the total count.
- **FR-003**: Page MUST retrieve all registered users and display the total count.
- **FR-004**: Page MUST retrieve all KPI definitions and filter to only main/parent KPIs (those without a `parent_kpi_id`) for the definitions summary.
- **FR-005**: Page MUST retrieve all KPI results across all living labs.
- **FR-006**: Page MUST display KPI results aggregated by living lab, counting only results linked to main/parent KPI definitions.
- **FR-007**: Page MUST retrieve all measures (projects) adopted across all living labs.
- **FR-008**: Page MUST display measures adoption aggregated by living lab, separated by type (PUSH/PULL).
- **FR-009**: Page MUST display a summary section with platform-wide totals: living labs count, users count, main KPI definitions count, KPI results count, and measures count.
- **FR-010**: All data preparation and aggregation MUST happen server-side in the Astro page frontmatter (SSR), with computed results passed as props to components.
- **FR-011**: All 6 sub-components MUST be React components. Components that do not require client interactivity (MetricCard, AnalyticsAlerts, LivingLabMetricsTable, KPICoverageTable) are rendered server-side by Astro without `client:*` directives. D3 chart components use `client:load` for DOM access.
- **FR-012**: Page MUST use the existing Layout component with appropriate breadcrumbs and navigation.
- **FR-013**: Page MUST handle empty data gracefully — displaying zero values instead of hiding sections or showing errors.
- **FR-014**: KPI definitions summary MUST distinguish between GLOBAL and LOCAL types.
- **FR-TEST-001**: Feature MUST include at least one new test file as acceptance criteria.
- **FR-TEST-002**: Feature tests MUST be created before implementation and initially fail.
- **FR-ARCH-001**: Feature MUST preserve Astro SSR and React islands separation of concerns.
- **FR-DATA-001**: Feature MUST use Prisma with PostgreSQL as the only persistent data layer.
- **FR-TS-001**: Feature MUST satisfy TypeScript strict-mode constraints without weakening config.

### Key Entities

- **Living Lab**: A registered city/region lab on the platform. Key attributes: name, country, population, validation status. Has related KPI results, measures, and transport modes.
- **KPI Definition**: A key performance indicator definition in the platform's framework. Key attributes: kpi_number, name, type (GLOBAL/LOCAL), parent_kpi_id (null for main/parent KPIs). Parent KPIs may have child sub-KPIs.
- **KPI Result**: A submitted KPI measurement value linked to a specific KPI definition and living lab. Key attributes: value, date, kpidefinition_id, living_lab_id.
- **Measure (Project)**: A policy measure available for adoption by living labs. Key attributes: name, type (PUSH/PULL/OTHER). Linked to labs via an implementation relationship.
- **User**: A registered platform user. Key attributes: name, email, role, status (signup/active/disabled).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can view all platform-wide totals (labs, users, KPI definitions, KPI results, measures) on a single page load without navigating elsewhere.
- **SC-002**: The analytics page loads and renders all data sections within 3 seconds for a platform with up to 50 living labs, 500 KPI results, and 200 measures.
- **SC-003**: All displayed counts are accurate and consistent with the underlying data — zero discrepancy between displayed totals and actual records.
- **SC-004**: Administrators can identify which living labs have the most and fewest KPI results or measures at a glance, without manual calculation.
- **SC-005**: The page correctly distinguishes main/parent KPI definitions from sub-KPIs, ensuring the summary only reflects top-level KPIs.

## Assumptions

- The existing `ApiClient` methods (`getLivingLabs`, `getKPIs`, `getMeasures`) are sufficient to retrieve the required data. If a method to retrieve all KPI results across all labs does not exist, it will need to be added or an alternative approach (fetching each lab's results individually) will be used.
- User counts can be derived from the existing data layer — either through an existing `ApiClient` method or by querying users directly.
- The page is accessible only to authenticated administrators (same auth pattern as other `lab-admin` pages).
- The page does not require any client-side interactivity — all content is read-only and server-rendered.
- "Main/parent KPI" means a KPI definition where `parent_kpi_id` is null.
