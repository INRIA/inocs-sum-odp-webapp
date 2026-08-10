# Story T20 — Downloads Page

**Epic:** 11 — Data Console & Downloads
**Size:** M
**Dependencies:** T01 (CSV fix), T10 (experience mechanism)
**Branch:** `feature/epic11-data-console`

---

## User Story

> As a researcher, I can find a single page listing every downloadable file on the platform with its content description, schema, coverage, and what it does NOT contain — so I know exactly what data is available before downloading.

---

## Acceptance Criteria

- [ ] AC-1: Every download offered anywhere on the site appears on this page with its schema
- [ ] AC-2: Each file's description states what it does NOT contain
- [ ] AC-3: Each entry shows content, schema (expandable), coverage, period, and licence
- [ ] AC-4: Existing per-card CSV download buttons on other pages continue to work
- [ ] AC-5: The page exposes the underlying KPI series, not only analysis output

---

## Implementation Steps

### Step 1: Define download catalogue data

Create a data structure listing all known downloads:

1. **KPI results CSV** — from `/data/kpis` and `/tools/impact_analysis`
2. **Projects (measures) CSV** — from `/data/measures`
3. **Impact analysis output** — from `/tools/impact_analysis`
4. **KPI Framework PDF** — from `/data/collection-plan`
5. **Resource files** — from `/tools/resources`

Each entry includes: title, description, "does not contain", format, schema fields, coverage, period, licence, download URL, source pages. See architecture.md section 4b-4c.

### Step 2: Create DownloadCatalogue component

File: `src/components/react/DataConsole/DownloadCatalogue.tsx`

Renders a list of download entries. Each entry has expandable schema details. "Does not contain" is highlighted in an amber callout. See architecture.md section 4d.

### Step 3: Create the downloads page

File: `src/pages/data/downloads.astro`

Fetch KPI definitions and labs for dynamic coverage info. Build the catalogue. Pass to `DownloadCatalogue` component. See architecture.md section 4a.

### Step 4: Add to DataConsole barrel export

File: `src/components/react/DataConsole/index.ts`

Export `DownloadCatalogue`.

### Step 5: Verify existing CSV buttons

Navigate to `/data/kpis`, click a CSV download button — confirm it still works (T01 fix). Repeat for `/tools/impact_analysis` and `/data/measures`.

### Step 6: Final verification

- [ ] Navigate to `/data/downloads` — all downloads listed
- [ ] Each entry has schema, coverage, period, licence
- [ ] Each entry states what it does NOT contain
- [ ] Every download link resolves
- [ ] Existing CSV buttons on other pages still work
- [ ] Run `npm run test:run` && `npm run build`

---

## Out of Scope

- New download endpoints or file formats
- Bulk download functionality
- File versioning or change history
- Download analytics or tracking
- Modifying existing download buttons

---

## PR Checklist

- [ ] Included in same PR as T19
- [ ] All platform downloads documented
- [ ] Schema details expandable for each entry
- [ ] "Does not contain" stated for each file
- [ ] Existing CSV downloads verified working
- [ ] All tests pass
