# Feature Specification: CSV Dataset Download

**Feature Branch**: `001-csv-download`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "Allow users to download datasets with a download CSV button. This download should trigger a CSV file download, for the KPI results (all found or filtered by lab, kpi group, kpi definition), measures implementation by labs. This download button will be displayed in different parts of the website, so the user can easily download scoped information."

## User Scenarios & Testing *(mandatory)*

**Constitution-mandated test requirements for every feature:**
- Tests MUST be authored before implementation code (TDD/SDD).
- At least one new dedicated test file MUST be added per new feature.
- Test design MUST cover happy path, user interactions, information displayed, and edge cases.
- Component/API behavior tests MUST use Vitest + `@testing-library/react`.

### User Story 1 - Download KPI Results (Priority: P1)

A visitor or researcher browsing the KPI results dashboard wants to export the currently displayed data to work with it offline (in a spreadsheet tool, data analysis software, etc.). They click a "Download CSV" button scoped to the visible dataset and receive a CSV file immediately.

**Why this priority**: KPI results are the primary dataset of interest on the platform. Enabling offline analysis is the highest-value export scenario and directly fulfills the feature's core purpose.

**Independent Test**: Can be fully tested by navigating to the KPI results page, clicking the download button, and verifying a valid CSV file is downloaded containing the correct columns (lab name, KPI number, KPI name, KPI group, metric, value, date, transport mode where applicable).

**Acceptance Scenarios**:

1. **Given** the KPI results page is loaded with unfiltered data, **When** the user clicks "Download CSV", **Then** a CSV file named `kpi-results.csv` is downloaded containing all KPI results with columns: lab, kpi_number, kpi_name, kpi_group, metric, value, date, transport_mode.
2. **Given** the KPI results page has an active filter by lab, **When** the user clicks "Download CSV", **Then** the downloaded file contains only results matching that lab filter.
3. **Given** the KPI results page has filters applied for both KPI group and KPI definition, **When** the user clicks "Download CSV", **Then** the downloaded file reflects those combined filters.
4. **Given** the filtered result set is empty, **When** the user clicks "Download CSV", **Then** the download is prevented and a user-friendly message informs the user there is no data to export.

---

### User Story 2 - Download Measures Implementation by Lab (Priority: P2)

A planner or policy researcher wants to export the list of measures (projects) implemented by living labs, to analyse which cities are implementing which urban mobility measures.

**Why this priority**: Measures implementation data is the second key dataset. Exporting it independently allows targeted analysis of lab-level project adoption without needing KPI data.

**Independent Test**: Can be fully tested by navigating to a measures/implementation page, clicking the download button, and verifying the CSV contains columns: lab, project_name, project_type, start_date, description.

**Acceptance Scenarios**:

1. **Given** the measures implementation page shows all labs and projects, **When** the user clicks "Download CSV", **Then** a file named `projects.csv` is downloaded with columns: lab, project_name, project_type, start_date, description.
2. **Given** the page is filtered to a single lab, **When** the user clicks "Download CSV", **Then** the file contains only that lab's measures.
3. **Given** no measures are found for the current filter, **When** the user clicks "Download CSV", **Then** a friendly message is shown and no empty file is produced.

---

### User Story 3 - Contextual Download Button Placement (Priority: P3)

A user navigating any data-rich section of the website can find the "Download CSV" button near the relevant chart or table without searching for it. The button is visually consistent and clearly labelled across all pages.

**Why this priority**: This addresses the cross-site reusability requirement. Without consistent placement, users may miss the feature even if it is technically available.

**Independent Test**: Can be tested by visiting each page where the component is embedded and verifying the button renders with the correct label, scope label (e.g. "Download KPI Results"), and that it triggers the correct download endpoint.

**Acceptance Scenarios**:

1. **Given** a page embeds the download component with a specific dataset scope, **When** the page loads, **Then** the button is visible near the data section and displays a clear label indicating what will be downloaded.
2. **Given** the user is on a mobile-sized viewport, **When** the page loads, **Then** the download button remains accessible and does not overflow or hide behind other elements.

---

### Edge Cases

