# Component Contracts: KPI Multi-Value Input (001)

**Date**: 2026-02-25  
**Scope**: Public interfaces of new and modified React components. These contracts guide both implementation and test authoring.

---

## `KpiResultList`

**File**: `src/components/react/form/KpiResultList.tsx`  
**Role**: Container that renders all saved result rows for one KPI + lab (+ optional transport mode), plus the add-new-entry button and draft row.

### Props

```typescript
interface KpiResultListProps {
  /** The KPI definition (provides metric type, min/max, id). */
  kpi: IKpi;
  /** The Living Lab whose results are being managed. */
  livingLabId: number;
  /** Only present for modal-split KPIs. */
  transportModeId?: number;
  /** Pre-loaded saved results for this KPI+lab+mode, ordered chronologically. */
  initialResults: IKpiResult[];
  /**
   * The session-scoped default date (YYYY-MM-DD) set at the top of the page.
   * New entry rows initialise their date field from this value.
   * Undefined / empty → new entries default to today's date.
   */
  defaultDate?: string;
}
```

### Behaviour contract

| Scenario | Expected behaviour |
|---|---|
| `initialResults` is empty | Renders empty state message + "+" add button |
| `initialResults` has N entries | Renders N `KpiResultRow` components in chronological order + "+" button |
| "+" clicked | Opens one `KpiNewEntryRow`; "+" button is hidden while new entry row is open |
| Save succeeds in `KpiNewEntryRow` | New entry appended to `entries` list; new entry row closes |
| Save succeeds in `KpiResultRow` | Entry updated in `entries` list; row returns to read-only |
| Delete confirmed in `KpiResultRow` | Entry removed from `entries` list |
| `defaultDate` changes | Only affects the open `KpiNewEntryRow` (if any); all `KpiResultRow`s are unaffected |

---

## `KpiResultRow`

**File**: `src/components/react/form/KpiResultRow.tsx`  
**Role**: Renders one saved KPI result entry. Toggles between read-only and edit mode. Provides delete with confirmation.

### Props

```typescript
interface KpiResultRowProps {
  /** The saved result entry to display / edit. */
  result: IKpiResult;
  /** The KPI definition (for validation, metric type, units). */
  kpi: IKpi;
  /**
   * Called after a successful save (upsert) with the updated result.
   * The parent is responsible for updating its list state.
   */
  onSave: (updated: IKpiResult) => void;
  /**
   * Called after a successful delete.
   * The parent is responsible for removing the entry from its list.
   */
  onDelete: (id: number) => void;
}
```

### Behaviour contract

| Scenario | Expected behaviour |
|---|---|
| Initial render | Read-only: shows formatted value + date + edit icon + delete icon |
| Edit icon clicked | Switches to edit mode: value input + date input + save button + cancel button |
| Cancel in edit mode | Restores original value and date; returns to read-only |
| Save with valid inputs | Calls `ApiClient.upsertLivingLabKpiResults`; on success calls `onSave(updated)`; returns to read-only |
| Save with invalid value (out-of-range percentage) | Does NOT call API; shows inline error message; stays in edit mode |
| Save with empty date | Does NOT call API; shows inline "date required" error; stays in edit mode |
| Save API error | Shows error message; stays in edit mode |
| Delete icon clicked | Shows inline confirmation prompt ("Are you sure?") + Confirm + Cancel buttons |
| Delete cancelled | Hides confirmation prompt; entry unchanged |
| Delete confirmed | Calls `ApiClient.deleteKpiResult(id)`; on success calls `onDelete(id)` |
| Delete API error | Shows error message; confirmation prompt dismissed |

---

## `KpiNewEntryRow`

**File**: `src/components/react/form/KpiNewEntryRow.tsx`  
**Role**: Renders a blank draft entry row for adding a new KPI result. Mounts only when the "+" button is clicked; unmounts when saved or cancelled.

### Props

```typescript
interface KpiNewEntryRowProps {
  kpi: IKpi;
  livingLabId: number;
  transportModeId?: number;
  /**
   * Session default date. Initialises the date field at mount.
   * While the row is open (unsaved), changes to this prop update the date field.
   */
  defaultDate?: string;
  /**
   * Called after a successful save with the newly-created result.
   * The parent appends it to the entries list.
   */
  onSave: (created: IKpiResult) => void;
  /** Called when the user cancels adding. The parent closes the row. */
  onCancel: () => void;
}
```

### Behaviour contract

| Scenario | Expected behaviour |
|---|---|
| Mount with `defaultDate` set | Date field pre-filled with `defaultDate` |
| Mount without `defaultDate` | Date field pre-filled with today (ISO YYYY-MM-DD) |
| `defaultDate` prop changes while row is open | Date field updates to new default |
| Save with valid value and date | Calls `ApiClient.upsertLivingLabKpiResults`; on success calls `onSave(created)` |
| Save with missing value | Does NOT call API; shows "value required" error |
| Save with missing date | Does NOT call API; shows "date required" error |
| Save with invalid range (percentage) | Does NOT call API; shows range error |
| Cancel | Calls `onCancel`; row unmounts |

---

## `DefaultCollectionDate`

**File**: `src/components/react/form/DefaultCollectionDate.tsx`  
**Role**: Single optional date picker at the top of the page. Replaces the two-field `BeforeAndAfterDates` component on the admin pages in scope.

### Props

```typescript
interface DefaultCollectionDateProps {
  /** Currently set default date (YYYY-MM-DD). Empty string = not set. */
  value: string;
  /** Called when user confirms a new date or clears the field. */
  onChange: (date: string) => void;
}
```

### Behaviour contract

| Scenario | Expected behaviour |
|---|---|
| Initial render, `value` empty | Shows label "Default collection date" + edit icon; no date displayed |
| Initial render, `value` set | Shows formatted date + edit icon |
| Edit icon clicked | Shows date input pre-filled with current value + confirm + cancel buttons |
| Confirm with a date | Calls `onChange(dateString)`; returns to read-only showing new date |
| Confirm with empty field | Calls `onChange("")`; returns to read-only showing no date |
| Cancel | Restores previous display; `onChange` NOT called |

---

## HTTP API Contracts (existing — no change)

These endpoints already exist and are consumed by `ApiClient`. No new endpoints are added.

### `PUT /api/kpiresults`

**Purpose**: Create or update a single KPI result entry.

**Request body** (`IKpiResultInput`):
```json
{
  "id": 42,                    // optional — omit to create, include to update
  "kpidefinition_id": 7,       // required
  "living_lab_id": 3,          // required
  "value": 0.35,               // required
  "date": "2025-06-01",        // required (YYYY-MM-DD or ISO timestamp)
  "transport_mode_id": null    // optional
}
```

**Response** (`IKpiResultInput`): the created/updated record with its `id`.

**Validation (server-side)**:
- `kpidefinition_id`, `living_lab_id`, `value`, `date` are required; 400 if missing.

### `DELETE /api/kpiresults/:id`

**Purpose**: Permanently delete one KPI result entry.

**Path param**: numeric record `id`.  
**Response**: 204 No Content on success.

---

## Backward Compatibility Contract

`ILivingLabPopulated.kpi_results` changes type from `IIKpiResultBeforeAfter[]` to `IKpiResultGroup[]`. Because `IKpiResultGroup extends IIKpiResultBeforeAfter`, all existing read sites remain type-correct. The `result_before` and `result_after` fields continue to be populated by the repository layer — they are NOT removed.

No migration of existing `kpiresults` rows is required. No new database tables, columns, or indexes are introduced.
