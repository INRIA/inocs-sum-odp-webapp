import React, { useMemo, useState } from "react";
import type { IKpiVariation, ILivingLabVariation } from "../../../types";
import {
  D3KpiLabsVariationsChart,
  type Series,
} from "./D3KpiLabsVariationsChart";

interface KpiGroupVariationChartsProps {
  groupName?: string;
  livingLabVariations: ILivingLabVariation[];
  globalTotalVariation?: number | null;
  globalTotalVariationPercentage?: string;
  globalKpiVariations?: IKpiVariation[];
}

// Helpers
function toPercent(
  valueRatio: number | null | undefined,
  valuePct: string | null | undefined
): number | null {
  if (typeof valueRatio === "number" && isFinite(valueRatio))
    return valueRatio * 100;
  if (valuePct && typeof valuePct === "string") {
    const n = parseFloat(valuePct.replace("%", ""));
    if (isFinite(n)) return n;
  }
  return null;
}

const COLORS = [
  "#3b82f6", // blue-500 (Overall)
  "#22c55e", // green-500
  "#ef4444", // red-500
  "#f59e0b", // amber-500
  "#a855f7", // purple-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
];

export const KpiGroupVariationCharts: React.FC<
  KpiGroupVariationChartsProps
> = ({
  groupName,
  livingLabVariations,
  globalTotalVariation,
  globalTotalVariationPercentage,
  globalKpiVariations = [],
}) => {
  const [search, setSearch] = useState("");
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>([]);
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>(
    livingLabVariations.map((l) => l.labId)
  );
  const maxSelected = 5;

  // Filter living labs based on selection
  const filteredLivingLabs = useMemo(() => {
    return livingLabVariations.filter((lab) =>
      selectedLabIds.includes(lab.labId)
    );
  }, [livingLabVariations, selectedLabIds]);

  const categories = useMemo(() => {
    return ["All Living Labs", ...filteredLivingLabs.map((l) => l.labName)];
  }, [filteredLivingLabs]);

  // Build Overall series
  const overallSeries: Series = useMemo(() => {
    const values: number[] = [];
    // All labs first (index 0 - always present)
    const overallPct = toPercent(
      globalTotalVariation ?? null,
      globalTotalVariationPercentage ?? null
    );
    values.push(overallPct ?? 0);
    // Then each filtered lab
    for (const lab of filteredLivingLabs) {
      const v = toPercent(
        lab.totalVariation ?? null,
        lab.totalVariationPercentage ?? null
      );
      values.push(v ?? 0);
    }
    return { name: "Average variation for all KPIs", color: COLORS[0], values };
  }, [
    globalTotalVariation,
    globalTotalVariationPercentage,
    filteredLivingLabs,
  ]);

  // KPI options and quick lookup maps
  const kpiOptions = useMemo(() => {
    const uniqueById = new Map<string, IKpiVariation>();
    for (const k of globalKpiVariations) {
      if (!uniqueById.has(k.kpiId))
        uniqueById.set(k.kpiId, {
          ...k,
          kpiName: k.kpiParentName
            ? `${k.kpiParentName} › ${k.kpiName}`
            : k.kpiName,
        });
    }
    // Sort by name
    return Array.from(uniqueById.values()).sort((a, b) =>
      a.kpiName.localeCompare(b.kpiName)
    );
  }, [globalKpiVariations]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return kpiOptions;
    return kpiOptions.filter((k) => k.kpiName.toLowerCase().includes(q));
  }, [kpiOptions, search]);

  const kpiSeriesList: Series[] = useMemo(() => {
    const series: Series[] = [];
    selectedKpiIds.forEach((kpiId, idx) => {
      // Color palette cycles
      const color = COLORS[(idx + 1) % COLORS.length];

      // All labs value from globalKpiVariations (index 0)
      const globalKpi = globalKpiVariations.find((k) => k.kpiId === kpiId);
      const values: number[] = [];
      const globalVal = toPercent(
        globalKpi?.ratioVariation ?? null,
        globalKpi?.ratioVariationPercentage ?? null
      );
      values.push(globalVal ?? 0);

      // Per filtered lab values
      for (const lab of filteredLivingLabs) {
        const lk = lab.kpis.find((k) => k.kpiId === kpiId);
        const v = toPercent(
          lk?.ratioVariation ?? null,
          lk?.ratioVariationPercentage ?? null
        );
        values.push(v ?? 0);
      }

      series.push({ name: globalKpi?.kpiName || kpiId, color, values });
    });
    return series;
  }, [selectedKpiIds, filteredLivingLabs, globalKpiVariations]);

  const series: Series[] = useMemo(() => {
    return [overallSeries, ...kpiSeriesList];
  }, [overallSeries, kpiSeriesList]);

  // Handlers
  function toggleKpi(id: string) {
    setSelectedKpiIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxSelected) return prev; // cap
      return [...prev, id];
    });
  }

  function toggleLab(labId: string) {
    setSelectedLabIds((prev) => {
      if (prev.includes(labId)) {
        return prev.filter((id) => id !== labId);
      }
      return [...prev, labId];
    });
  }

  function handleSelectAllLabs() {
    setSelectedLabIds(livingLabVariations.map((l) => l.labId));
  }

  function handleClearAllLabs() {
    setSelectedLabIds([]);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
      <div className="border-b border-gray-200 p-6 gap-4 flex flex-col">
        <div className="flex flex-col items-start justify-between gap-4">
          <h4>{groupName}</h4>
          <h5>KPIs variations - Chart overview</h5>
          <p>
            Vertical grouped bars: All Labs then each Living Lab. Zero baseline
            shows positive/negative changes clearly.
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {series.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-1 text-xs text-gray-700"
            >
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ background: s.color }}
                aria-hidden
              />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Living Lab Filter */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-sm font-semibold text-gray-700">
            Filter Living Labs
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllLabs}
              className="text-xs text-primary hover:underline font-medium"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleClearAllLabs}
              className="text-xs text-gray-500 hover:underline"
            >
              Clear All
            </button>
            <span className="text-xs text-gray-500 ml-2">
              {selectedLabIds.length}/{livingLabVariations.length} selected
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {livingLabVariations.map((lab) => {
            const isSelected = selectedLabIds.includes(lab.labId);
            return (
              <label
                key={lab.labId}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleLab(lab.labId)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>{lab.labName}</span>
              </label>
            );
          })}
        </div>
        {selectedLabIds.length === 0 && (
          <div className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
            Select at least one living lab to view data in the chart.
          </div>
        )}
      </div>

      {/* KPI Selector */}
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <span className="text-sm font-semibold text-gray-700">
          Filter KPIs to display
        </span>
        <div className="flex items-center gap-3 mb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search KPIs to add…"
            className="flex-1 rounded-md border-gray-300 text-sm px-2 py-1"
          />
          <div className="text-xs text-gray-500">
            {selectedKpiIds.length}/{maxSelected} selected
          </div>
        </div>
        <div className="max-h-44 overflow-auto grid grid-cols-1 lg:grid-cols-2 gap-2">
          {filteredOptions.map((opt) => {
            const checked = selectedKpiIds.includes(opt.kpiId);
            return (
              <label
                key={opt.kpiId}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleKpi(opt.kpiId)}
                  disabled={!checked && selectedKpiIds.length >= maxSelected}
                />
                <span className="" title={opt.kpiName}>
                  {opt.kpiName}
                </span>
              </label>
            );
          })}
          {filteredOptions.length === 0 && (
            <div className="text-xs text-gray-500">
              No KPIs match your search.
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        <D3KpiLabsVariationsChart categories={categories} series={series} />
      </div>
    </div>
  );
};
