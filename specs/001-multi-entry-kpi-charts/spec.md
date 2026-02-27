# Feature Specification: Public Multi-Entry KPI Charts

**Feature Branch**: `001-multi-entry-kpi-charts`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Modify my data charts view public pages to integrate multiple entries, not just 2 (currently focused on before vs after). Focus only on data view in the public web pages (not the private admin input forms)."

## User Scenarios & Testing *(mandatory)*

**Constitution-mandated test requirements for every feature:**
- Tests MUST be authored before implementation code (TDD/SDD).
- At least one new dedicated test file MUST be added per new feature.
- Test design MUST cover happy path, user interactions, information displayed, and edge cases.
- Component/API behavior tests MUST use Vitest + `@testing-library/react`.

### User Story 1 - View full KPI history in public charts (Priority: P1)

As a public viewer, I can see all recorded KPI result entries in charts instead of only two comparison points, so I can understand trend and progression over time.

**Why this priority**: This is the core business value of the request; without it, newly recorded KPI entries remain invisible in public reporting.

**Independent Test**: Can be fully tested by loading KPI datasets with more than two entries and confirming all entries are displayed in chart visuals and chart-related labels.

**Acceptance Scenarios**:

1. **Given** a KPI with 5 recorded result entries, **When** a user opens the public KPI data view, **Then** the chart includes all 5 entries in the plotted sequence.
2. **Given** a KPI with entries recorded across multiple dates, **When** a user views the chart, **Then** entries are shown in chronological order.
3. **Given** a KPI with only 1 or 2 entries, **When** a user views the chart, **Then** the chart remains readable and accurately reflects available entries.

---

### User Story 2 - Consistent multi-entry behavior across public pages (Priority: P2)

As a public viewer, I see the same multi-entry chart behavior on all public data pages so results are consistent regardless of where I inspect KPI data.

**Why this priority**: The feature targets three separate public pages; inconsistent behavior would create confusion and reduce trust in displayed results.

**Independent Test**: Can be tested by opening all targeted public pages with the same KPI dataset and verifying entry count and order match on each page.

**Acceptance Scenarios**:

1. **Given** the same living lab dataset, **When** a user opens the living lab city view, KPI data view, and modal split view, **Then** each page shows the same set of KPI entries.
2. **Given** more than 2 entries exist, **When** a user switches between the three public views, **Then** none of the views collapses data to only before/after values.

---

### User Story 3 - Graceful handling of sparse or missing data (Priority: P3)

As a public viewer, I receive a clear and stable chart/data experience even when KPI entries are missing, partial, or irregular.

**Why this priority**: Real datasets may have incomplete KPI histories; robust behavior avoids broken charts and misinterpretation.

**Independent Test**: Can be tested with KPIs that have no entries, duplicate timestamps, or missing values and verifying the page stays functional with clear messaging.

**Acceptance Scenarios**:

1. **Given** a KPI with no recorded entries, **When** a user opens a public data chart page, **Then** the page shows a clear no-data state instead of an empty or broken chart.
2. **Given** a KPI entry list containing invalid or missing points, **When** the chart renders, **Then** valid entries are shown and invalid entries are safely ignored without page failure.

### Edge Cases

- A KPI has exactly 0, 1, 2, and many entries; each count is rendered without layout breakage.
- Entries are out of order in source data; chart display order remains chronological.
- Multiple entries share the same date/time; display remains deterministic and does not duplicate legends unpredictably.
- Some entries are null or non-numeric; page still renders and communicates unavailable values.
- Large entry counts (for example, 50+ points for one KPI) remain readable and usable in public views.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display all recorded KPI result entries in public chart views rather than limiting display to two values.
- **FR-002**: The system MUST apply this behavior to the public living lab data view, public KPIs data view, and public modal split data view.
- **FR-003**: The system MUST keep entry ordering consistent and chronological wherever temporal order is relevant.
- **FR-004**: Users MUST be able to interpret each plotted entry through visible contextual labeling (such as date/sequence/value indicators) in existing page UI.
- **FR-005**: The system MUST preserve current public-page access behavior and MUST NOT require private/admin access to view chart data.
- **FR-006**: The feature scope MUST exclude private admin input forms and private data-entry workflows.
- **FR-007**: The system MUST render a clear no-data state when a KPI has no entries.
- **FR-008**: The system MUST handle partially invalid KPI entry sets by rendering valid data without failing the page.
- **FR-009**: The system MUST keep charted values consistent across the three targeted public pages when those pages use the same underlying KPI data.
- **FR-TEST-001**: Feature MUST include at least one new test file as acceptance criteria.
- **FR-TEST-002**: Feature tests MUST be created before implementation and initially fail.
- **FR-ARCH-001**: Feature MUST preserve Astro SSR and React islands separation of concerns.
- **FR-DATA-001**: Feature MUST use Prisma with PostgreSQL as the only persistent data layer.
- **FR-TS-001**: Feature MUST satisfy TypeScript strict-mode constraints without weakening config.

### Key Entities *(include if feature involves data)*

- **KPI Result Entry**: A recorded value for a KPI at a specific capture point; includes value, reference time/sequence, and association to a KPI.
- **KPI Series**: Ordered collection of KPI Result Entries shown together in a chart for one KPI.
- **Public Data View Context**: The page context that selects which KPI series are visible for a living lab, KPI data page, or modal split page.

### Assumptions

- Existing public pages already retrieve KPI result data and currently constrain chart display to before/after values.
- Existing visual design and page layouts remain unchanged except for accommodating additional plotted entries.
- KPI entries can be meaningfully ordered using currently available temporal or sequence attributes.
- The same KPI data source is shared across the three targeted public pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing datasets where a KPI has more than 2 entries, 100% of entries are visible in each targeted public chart view.
- **SC-002**: In cross-page validation for identical KPI datasets, entry count and ordering match across the three targeted pages in 100% of tested cases.
- **SC-003**: For KPI datasets with no entries, users see an explicit no-data state on targeted pages in 100% of tested cases.
- **SC-004**: At least 90% of representative reviewers correctly identify trend direction (increasing, decreasing, stable) from multi-entry public charts on first attempt.
