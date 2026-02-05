import React, { useMemo, useState } from "react";
import {
  D3KpiLabsVariationsChart,
  type Series,
} from "./D3KpiLabsVariationsChart";
import { COLORS } from "../../../styles/constants";

export interface KpiVariationChartData {
  labs: Array<{ id: string; name: string }>;
  kpis: Array<{
    id: string;
    name: string;
    variation: {
      global: number; // All labs value for this KPI (%)
      byLab: Record<string, number>; // Per lab value for this KPI (%)
    };
  }>;
}

interface KpiVariationChartProps {
  title?: string;
  data: KpiVariationChartData;
  selectedLabIds: string[];
  className?: string;
}

export const KpiVariationChart: React.FC<KpiVariationChartProps> = ({
  title,
  data,
  selectedLabIds = [],
  className,
}) => {
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>(
    data.kpis.map((k) => k.id),
  );

  // Create stable color mapping for each KPI based on their position in data.kpis
  const kpiColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data.kpis.length === 1) {
      // If only one KPI, assign the first color (blue)
      map.set(data.kpis[0].id, COLORS[0]);
      return map;
    }
    data.kpis.forEach((kpi, idx) => {
      map.set(kpi.id, COLORS[(idx + 1) % COLORS.length]);
    });
    return map;
  }, [data.kpis]);

  // Filter labs based on user selection
  const filteredLabs = useMemo(() => {
    return data.labs.filter((lab) => selectedLabIds.includes(lab.id));
  }, [data.labs, selectedLabIds]);

  // Build categories for Y-axis
  const categories = useMemo(() => {
    return filteredLabs.map((lab) => lab.name);
  }, [filteredLabs]);

  // Build KPI series (only for selected KPIs)
  const kpiSeries: Series[] = useMemo(() => {
    return selectedKpiIds
      .map((kpiId) => {
        const kpi = data.kpis.find((k) => k.id === kpiId);
        if (!kpi) return null;

        const values = [
          kpi.variation.global,
          ...filteredLabs.map((lab) => kpi.variation.byLab[lab.id] ?? 0),
        ];

        return {
          name: kpi.name,
          color: kpiColorMap.get(kpiId) || COLORS[1],
          values,
        };
      })
      .filter((s): s is Series => s !== null);
  }, [selectedKpiIds, data.kpis, filteredLabs, kpiColorMap]);

  // Event handlers
  const toggleKpi = (kpiId: string) => {
    setSelectedKpiIds((prev) => {
      if (prev.includes(kpiId)) {
        return prev.filter((id) => id !== kpiId);
      }
      return [...prev, kpiId];
    });
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
    >
      {title && <h4 className="p-1 lg:p-4 flex flex-col">{title}</h4>}
      {/* Chart */}
      <div className="w-full py-4">
        <D3KpiLabsVariationsChart categories={categories} series={kpiSeries} />
      </div>

      {data.kpis.length > 1 && (
        <div className="p-4 ">
          <div className="flex items-center justify-between gap-3 mb-3">
            <small>Click on items to show/hide in the chart</small>
            <span className="text-xs text-gray-500">
              {selectedKpiIds.length}/{data.kpis.length} selected
            </span>
          </div>

          {/* Clickable KPI Legend Items */}
          <div className="flex flex-row flex-wrap gap-1">
            {data.kpis.map((kpi) => {
              const isSelected = selectedKpiIds.includes(kpi.id);
              const color = kpiColorMap.get(kpi.id) || COLORS[1];
              return (
                <button
                  key={kpi.id}
                  onClick={() => toggleKpi(kpi.id)}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 rounded text-left transition-colors"
                >
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 flex-shrink-0"
                    style={{
                      background: isSelected ? color : "transparent",
                      borderColor: color,
                    }}
                    aria-hidden
                  />
                  <span
                    className={isSelected ? "text-gray-900" : "text-gray-500"}
                    title={kpi.name}
                  >
                    {kpi.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
