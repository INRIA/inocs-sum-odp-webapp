# Data Model: KPI Multi-Value Input (001)

**Date**: 2026-02-25  
**Derived from**: spec.md + research.md

---

## Existing Entities (no schema change required)

The PostgreSQL `kpiresults` table already supports an arbitrary number of rows per `(kpidefinition_id, living_lab_id, transport_mode_id)` group. **No Prisma migration is needed.**

### `kpiresults` table (unchanged)

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` PK | Auto-generated |
| `kpidefinition_id` | `bigint` FK → `kpidefinitions` | Required |
| `living_lab_id` | `bigint` FK → `labs` | Required |
| `value` | `numeric` | Required; meaning depends on `kpi.metric` |
| `date` | `timestamptz` | Collection date; required |
| `transport_mode_id` | `bigint` FK → `transport_modes` | Nullable; present for modal-split KPIs |

---

## TypeScript Type Changes

### New type: `IKpiResultGroup` (additive — extends existing interface)

```typescript
// src/types/KPIs.ts
export interface IKpiResultGroup extends IIKpiResultBeforeAfter {
  /** All result entries for this KPI+lab+transport_mode, ordered chronologically. */
  results: IKpiResult[];
}
```

`IIKpiResultBeforeAfter` is preserved unchanged. `result_before` / `result_after` are kept on the group object for backward compatibility with display pages that already consume them.

### Updated return type for `ILivingLabPopulated.kpi_results`

```typescript
// src/types/LivingLab.ts (or wherever ILivingLabPopulated is defined)
kpi_results?: IKpiResultGroup[];   // was: IIKpiResultBeforeAfter[]
```

Because `IKpiResultGroup extends IIKpiResultBeforeAfter`, all existing callers that destructure `result_before` / `result_after` remain type-correct without modification.

---

## Repository Layer Change

**File**: `src/bff/repositories/labs.repository.ts` — `mapPrismaLabToLab` method

**Change**: Add `results: groupedResults` to the returned object alongside the existing `result_before` / `result_after`:

```typescript
return {
  living_lab_id: prismaLab?.id || null,
  kpidefinition_id: minKpiResult?.kpidefinition_id || null,
  transport_mode_id: minKpiResult?.transport_mode_id || null,
  result_before: minKpiResult ?? null,   // ← kept for backward compat
  result_after: maxKpiResult ?? null,    // ← kept for backward compat
  results: groupedResults,               // ← new: all entries in chronological order
};
```

`groupedResults` is already computed by the existing filter — no new DB query needed.

---

## React Component State Model

### `KpiResultList` (new parent component)

Owns the **array of KPI results** for one KPI+lab+[transport_mode] group.

| State | Type | Description |
|---|---|---|
| `entries` | `IKpiResult[]` | All persisted entries, ordered by date |
| `isAddingNew` | `boolean` | Whether the "new entry" row is open |

Props it receives: `kpi`, `livingLabId`, `transportModeId?`, `initialResults`, `defaultDate`

Callbacks it exposes: none (manages persistence internally via ApiClient)

### `KpiResultRow` (new child component — one per entry)

Owns **local UI state** for its own row. Never persists its own state after unmount.

| State | Type | Description |
|---|---|---|
| `isEditing` | `boolean` | Whether the row is in edit mode |
| `pendingValue` | `number \| undefined` | Draft numeric value while editing |
| `pendingDate` | `string` | Draft date while editing |
| `error` | `string \| null` | Inline validation message |
| `confirmingDelete` | `boolean` | Whether delete confirmation is visible |

Props it receives: `result` (`IKpiResult`), `kpi`, `onSave`, `onDelete`

### `KpiNewEntryRow` (new child component — the "add" row)

Owns draft state for a single new, not-yet-persisted entry.

| State | Type | Description |
|---|---|---|
| `pendingValue` | `number \| undefined` | Draft value |
| `pendingDate` | `string` | Initialised from `defaultDate` prop at mount; updates via `useEffect([defaultDate])` only while `id` is undefined |
| `error` | `string \| null` | Inline validation message |

Props: `kpi`, `livingLabId`, `transportModeId?`, `defaultDate`, `onSave`, `onCancel`

### `DefaultCollectionDate` (replacement for `BeforeAndAfterDates`)

Stateless except for its own `isEditing` toggle (same pattern as `BeforeAndAfterDates`).

| Prop | Type | Description |
|---|---|---|
| `value` | `string` | Current default date (YYYY-MM-DD) |
| `onChange` | `(date: string) => void` | Called when user confirms a new date |

---

## Validation Rules

These rules are enforced client-side in `KpiResultRow` and `KpiNewEntryRow` before any API call, and server-side in `KpiResultsService.validateCreatePayload`:

| Rule | Applies to |
|---|---|
| `value` must be a finite number | All entries |
| `date` must be a valid ISO date string | All entries |
| For `EnumKpiMetricType.PERCENTAGE`: value must be between `min_value` and `max_value` (hard block) | Percentage KPIs |
| For other metric types: value outside `min_value`/`max_value` is a soft warning, not a hard block | Non-percentage KPIs |

---

## State Transitions

```
KpiResultRow states:
  READ_ONLY ──[click edit]──→ EDITING
  EDITING   ──[cancel]──────→ READ_ONLY
  EDITING   ──[save OK]─────→ READ_ONLY
  EDITING   ──[save error]──→ EDITING (with inline error)
  READ_ONLY ──[click delete]→ CONFIRM_DELETE
  CONFIRM_DELETE ──[cancel]─→ READ_ONLY
  CONFIRM_DELETE ──[confirm]→ (removed from parent list)

