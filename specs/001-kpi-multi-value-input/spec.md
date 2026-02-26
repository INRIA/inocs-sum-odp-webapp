# Feature Specification: KPI Multi-Value Input

**Feature Branch**: `001-kpi-multi-value-input`  
**Created**: 2026-02-24  
**Status**: Draft  
**Scope**: Admin data-entry pages only (`/lab-admin/kpis` and `/lab-admin/modal-split`). Public display pages are not in scope.

## User Scenarios & Testing *(mandatory)*

**Constitution-mandated test requirements for every feature:**
- Tests MUST be authored before implementation code (TDD/SDD).
- At least one new dedicated test file MUST be added per new feature.
- Test design MUST cover happy path, user interactions, information displayed, and edge cases.
- Component/API behavior tests MUST use Vitest + `@testing-library/react`.

### User Story 1 - View All Saved KPI Entries (Priority: P1)

A Lab Admin opens the KPI edition page (or the modal-split page) and immediately sees, for each KPI row, a vertical list of all previously saved measurement entries — each showing its numeric value and its collection date. No entries are hidden or collapsed by default.

**Why this priority**: This is the backward-compatibility baseline. If existing data is not displayed correctly in the new list format, every subsequent story breaks. It also provides immediate value by giving admins a complete historical view of their measurements without any new data entry.

**Independent Test**: Can be fully tested by rendering the KPI table with pre-seeded result data and asserting that all saved entries appear as distinct list items within the correct KPI row.

**Acceptance Scenarios**:

1. **Given** a Living Lab has two saved results for KPI "Cycling share" (values 12% on 2024-01-15 and 18% on 2025-03-10), **When** the admin navigates to `/lab-admin/kpis`, **Then** both entries are visible in the Cycling share row, each showing its value and date, in chronological order.
2. **Given** a KPI has no saved results yet, **When** the admin views that KPI row, **Then** the row shows an empty list with a prompt to add the first entry.
3. **Given** a modal-split KPI has multiple saved results for a specific transport mode, **When** the admin views the modal-split page, **Then** all entries for that transport mode appear in the corresponding row.

---

### User Story 2 - Add a New KPI Result Entry (Priority: P1)

A Lab Admin clicks a "+" button within any KPI row to append a new, blank entry to that KPI's list. The new entry pre-fills with the session default date (or today's date if none has been set). The admin enters a numeric value, optionally adjusts the date, and saves. The entry is immediately persisted and visible in the list.

**Why this priority**: Adding new measurements is the core data-entry action this feature unlocks. Without it the multi-value list is read-only and delivers no new value over the old UI.

**Independent Test**: Can be fully tested by clicking "+" on a KPI row, filling in a value and date, saving, and asserting the new entry appears in the list and is retrievable via the data layer.

**Acceptance Scenarios**:

1. **Given** the admin is on the KPI page, **When** they click "+" on a KPI row, **Then** a new editable entry appears at the bottom of that KPI's list with the current session default date (or today) pre-filled and the value field focused.
2. **Given** a new entry is open with a valid value and date, **When** the admin confirms the save, **Then** the entry is persisted, the row updates to show the new entry, and the editing mode closes.
3. **Given** a new entry has an invalid value (e.g., non-numeric or outside allowed range), **When** the admin tries to save, **Then** the entry is not saved and an inline validation message explains the error.
4. **Given** a new entry has an empty date field, **When** the admin tries to save, **Then** the entry is not saved and an inline message indicates the date is required.

---

### User Story 3 - Edit an Existing KPI Result Entry (Priority: P2)

A Lab Admin clicks an edit control on any individual entry in a KPI's result list. The entry becomes editable in-place (value and date). The admin modifies the value or date and saves. The change is persisted immediately and the list reflects the updated entry.

**Why this priority**: Corrections to existing measurements are a routine admin task. It preserves data accuracy over the life of the Living Lab without requiring deletion and re-entry.

**Independent Test**: Can be fully tested by rendering a KPI row with pre-seeded entries, clicking the edit button on one, changing its value, saving, and asserting the updated value is shown and persisted.

**Acceptance Scenarios**:

1. **Given** a KPI row shows a saved entry, **When** the admin clicks the edit icon on that entry, **Then** the entry's value and date fields become editable.
2. **Given** an entry is in edit mode, **When** the admin changes the value and saves, **Then** the updated value is shown in the list and the entry is no longer in edit mode.
3. **Given** an entry is in edit mode, **When** the admin clicks cancel, **Then** the original value and date are restored and the entry returns to read-only view.
4. **Given** an entry is in edit mode with an invalid value, **When** the admin tries to save, **Then** the save is blocked and a validation message is shown.

