# Research: Platform Analytics Dashboard

**Phase**: 0 | **Feature**: 002-admin-analytics-dashboard | **Date**: 2026-03-17

---

## R-001: Retrieving All KPI Results Across All Labs

**Question**: There is no single ApiClient method that returns all KPI results across all living labs. How should the analytics page aggregate KPI results?

**Decision**: Use `ApiClient.getLivingLabs()` with default fields (which includes `kpiresults`). The returned `ILivingLabPopulated[]` contains `kpi_results: IKpiResultGroup[]` per lab. Aggregate in Astro frontmatter server-side.

**Rationale**:
- `getLivingLabs()` already returns all labs populated with their `kpiresults` (as `IKpiResultGroup[]`) by default — this is the existing pattern used in `index.astro` and the KPIs dashboard.
- Each `IKpiResultGroup` contains `results: IKpiResult[]` with individual values, `kpidefinition_id`, `living_lab_id`, and `date` fields — sufficient for all analytics aggregations.
- Adding a new dedicated "all KPI results" endpoint would require new BFF service/repository/route work for no additional benefit — the data is already available through the labs endpoint.
- Server-side aggregation in Astro frontmatter is the correct boundary per the constitution's SSR architecture.

**Alternatives considered**:
- New `/api/v1/kpiresults?all=true` endpoint: rejected — would require new BFF layers and duplicates data already available via labs.
- Direct BFF service import in Astro: technically possible in SSR, but bypasses ApiClient auth and would be inconsistent with established patterns.

---

## R-002: Retrieving User Counts

**Question**: `ApiClient` has no `getUsers()` method. The `/api/v1/users` endpoint exists but is not surfaced through ApiClient. How should user data be retrieved?

**Decision**: Add a `getUsers()` method to `ApiClient` that calls `GET /api/v1/users`. For analytics, retrieve all users and count by status (active vs pending) in the Astro frontmatter.

**Rationale**:
- The `/api/v1/users` endpoint already exists and supports filtering by `status` and `role_id`.
- Adding a simple `getUsers()` to ApiClient follows the established pattern of every BFF endpoint having a corresponding ApiClient method.
- The analytics page needs both total count and status breakdown (active vs pending/signup), so retrieving the full list and counting client-side is the simplest approach given the small expected user count.
- Alternative of calling `UserService` directly in the Astro frontmatter would work in SSR but would break the ApiClient abstraction pattern.

**Alternatives considered**:
- Direct import of `UserService` in Astro page: rejected — inconsistent with established data access pattern via ApiClient.
- New dedicated count endpoint: over-engineering for the expected user count (<100 users).

---

## R-003: Identifying Main/Parent KPI Definitions

**Question**: How to reliably identify main/parent KPIs? The codebase has multiple approaches.

**Decision**: A main/parent KPI is an `IKpi` where `parent_kpi_id` is `null` or `undefined`. Use `kpis.filter(k => !k.parent_kpi_id)` for the analytics page.

**Rationale**:
- The existing `getUniqueParentKpis()` in `kpi-format.ts` works with `IKpiDefinition` (an extended type from impact analysis), not the base `IKpi` returned by `ApiClient.getKPIs()`. It maps child KPIs to their parent rather than filtering parents only.
- For analytics purposes, we need the pure list of parent KPI definitions (those without a `parent_kpi_id`), not the deduplicated parent-mapped projection.
- A simple filter is more explicit and correct for this use case. A dedicated helper in `analytics.ts` will encapsulate this logic.

**Alternatives considered**:
- Reuse `getUniqueParentKpis()`: rejected — it works on `IKpiDefinition` not `IKpi`, and its deduplication logic (mapping children to parents) is designed for impact analysis, not for counting distinct parent definitions.
- New method on ApiClient with server-side filtering: over-engineering — the filter is trivial and the full KPI list is small.

---

## R-004: KPI Results to KPI Definitions Mapping for Coverage

**Question**: How to compute "KPI coverage rate" — the fraction of main KPI definitions that have at least one result submitted?

**Decision**: Build a `Set` of `kpidefinition_id` values from all KPI results across all labs. For results linked to child KPIs, map to parent via `kpidefinition_id → parent_kpi_id` lookup. Coverage = `Set.size / parentKpis.length`.

**Rationale**:
- KPI results can reference either parent or child KPI definitions. A parent KPI should be considered "covered" if any result exists for it or any of its children.
- Building a `kpiId → parentId` mapping from the full KPI definitions list allows resolving child results to their parent.
- This is the same conceptual approach used in `getKpiResultsCardMetrics()` in `living-lab.ts`.

**Alternatives considered**:
- Count only results that directly reference parent KPIs: incorrect — would miss coverage through child KPI submissions.

---

## R-005: D3.js Line Chart for KPI Results Over Time

**Question**: How to structure the D3 line chart data for KPI results over time per lab? Should we reuse the existing `D3TimelineChart`?

**Decision**: Create a new `D3LineChartLabKPIsOvertime` React component. It will receive pre-computed data from Astro as props. The data shape: `{ labId, labName, color, dataPoints: { year, count }[] }[]` — one series per living lab, with count of KPI results per year on the Y axis.

**Rationale**:
- The existing `D3TimelineChart` is designed for displaying individual KPI values (y = KPI value) per lab over time. The analytics chart needs aggregate counts (y = number of KPI results submitted) per year, which is a fundamentally different data shape.
- A new component avoids polluting the existing chart with conditional logic for different data semantics.
- The component follows the same D3 rendering pattern (useRef + useEffect + d3 selection) established by `D3TimelineChart` and `D3FacetedTimelineChart`.
- Data is fully pre-computed server-side; the React component only renders the visualization. It needs `client:load` since D3 requires DOM access.

