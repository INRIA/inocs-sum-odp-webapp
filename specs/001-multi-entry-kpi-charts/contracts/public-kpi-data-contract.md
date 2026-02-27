# Contract: Public KPI Data View Input

## Purpose
Define the front-end contract used by public KPI pages/components to support multi-entry series with backward compatibility.

## Producer
- Front-end data shaping layer (Astro pages + helper utilities), using backend payload as source.

## Consumer
- `KPIsDashboard` and KPI cards/timeline components used in:
  - `src/pages/data/kpis.astro`
  - `src/pages/living-lab-city/[labId].astro`

## Contract Shape

```ts
interface IKpiResultGroup extends IIKpiResultBeforeAfter {
  results: IKpiResult[]; // sorted by date ASC
}

interface ILivingLabKpiData {
  id: number;
  name: string;
  kpiResults: IKpiResultGroup[];
}
```

## Contract Rules
- `results[]` is the canonical source for rendered points.
- `result_before`/`result_after` may exist during migration but must be treated as compatibility aliases.
- Consumers must not assume exactly two entries.
- Entries are displayed oldest to newest.
- Invalid entries (missing/invalid `date` or non-numeric `value`) are ignored safely.

## Compatibility Guarantees
- If legacy fields are still present, rendering remains valid.
- If only `results[]` is present, consumers still work through normalization/adapters.

## Non-goals
- No backend schema/API modifications in this feature.
- No change to chart interactions, tooltip behavior, or filtering UX semantics.
