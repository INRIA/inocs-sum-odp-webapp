# Contract: Modal Split Multi-Entry Series

## Purpose
Define modal split data contract for public dashboard components to render more than two date entries per living lab while preserving current chart behavior.

## Producer
- Front-end helper transformation (`living-lab` helper/dashboard data shaping layer).

## Consumer
- `ModalSplitLivingLabsCards`
- `ModalSplitLivingLabsCard`
- `ModalSplitStackedBarChart`
- `ModalSplitChart`
- `src/pages/data/modal-split.astro`

## Contract Shape (target)

```ts
interface ModalSplitSeriesEntry {
  label: string; // typically year/date label
  date: string;
  year: number;
  data: { label: string; value: number; color: string }[];
}

interface ModalSplitLabData {
  labId: string;
  labName: string;
  entries: ModalSplitSeriesEntry[]; // 0..N, ordered ASC by date

  // Deprecated compatibility aliases (derived from entries)
  before?: ModalSplitSeriesEntry;
  after?: ModalSplitSeriesEntry;
}

interface ModalSplitKpiData {
  kpiId: string;
  kpiNumber: string;
  kpiName: string;
  labs: ModalSplitLabData[];
}
```

## Contract Rules
- `entries[]` must be sorted by date ascending.
- Year filtering applies to each `entries[]` item.
- Charts receive one dataset per filtered entry.
- Tooltip and interaction behavior remains unchanged (data quantity only changes).
- Empty entries yield no rendered chart rows, with existing no-data behavior preserved.

## Compatibility Guarantees
- During migration, consumers may read derived `before/after` aliases.
- New/updated consumers should migrate to `entries[]` as primary source.
