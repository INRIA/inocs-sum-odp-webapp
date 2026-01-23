import React, { useState, useMemo } from "react";
import type { IKpiVariation } from "../../../types";
import {
  sortKpiVariations,
  formatKpiDisplayName,
  type SortColumn,
} from "../../../lib/helpers/impact-analysis-format";
import { getVariationColor } from "../../../lib/helpers/impact-analysis-format";

interface KpiVariationsTableProps {
  kpis: IKpiVariation[];
  compact?: boolean;
  maxRows?: number;
}

type SortState = {
  column: SortColumn;
  ascending: boolean;
};

export const KpiVariationsTable: React.FC<KpiVariationsTableProps> = ({
  kpis,
  compact = false,
  maxRows,
}) => {
  const [sortState, setSortState] = useState<SortState>({
    column: "name",
    ascending: true,
  });

  // Sort KPIs (flat list, no grouping)
  const sortedKpis = useMemo(() => {
    const sorted = [...kpis].sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      switch (sortState.column) {
        case "name": {
          // Sort by parent name first, then by KPI name
          const aParent = a.kpiParentName || "";
          const bParent = b.kpiParentName || "";
          const parentCmp = aParent.localeCompare(bParent);
          if (parentCmp !== 0) {
            return sortState.ascending ? parentCmp : -parentCmp;
          }
          aVal = a.kpiName.toLowerCase();
          bVal = b.kpiName.toLowerCase();
          break;
        }
        case "variation":
          aVal = a.ratioVariation ?? -Infinity;
          bVal = b.ratioVariation ?? -Infinity;
          break;
        case "valueBefore":
          aVal = a.valueBefore ?? -Infinity;
          bVal = b.valueBefore ?? -Infinity;
          break;
        case "valueAfter":
          aVal = a.valueAfter ?? -Infinity;
          bVal = b.valueAfter ?? -Infinity;
          break;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortState.ascending
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const aNum = typeof aVal === "number" ? aVal : 0;
      const bNum = typeof bVal === "number" ? bVal : 0;
      return sortState.ascending ? aNum - bNum : bNum - aNum;
    });

    if (maxRows && sorted.length > maxRows) {
      return sorted.slice(0, maxRows);
    }
    return sorted;
  }, [kpis, sortState, maxRows]);

  const handleSort = (column: SortColumn) => {
    if (sortState.column === column) {
      setSortState({ column, ascending: !sortState.ascending });
    } else {
      setSortState({ column, ascending: column === "name" });
    }
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortState.column !== column) return null;
    return sortState.ascending ? " ↑" : " ↓";
  };

  if (kpis.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">No KPI data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th>#</th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("name")}
              >
                KPI Name {getSortIndicator("name")}
              </th>
              <th
                className="px-4 py-3 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 w-32"
                onClick={() => handleSort("variation")}
              >
                Variation % {getSortIndicator("variation")}
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200">
            {sortedKpis.map((kpi, idx) => (
              <tr
                key={`${kpi.kpiId}-${idx}`}
                className="bg-white hover:bg-gray-50"
              >
                <td className="text-center">{idx + 1}</td>
                {/* KPI Name with Parent and Transport Mode */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-sm text-gray-800 font-medium">
                      {kpi.kpiParentName ?? kpi.kpiName}
                      {kpi.transportModeName && (
                        <span className="text-gray-500 font-normal">
                          {" "}
                          ({kpi.transportModeName})
                        </span>
                      )}
                    </div>
                    {kpi.kpiParentName && (
                      <div className="text-xs font-semibold text-gray-600">
                        {kpi.kpiName}
                      </div>
                    )}
                  </div>
                </td>

                {/* Variation Percentage */}
                <td
                  className="px-4 py-3 text-right"
                  style={{ color: getVariationColor(kpi.ratioVariation) }}
                >
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-base">
                      {kpi.ratioVariationPercentage}
                    </span>
                    {!compact &&
                      kpi.valueBefore !== null &&
                      kpi.valueAfter !== null && (
                        <span className="text-xs text-gray-500 font-normal">
                          {kpi.valueBefore.toFixed(2)} →{" "}
                          {kpi.valueAfter.toFixed(2)}
                        </span>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More Link */}
      {maxRows && kpis.length > maxRows && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
          <button className="text-sm text-primary font-medium hover:underline">
            Show all {kpis.length} KPIs
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <span className="text-success font-semibold">Green</span> =
          improvement | <span className="text-danger font-semibold">Red</span> =
          regression
        </p>
      </div>
    </div>
  );
};