---

### User Story 4 - Delete a KPI Result Entry (Priority: P2)

A Lab Admin clicks a delete control on any individual entry in a KPI's result list. After a confirmation step, the entry is removed from the list and permanently deleted from the data store.

**Why this priority**: Erroneous entries must be removable to maintain data integrity. The confirmation step prevents accidental deletion.

**Independent Test**: Can be fully tested by rendering a KPI row with multiple saved entries, clicking delete on one, confirming, and asserting that entry no longer appears in the list or in the data layer.

**Acceptance Scenarios**:

1. **Given** a KPI row has multiple saved entries, **When** the admin clicks the delete icon on one entry, **Then** a confirmation prompt appears before any deletion occurs.
2. **Given** the confirmation prompt is shown, **When** the admin confirms deletion, **Then** the entry is removed from the list and permanently deleted.
3. **Given** the confirmation prompt is shown, **When** the admin cancels, **Then** the entry remains in the list unchanged.
4. **Given** a KPI row has exactly one saved entry, **When** the admin deletes it and confirms, **Then** the row shows the empty-list state.

---

### User Story 5 - Set a Session Default Collection Date (Priority: P3)

A Lab Admin sees a single optional "Default collection date" input at the top of the page (replacing the old separate "before date" and "after date" inputs). When the admin sets a date in this field, every new entry added during the current session uses that date as its initial date. Existing already-saved entries are not affected. If the field is left empty, new entries default to today's date.

**Why this priority**: The default date is a convenience feature for bulk data entry sessions (e.g., a field campaign where all measurements share the same date). It reduces repetitive date entry but is not required for the core add/edit/delete flows.

**Independent Test**: Can be fully tested by setting a default date, adding two new entries on different KPI rows, and asserting both entries pre-fill with that date. Then changing the default date and adding another entry to assert only the newest entry uses the updated date.

**Acceptance Scenarios**:

1. **Given** the admin is on the KPI page with no default date set, **When** they click "+" to add a new entry, **Then** the new entry's date field is pre-filled with today's date.
2. **Given** the admin sets the default date to "2025-06-01", **When** they add a new entry to any KPI row, **Then** the new entry's date field is pre-filled with "2025-06-01".
3. **Given** the admin has already-saved entries in the list, **When** they change the default date, **Then** the dates of the already-saved entries remain unchanged.
4. **Given** the admin has set a default date and added (but not yet saved) a new entry, **When** they change the default date, **Then** the unsaved entry's date updates to the new default date.
5. **Given** the admin clears the default date field, **When** they add a new entry, **Then** the new entry's date field defaults to today's date.

---

### Edge Cases

