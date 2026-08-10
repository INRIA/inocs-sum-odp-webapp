# Story T17 — Lessons & Documents from Resources Library

**Epic:** 9 — Insights City Experience
**Size:** M
**Dependencies:** T14 (Insights city profile must be complete)
**Branch:** `feature/epic9-insights-city`

---

## User Story

> As a decision-maker viewing a city's Insights profile, I see relevant lessons and documents surfaced from the Resources library beside the city's results — so I can understand context and access guidance without navigating to a separate section.

---

## Acceptance Criteria

- [ ] AC-1: Resources associated with this city (via `items.living_lab_id`) appear in a "Lessons & documents" section
- [ ] AC-2: Resources associated with the city's measures (via `items.project_id`) appear in the same section
- [ ] AC-3: Resources associated with KPI definitions (via `items.kpi_definition_id`) also appear beside the relevant chart in Section 3
- [ ] AC-4: No schema change is required — uses existing `items` table associations
- [ ] AC-5: A city with no associated resources shows no empty section (absence = nothing)
- [ ] AC-6: Each resource entry shows its title, description, association type, and date

---

## Implementation Steps

### Step 1: Add `getResourcesForLab` to ApiClient

File: `src/lib/api-client/ApiClient.ts`

Add a method that fetches resources associated with a lab. This calls the existing items API endpoint with appropriate filters:

```typescript
async getResourcesForLab(labId: number): Promise<IResource[]> {
  // Fetch items where category.type = "RESOURCES" 
  // AND (living_lab_id = labId OR project_id IN lab's measure IDs
  //      OR kpi_definition_id IN lab's KPI IDs)
  const response = await this.get(`/api/v1/items?labId=${labId}&categoryType=RESOURCES`);
  return response.data;
}
```

If the existing `/api/v1/items` endpoint does not support filtering by `labId` plus associated measure/KPI IDs, extend the query in `ItemsRepository` to support this lookup. The query uses existing foreign key columns — no migration needed.

### Step 2: Create InsightsCityLessons component

File: `src/components/react/Insights/InsightsCityLessons.tsx`

Renders a list of resource cards with title, description, association label, and date. External links open in a new tab. See architecture.md section 4b.

### Step 3: Wire resources into the city profile page

File: `src/pages/insights/city/[labId].astro`

After fetching the lab data:
1. Call `api.getResourcesForLab(labId)` to get associated resources
2. Pass resources to `InsightsCityLessons` — render only if `resources.length > 0`
3. Separate KPI-linked resources and pass them to `InsightsCityKPIs` for inline annotations

### Step 4: Add KPI chart resource annotations

File: `src/components/react/Insights/InsightsCityKPIs.tsx`

Accept an optional `kpiResources` prop. For each KPI card, filter resources by `kpi_definition_id`. If matches exist, render a small "Related documents" link or inline card beneath the chart.

### Step 5: Export component

File: `src/components/react/Insights/index.ts`

Add `InsightsCityLessons` to exports.

### Step 6: Write tests

```typescript
// src/components/react/Insights/InsightsCityLessons.test.tsx
describe("InsightsCityLessons", () => {
  it("renders resource cards with title and description", () => { ... });
  it("shows association type label (city, measure, or KPI)", () => { ... });
  it("renders external links with target=_blank", () => { ... });
  it("does not render when resources array is empty", () => { ... });
});
```

### Step 7: Final verification

- [ ] City with resources — Lessons section renders with cards
- [ ] City without resources — no empty section, no "Lessons" heading
- [ ] KPI-linked resource appears beside the relevant chart
- [ ] Resource date displays correctly
- [ ] External resource links open in new tab
- [ ] No database migration required — verify with `npm run db:generate`
- [ ] Run `npm run test:run`
- [ ] Run `npm run build`

---

## Out of Scope

- Authoring lesson notes (WP1 responsibility)
- New database fields or schema changes
- Resource editing or admin interface
- Resource search or filtering within the Lessons section
- i18n / translations

---

## PR Checklist

- [ ] Included in same PR as T14
- [ ] Lessons section renders from existing item associations
- [ ] No schema change
- [ ] Empty state = no section rendered
- [ ] KPI-linked resources annotate charts
- [ ] All tests pass
