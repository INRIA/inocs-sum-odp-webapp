# Data Model — Public Multi-Entry KPI Charts

## Entity: `IKpiResult`

Represents one KPI measurement entry.

**Fields**
- `id: number`
- `kpidefinition_id: number`
- `living_lab_id: number`
- `value: number`
- `date: string` (ISO date/time)
- `transport_mode_id?: number`

**Validation Rules**
- `date` must be parseable; invalid dates are ignored by display transformers.
- `value` must be numeric; invalid values are ignored by display transformers.

---

## Entity: `IKpiResultGroup` (new frontend contract)

Extends legacy compatibility model and introduces full series.

**Fields**
- `living_lab_id: number`
- `kpidefinition_id: number`
- `transport_mode_id?: number`
- `result_before?: IKpiResult | null` (deprecated compatibility alias)
- `result_after?: IKpiResult | null` (deprecated compatibility alias)
- `results: IKpiResult[]` (sorted oldest → newest)

**Relationships**
- Many groups belong to one living lab.
- One group maps to one KPI definition (plus optional transport mode context).

**Validation Rules**
- `results` is canonical source for charted points.
- Compatibility aliases are derived from `results` when absent:
  - `result_before = results[0] ?? null`
  - `result_after = results[results.length - 1] ?? null`

---

## Entity: `ILivingLabPopulated` (updated)

**Relevant change**
- `kpi_results?: IKpiResultGroup[]`

**Usage in scope**
- Public pages consume this shape and pass normalized data into React dashboards/cards.

---

## Entity: `TimelineDataPoint`

Derived chart point used by KPI timeline charts.

**Fields**
- `year: number`
- `value: number`
- `date: string`

**Derivation**
- Produced from each valid `IKpiResult` in `results[]`.

---

## Entity: `ModalSplitEntry`

Derived per-date modal split dataset per lab/KPI.

**Fields**
- `label: string` (year or date label for chart row)
- `date: string`
- `year: number`
- `data: { label: string; value: number; color: string }[]`

**Derivation**
- Group by date for one `lab + kpi` then map transport-mode values to stacked-bar segments.

---

## State Transitions

### Transition A: Incoming group normalization
1. Receive group from API/front-end boundary.
2. If `results` exists: sort ascending by `date`.
3. If `results` missing but `result_before`/`result_after` present: synthesize `results` from available values.
4. Derive compatibility aliases from normalized `results`.

### Transition B: KPI timeline rendering
1. Filter groups by KPI id + selected labs.
2. Flatten valid `results[]` entries.
3. Filter by selected years.
4. Render all remaining points in chronological order.

### Transition C: Modal split rendering
1. Filter groups by modal split KPI ids.
2. Group each lab/KPI series by date.
3. Build chart datasets per date entry.
4. Filter entries by selected years before rendering.