- What happens when a KPI row has a very large number of saved entries (e.g., 50+)? The list must remain scrollable/usable without breaking the page layout.
- How does the system handle a save failure (e.g., network error or server-side validation)? The entry remains in editing state and an error message is shown; no partial data is silently discarded.
- What happens when two admins edit the same KPI result simultaneously? The last save wins; no special conflict resolution is required (consistent with current behaviour).
- How does the system handle a KPI with both a minimum and maximum allowed value when the admin enters a value outside the range? Inline validation prevents saving and shows the allowed range.
- What happens when the admin deletes an entry that was the chronologically first or last result used by other parts of the system (e.g., impact analysis)? The entry is deleted; downstream display pages are responsible for gracefully handling the reduced result set.
- What happens when the modal-split page is used and a transport mode has no saved results? The row for that transport mode shows the empty-list state with a "+" button.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display all saved KPI result entries for each KPI as a vertically stacked list within the corresponding KPI row, replacing the fixed "before / after" two-field layout on both `/lab-admin/kpis` and `/lab-admin/modal-split`.
- **FR-002**: Each list entry MUST show the numeric value and the collection date in a read-only view by default.
- **FR-003**: Each KPI row MUST include an "Add entry" button ("+") that appends a new editable entry to the bottom of that KPI's list.
- **FR-004**: New entries MUST pre-fill the date field with the session default date if one is set, or today's date otherwise.
- **FR-005**: Each list entry MUST provide an edit control that switches that entry into an editable in-place mode (value field and date field).
- **FR-006**: Each list entry MUST provide a delete control that, after a confirmation step, permanently removes the entry from the data store and from the list.
- **FR-007**: The top of each admin page MUST provide a single optional "Default collection date" input that applies to all new entries added during the current browser session on that page.
- **FR-008**: Changing the default collection date MUST update the date pre-fill for entries added after the change, but MUST NOT modify the date of already-persisted entries.
- **FR-009**: Changing the default collection date MUST update the date field of any new (not yet saved) entries already open in the current session.
- **FR-010**: The system MUST validate that every entry has a numeric value and a date before saving; entries failing validation MUST NOT be persisted and MUST display an inline error message.
- **FR-011**: The internal state of each KPI row MUST hold a list of KPI result entries (keyed by KPI definition ID, and additionally by transport mode ID for modal-split), rather than a fixed before/after pair.
- **FR-012**: All previously saved KPI results MUST load correctly into the new list structure without data loss or reordering; the chronological order MUST be preserved.
- **FR-013**: The overall page layout of `modal-split` and `kpis` admin pages MUST remain unchanged; only the KPI value input area within each table cell or row is replaced.
- **FR-014**: The server-side data-retrieval layer MUST return all KPI results for a given Living Lab in a format the new list-based components can consume directly.
- **FR-TEST-001**: Feature MUST include at least one new dedicated test file covering the new/modified list-based KPI result input components.
- **FR-TEST-002**: Feature tests MUST be created before implementation and initially fail (TDD).
- **FR-ARCH-001**: Feature MUST preserve the Astro SSR and React islands separation of concerns; page-level data fetching remains in Astro, interactive list management remains in React components.
- **FR-DATA-001**: Feature MUST use Prisma with PostgreSQL as the only persistent data layer; no new persistence mechanism is introduced.
- **FR-TS-001**: Feature MUST satisfy TypeScript strict-mode constraints without weakening the existing configuration.

### Key Entities

- **KPI Definition**: Describes a single Key Performance Indicator — its identifier, name, metric type, and allowed value range. One definition is shared across all Living Labs. This entity is read-only within this feature.
- **KPI Result Entry**: A single measurement associated with a KPI Definition and a Living Lab. Its core attributes are: a numeric value, a collection date, the KPI definition it belongs to, the Living Lab it was recorded for, and (for modal-split KPIs) the transport mode it relates to. The system supports an arbitrary number of result entries per KPI Definition per Living Lab.
- **KPI Result List**: The ordered collection of all KPI Result Entries for a specific KPI Definition within a Living Lab (and, for modal-split, within a transport mode). The list is ordered chronologically by collection date.
- **Session Default Date**: A transient, page-scoped date value set by the admin at the top of the page. It lives only in the browser session (not persisted) and influences the initial date pre-fill for any new KPI Result Entries added during that session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Lab Admin can add three or more KPI result entries to a single KPI row — each with a distinct date — within a single session, with all entries persisted correctly and visible in the list after a page reload.
- **SC-002**: All KPI result entries previously saved under the old "before / after" model load and display correctly in the new list UI without any data migration step.
- **SC-003**: An admin can complete a typical data-entry session (view existing entries, add two new entries per KPI across five KPI rows, and set a shared default date) in under five minutes.
- **SC-004**: The unit test suite for the new/modified components achieves 100% coverage of the specified acceptance scenarios (happy path, validation errors, empty state, default-date propagation).
- **SC-005**: No regression is introduced in the public-facing display pages; existing impact analysis and KPI visualisation pages continue to render correctly with the updated data structure.
- **SC-006**: The page layout of both admin pages is visually identical to the current layout except for the KPI value input area, as verified by a side-by-side comparison against the current production pages.

## Assumptions

- The underlying database schema already supports an arbitrary number of KPI result records per KPI definition per Living Lab; no schema migration is required.
- The delete operation is hard-delete (permanent removal), consistent with the existing delete endpoint behaviour.
- Sorting within each KPI's result list is chronological (oldest entry first), matching the sort already applied in the data layer.
- The session default date is not persisted between page visits or browser sessions; it resets each time the page is loaded.
- The modal-split page and the KPI edition page are treated as independent admin surfaces; the session default date on one page does not propagate to the other.
- No bulk-save or "save all" action is required; each entry is saved individually at the moment the admin confirms it (consistent with the current per-entry save behaviour).
- The "confirmation step" for deletion may be a simple browser confirm dialog or an inline confirmation toggle; the precise UI affordance is left to the planning phase.
- Access control is unchanged: only authenticated Lab Admins can reach these pages, enforced by existing middleware.