**Alternatives considered**:
- Extend `D3TimelineChart` with a "mode" prop: rejected — different data semantics would complicate an already complex component.
- Server-side SVG rendering: rejected — D3's responsive/interactive features (tooltips, resize observer) require client-side rendering.

---

## R-006: D3 Bar Chart for Measures Comparison

**Question**: How to structure the measures comparison bar chart across labs?

**Decision**: Create a new `D3BarChartLabMeasures` React component. Data shape: `{ labName, pushCount, pullCount }[]` — one group per living lab, two bars (PUSH/PULL) per group. Uses theme colors for bar differentiation.

**Rationale**:
- No existing bar chart component exists in the project. The measures comparison is a grouped bar chart, which is a standard D3 pattern.
- Pre-computed data (server-side aggregation of `living_lab_projects_implementation` by project type) keeps the component simple.
- Like the line chart, this needs `client:load` for D3 DOM access.

**Alternatives considered**:
- Astro-only table display: doesn't meet the user's explicit request for a bar chart visualization.
- Third-party charting library (Chart.js, Recharts): rejected — project already uses D3 extensively.

---

## R-007: Component Architecture — All React

**Question**: The page is read-only with no user interactions. Should components be Astro or React?

**Decision**: All 6 components are React (`.tsx`) in `src/components/react/Analytics/`. The 4 data-display components (MetricCard, AnalyticsAlerts, LivingLabMetricsTable, KPICoverageTable) are imported into the Astro page without `client:*` directives — Astro SSR renders them to static HTML server-side, shipping zero client JS. The 2 D3 chart components require `client:load` for DOM access.

**Rationale**:
- Using React for all components provides a consistent development experience and testing story (all tested with `@testing-library/react`).
- Astro can server-render React components without hydrating them — when no `client:*` directive is used, the component is rendered to HTML at build/SSR time with zero client-side JavaScript.
- This keeps all 6 components in one directory, with shared types, one barrel export, and uniform testing.
- The 2 D3 charts inherently require client-side DOM access for SVG rendering, responsive sizing, and hover tooltips, so they use `client:load`.

**Alternatives considered**:
- 4 Astro (`.astro`) + 2 React: would split components across two locations, require different testing approaches, and provide no performance benefit (Astro SSR-rendering React is functionally identical to `.astro` templates for static output).
- All Astro with inline `<script>` for D3: would bypass established React component patterns and make D3 charts harder to test.

---

## R-008: Theme Colors in D3 Charts

**Question**: How to use Tailwind theme colors (`--color-primary`, `--color-secondary`, etc.) inside D3 chart rendering?

**Decision**: Read CSS custom properties at render time using `getComputedStyle(document.documentElement).getPropertyValue('--color-primary')`. Define a color palette array for lab series from theme variables.

**Rationale**:
- CSS custom properties are available at runtime and will reflect any theme changes.
- The existing `D3TimelineChart` already uses a similar color approach (hardcoded color arrays). Using CSS variables is a small improvement.
- For the bar chart, `--color-primary` for PUSH and `--color-secondary` for PULL provide clear visual distinction matching the project's design language.

**Alternatives considered**:
- Hardcoded hex values: works but breaks if theme changes.
- Passing colors as props from Astro: requires reading CSS variables server-side which is not possible in SSR.

---

## R-009: Data Shape for Living Lab Metrics Table

**Question**: What is the shape of the "last updated at" metric for each living lab?

**Decision**: Compute `lastUpdatedAt` per lab as the maximum `date` value across all KPI results and measure `start_at`/`updated_at` values for that lab. Return as an ISO date string.

**Rationale**:
- KPI results have a `date` field (string, ISO format).
- `LivingLabProjectsImplementation` has `start_at` and `updated_at` fields.
- Taking the maximum of all these dates gives the most recent data activity for that lab.
- This is computed server-side in the analytics helper.

**Alternatives considered**:
- Only use KPI result dates: would miss labs that only have measure updates.
- Use `living_lab.updated_at`: reflects lab metadata changes, not data activity.

---

## R-010: Adding getUsers to ApiClient — Route Alignment

**Question**: What signature and behavior should the new `getUsers()` method have, and does the existing `/api/v1/users` route support it?

**Decision**: 
1. Add `getUsers()` to ApiClient:
```typescript
async getUsers(options?: { status?: string }): Promise<User[] | null> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  return this.request<User[]>(`/users${params.toString() ? `?${params}` : ""}`);
}
```

2. Update `GET /api/v1/users` at `src/pages/api/v1/users.ts` to support returning all users when no filters are provided. Currently the route calls `userService.findUsers({})` which returns `[]` → triggers a 404 response. Fix by detecting the no-filter case and calling `userService.getAllUsers()` instead.

**Rationale**:
- The ApiClient method follows the existing pattern (optional filter params, returns typed array or null).
- The route fix is minimal: check if any filters are present, and if not, call `getAllUsers()` which already exists on `UserService`.
- `ApiResponse({ data })` serializes `data.data` directly via `toSafeJsonString()`. The ApiClient's `request<T>()` parses JSON and returns `User[]` directly — no wrapper object.
- The status filter maps directly to the route's existing `status` search param.

**Alternatives considered**:
- Direct import of `UserService` in Astro page: rejected — inconsistent with ApiClient data access pattern.
- New dedicated count endpoint: over-engineering for expected user count (<100).
- Leave route unchanged and pass `status=active` + `status=signup` as two calls: rejected — requires two API calls and the route still fails with no results for one status.
