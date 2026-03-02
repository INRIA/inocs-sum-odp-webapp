# Research: CSV Dataset Download

**Phase**: 0 | **Feature**: 001-csv-download | **Date**: 2026-02-27

---

## R-001: CSV Serialization Strategy

**Question**: Should we use an external library (`csv-stringify`, `papaparse`) or implement inline CSV generation?

**Decision**: Inline CSV serialization via a static `CsvSerializer` utility class.

**Rationale**:
- The export schema is fully known and fixed (2 export types, fixed column sets).
- Row volume is bounded and predictable (at most a few thousand rows per export).
- A ~30-line serializer covers 100% of the requirements: header row, double-quote wrapping, `"` → `""` escaping, newline sanitization.
- Adding `csv-stringify` or `papaparse` adds dependency maintenance overhead for zero functional gain at this scope.
- An inline utility is trivially unit-testable without mocks.

**Alternatives considered**:
- `csv-stringify` (Node.js streams): provides streaming, but streaming CSV via Astro `Response` is not the default pattern here and adds complexity without measurable benefit at this scale.
- `papaparse`: primarily a browser CSV parser, not suited for server-side generation.

---

## R-002: ApiClient — Handling Non-JSON (blob) Responses

**Question**: The existing `ApiClient.request<T>()` returns `null` for non-JSON content types. How should CSV blob downloads be handled?

**Decision**: Add a new `downloadCsvBlob(path: string): Promise<Blob>` method to `ApiClient` that does NOT reuse `request<T>()`.

**Rationale**:
- `request<T>()` silently returns `null` when `Content-Type` is not `application/json` (lines 86–91 in `ApiClient.ts`). Patching it to handle both cases would increase its complexity and risk of regression.
- A dedicated `downloadCsvBlob()` method is explicit about its purpose, mirrors the existing naming convention, and is trivially mockable in tests.
- Browser-side, the method returns a `Blob` which the component converts to an object URL and triggers programmatically via a temporary `<a>` element — the standard browser pattern for file downloads without navigation.

**Alternatives considered**:
- Patching `request<T>()` to return `Blob | T | null`: rejected — complicates the generic and breaks the existing caller contract.
- Using a plain `fetch()` in the component: rejected — bypasses `ApiClient`'s auth token injection logic.

---

## R-003: RButton Size Mapping

**Question**: The user spec lists `sm, md, lg` as button sizes. `RButton` exposes `xs | md | lg`. How to reconcile?

**Decision**: `TriggerDownloadCsv` receives `size?: 'sm' | 'md' | 'lg'` in its own props interface. Internally, `'sm'` maps to `RButton` size `'xs'`. `'md'` and `'lg'` pass through unchanged.

**Rationale**:
- The external prop name matches user expectations and spec language.
- No modification to `RButton` is needed.
- The internal mapping is a single-line lookup table, clearly documented in the component.

**Alternatives considered**:
- Adding `sm` to `RButton`'s `ButtonSize` type: rejected — requires a new CSS class and modifies a shared component beyond feature scope.

---

## R-004: Filter Query Parameter Encoding

**Question**: How should filter parameters be encoded for the export endpoints?

**Decision**: Only single-value filters are supported per request. Each filter is a plain integer query param: `?living_lab_id=3`, `?category_id=7`, etc. Multiple distinct filters can be combined: `?living_lab_id=3&kpidefinition_id=12`.

**Rationale**:
- The spec does not require multi-value selection (e.g., download KPIs for multiple categories simultaneously). Each button click has a specific, scoped context.
- Single-value params are simplest to validate (positive integer or absent) and document.

**Alternatives considered**:
- `?category_id=[1,2,3]` array syntax (as used in the existing `/items` route): not needed for this feature's scope; would add validation complexity without user value.

---

## R-005: BigInt Serialization in CSV

**Question**: Prisma returns `BigInt` for all `@db.UnsignedBigInt` fields. How to handle in CSV output?

**Decision**: All BigInt ID columns are **excluded** from CSV output by design (no internal IDs in user-facing exports). Non-ID numeric values (`value` in `kpiresults`) are `Float` and serialize trivially. The column mapping in the repository ensures no `BigInt` reaches the serializer.

**Rationale**:
- Internal IDs are not meaningful to end users in a download context.
- Excluding BigInt from the serializer removes a class of runtime errors (`TypeError: Do not know how to serialize a BigInt`) entirely.

---

## R-006: KpiCard Integration — Required Props

**Question**: Are `living_lab_id` and `kpidefinition_id` available inside `KpiCard` without adding new props?

**Decision**: Both IDs are present on existing props:
- `kpi.id` → `kpidefinition_id`
- `kpiResults.living_lab_id` → `living_lab_id`

No new props need to be added to `KpiCard`. `TriggerDownloadCsv` is rendered conditionally only when `kpiResults` is defined.

**Rationale**: Avoids prop drilling; uses data already in scope at the component boundary.

---

## R-007: MySQL vs PostgreSQL Constitution Discrepancy

**Question**: The constitution mandates PostgreSQL, but `schema.prisma` declares `provider = "mysql"`. How is this handled?

**Decision**: Use MySQL as per the actual schema. Document as a pre-existing exception in `plan.md` and `spec.md:FR-DATA-001`. Do not change the schema provider for this feature.

**Rationale**: All existing features in the codebase use MySQL. Changing the database engine is entirely out of scope. The spirit of the constitution principle — use Prisma as the only data layer, no raw SQL, no second databases — is fully respected.

---

## R-008: Empty Dataset Handling

**Question**: What happens when filters yield zero rows?

**Decision**:
- **Backend**: `CsvExportService` throws `EmptyCsvError` when the repository returns an empty array. The API routes catch it and return HTTP 404: `{ "error": "No data found for the requested filters" }`.
- **Frontend**: `TriggerDownloadCsv` catches the `ApiDownloadError` thrown by `downloadCsvBlob()` on a 404 response, and sets an inline error state message: "No data available for the selected filters."

**Rationale**: FR-008 explicitly requires preventing empty CSV bodies. HTTP 404 + client error message fulfills both FR-007 (meaningful error code) and FR-008 (no empty file served).

---

## R-009: Astro client:* Directive for React Island

**Question**: `TriggerDownloadCsv` is a React component used inside `KpiCard` (also React). Does it need an Astro `client:*` directive?

**Decision**: No directive is required inside `KpiCard.tsx` itself — React-to-React rendering does not involve Astro's hydration boundary. However, any **Astro page or `.astro` component** that directly embeds `TriggerDownloadCsv` or a parent component containing it must ensure the island is hydrated with `client:load` (interactive immediately) or `client:visible` (hydrated when visible). Without a directive, the button is rendered as static HTML and `onClick` never fires.

**Rationale**: This is a fundamental Astro constraint for all interactive islands. Missing the directive is a silent runtime bug — the button appears but does nothing. Documented in `plan.md` and reflected in FR-ARCH-001.