KpiNewEntryRow states:
  DRAFT   ──[save OK]──────→ (parent adds to list; row unmounts)
  DRAFT   ──[save error]───→ DRAFT (with inline error)
  DRAFT   ──[cancel]───────→ (row unmounts; isAddingNew = false)
```

---

## Affected File Map

| File | Change type | Reason |
|---|---|---|
| `src/types/KPIs.ts` | Add `IKpiResultGroup` | New group type |
| `src/types/LivingLab.ts` | Update `kpi_results` field type | Use `IKpiResultGroup[]` |
| `src/bff/repositories/labs.repository.ts` | Add `results` field | Expose all entries |
| `src/components/react/form/KpiResultList.tsx` | **New file** | List + add-button |
| `src/components/react/form/KpiResultRow.tsx` | **New file** | Per-entry read/edit/delete row |
| `src/components/react/form/KpiNewEntryRow.tsx` | **New file** | New-entry draft row |
| `src/components/react/form/DefaultCollectionDate.tsx` | **New file** | Replaces `BeforeAndAfterDates` |
| `src/components/react/LivingLabKPIsEdition.tsx` | Modify | Wire new components; replace `BeforeAndAfterDates` + `LivingLabKpiResultsForm` |
| `src/components/react/LivingLabModalSplit.tsx` | Modify | Wire new components; replace `BeforeAndAfterDates` + `LivingLabKpiResultsForm` |
| `src/pages/lab-admin/kpis.astro` | Modify (prop only) | Remove `valueBeforeDate`/`valueAfterDate` props |
| `src/pages/lab-admin/modal-split.astro` | Modify (prop only) | Remove `valueBeforeDate`/`valueAfterDate` props |
| `src/components/react/form/KpiResultList.test.tsx` | **New test file** | Primary test coverage |
| `src/components/react/form/DefaultCollectionDate.test.tsx` | **New test file** | Default date component tests |

### Files NOT changed
- `src/bff/services/kpiresults.service.ts` — upsert and delete endpoints are sufficient; no new server endpoints needed.
- `src/lib/api-client/ApiClient.ts` — `upsertLivingLabKpiResults` and `deleteKpiResult` already exist.
- `src/pages/data/*` — public display pages; not in scope.
- `src/components/react/ImpactAnalysis/*` — display-only; not in scope.
- `src/components/react/form/LivingLabKpiResultForm.tsx` — retained unchanged (used by `KpiResultRow` internally or superseded; to be confirmed during implementation).