- What happens when the server fails to generate the CSV (e.g., DB timeout)? → User receives a clear error notification; no corrupt or empty file is served.
- What happens when a filter combination yields zero rows? → Download is blocked client-side before the request is sent, with a "No data available for download" message.
- What happens when the CSV file is very large (thousands of rows)? → The download streams correctly without browser timeout; no truncation occurs.
- What happens when the user applies no filters and the full dataset is very large? → The export proceeds normally; the file is named to reflect the unfiltered scope.
- What happens if a field value contains a comma or newline? → All field values are properly quoted in the CSV output to avoid malformed files.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a dedicated export endpoint that accepts dataset type and filter parameters, and returns a downloadable CSV file.
- **FR-002**: The system MUST support exporting KPI results, filterable by: all (no filter), lab, KPI group (category), and KPI definition.
- **FR-003**: The system MUST support exporting measures implementation by lab, filterable by lab.
- **FR-004**: The export endpoint MUST return a `Content-Disposition: attachment` response header so the browser triggers a file download automatically.
- **FR-005**: The CSV output MUST include a header row with human-readable column names.
- **FR-006**: All field values containing commas, quotes, or newlines MUST be properly escaped/quoted in the CSV output.
- **FR-007**: The system MUST return a meaningful HTTP error (e.g., 404 or 400) when an unsupported dataset type or invalid filter parameter is requested.
- **FR-008**: The system MUST prevent generating and serving an empty CSV body; if no rows match the filter, it MUST return an appropriate error response instead.
- **FR-009**: A reusable download button component MUST be available for embedding in any page, accepting dataset type and filter parameters as props.
- **FR-010**: The download button MUST be disabled and show a tooltip or message when the current data context has no rows to export.
- **FR-TEST-001**: Feature MUST include at least one new test file as acceptance criteria.
- **FR-TEST-002**: Feature tests MUST be created before implementation and initially fail.
- **FR-ARCH-001**: Feature MUST preserve Astro SSR and React islands separation of concerns. React island components embedded in Astro pages MUST use a `client:*` directive to enable interactivity.
- **FR-DATA-001**: Feature MUST use Prisma with MySQL as the only persistent data layer (MySQL is the live database engine; PostgreSQL reference in constitution is a pre-existing discrepancy documented in plan.md).
- **FR-TS-001**: Feature MUST satisfy TypeScript strict-mode constraints without weakening config.

### Key Entities

- **KPI Result** (`kpiresults`): A recorded numeric value for a specific KPI definition, measured by a living lab, on a given date, optionally scoped to a transport mode. Export columns: lab name, KPI number, KPI name, KPI group/category, metric, value, date, transport mode name.
- **KPI Definition** (`kpidefinitions`): Defines the KPI being measured — includes number, name, description, metric. Used to enrich KPI result exports.
- **KPI Group / Category** (`categories`): Thematic grouping of KPI definitions. Acts as a top-level filter for KPI result exports.
- **Living Lab** (`labs`): A city or site participating in the platform. The primary scoping entity for all exports.
- **Measure Implementation** (`living_lab_projects_implementation`): Records which project (measure) a living lab has adopted, with start date and description. Export columns: lab name, project name, project type, start date, description.
- **Project / Measure** (`projects`): Defines the urban mobility measure being implemented. Provides name and type for measure exports.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can trigger a CSV download from any data page in 1 click or fewer additional interactions after the page has loaded.
- **SC-002**: The downloaded file opens correctly in standard spreadsheet applications (e.g., LibreOffice Calc, Excel, Google Sheets) without import errors or data corruption.
- **SC-003**: KPI result exports correctly reflect all active filters — verifiable by comparing the row count and values in the file against what is displayed on screen.
- **SC-004**: Measure implementation exports correctly reflect the lab scope when filtered.
- **SC-005**: The export endpoint responds and begins streaming within 3 seconds for datasets up to 10,000 rows under normal server conditions.
- **SC-006**: The download button component renders correctly on all pages where it is embedded, with no visual regressions on desktop and mobile viewports.
- **SC-007**: Zero malformed CSV files are produced — all rows parse correctly in automated tests covering edge cases (special characters, nulls, long text values).
