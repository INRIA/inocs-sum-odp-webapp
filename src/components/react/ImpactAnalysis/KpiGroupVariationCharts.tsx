import React, { useState } from "react";
import type { IKpiVariation, ILivingLabVariation } from "../../../types";
import {
  KpiVariationChart,
  type KpiVariationChartData,
} from "./KpiVariationChart";
import { Badge } from "../ui";

interface KpiGroupVariationChartsProps {
  groupName?: string;
  livingLabVariations: ILivingLabVariation[];
  globalTotalVariation?: number | null;
  globalTotalVariationPercentage?: string;
  globalKpiVariations?: IKpiVariation[];
}

// Helper to convert variation values to percentage
function toPercent(
  valueRatio: number | null | undefined,
  valuePct: string | null | undefined,
): number {
  if (typeof valueRatio === "number" && isFinite(valueRatio))
    return valueRatio * 100;
  if (valuePct && typeof valuePct === "string") {
    const n = parseFloat(valuePct.replace("%", ""));
    if (isFinite(n)) return n;
  }
  return 0;
}

export const KpiGroupVariationCharts: React.FC<
  KpiGroupVariationChartsProps
> = ({
  groupName,
  livingLabVariations,
  globalTotalVariation,
  globalTotalVariationPercentage,
  globalKpiVariations = [],
}) => {
  const labs = livingLabVariations.map((lab) => ({
    id: lab.labId,
    name: lab.labName,
  }));
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>(
    labs.map((l) => l.id),
  );

  const chartsByName = new Map<string, KpiVariationChartData>();
  chartsByName.set(`Variation per Lab for all KPIs in ${groupName}`, {
    labs,
    kpis: [
      {
        id: "overall",
        name: "Overall Variation",
        variation: {
          global: toPercent(
            globalTotalVariation,
            globalTotalVariationPercentage,
          ),
          byLab: Object.fromEntries(
            livingLabVariations.map((lab) => [
              lab.labId,
              toPercent(lab.totalVariation, lab.totalVariationPercentage),
            ]),
          ),
        },
      },
    ],
  });

  const uniqueParentKpiIds = new Set<string>();
  globalKpiVariations.forEach((kpi) => {
    const parentId = kpi.kpiParentId ?? kpi.kpiId;
    uniqueParentKpiIds.add(parentId);
  });

  uniqueParentKpiIds.forEach((parentKpiId) => {
    const kpisForParent = globalKpiVariations.filter((kpi) => {
      // const pid = kpi.kpiParentId ?? kpi.kpiId;
      return [kpi.kpiParentId, kpi.kpiId].includes(parentKpiId);
    });

    const kpiMap = new Map<string, IKpiVariation>();
    for (const kpi of kpisForParent) {
      if (!kpiMap.has(kpi.kpiId)) {
        kpiMap.set(kpi.kpiId, kpi);
      }
    }

    const kpis = Array.from(kpiMap.values())
      .map((globalKpi) => {
        // Build variation by lab for this KPI
        const byLab: Record<string, number> = {};
        for (const lab of livingLabVariations) {
          const labKpi = lab.kpis.find((k) => k.kpiId === globalKpi.kpiId);
          byLab[lab.labId] = toPercent(
            labKpi?.ratioVariation,
            labKpi?.ratioVariationPercentage,
          );
        }

        return {
          id: globalKpi.kpiId,
          name: globalKpi.kpiName,
          variation: {
            global: toPercent(
              globalKpi.ratioVariation,
              globalKpi.ratioVariationPercentage,
            ),
            byLab,
          },
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const parentKpiName =
      kpisForParent[0]?.kpiParentName ??
      kpisForParent[0]?.kpiName ??
      "Unnamed KPI";
    chartsByName.set(parentKpiName, { labs, kpis });
  });

  //actions

  const toggleLab = (labId: string) => {
    setSelectedLabIds((prev) => {
      if (prev.includes(labId)) {
        return prev.filter((id) => id !== labId);
      }
      return [...prev, labId];
    });
  };

  const selectAllLabs = () => {
    setSelectedLabIds(labs.map((l) => l.id));
  };

  return (
    <div>
      {/* Filters Section */}
      <div className=" bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Filter by Living Lab
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllLabs}
              className="text-xs text-primary hover:underline font-medium"
            >
              Select All
            </button>
            <span className="text-xs text-gray-500 ml-2">
              {selectedLabIds.length}/{labs.length} selected
            </span>
          </div>
        </div>
        <div className="flex justify-center flex-wrap gap-2">
          {labs.map((lab) => {
            const isSelected = selectedLabIds.includes(lab.id);
            const displayName =
              lab.name.length > 10
                ? lab.name.substring(0, 10) + "..."
                : lab.name;
            return (
              <Badge
                key={lab.id}
                size="sm"
                color={isSelected ? "primary" : "light"}
                className="cursor-pointer border transition-all hover:shadow-md"
                onClick={() => toggleLab(lab.id)}
                title={lab.name}
              >
                {displayName}
              </Badge>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {Array.from(chartsByName.entries()).map(([name, data], index) =>
          index === 0 ? (
            <div className="col-span-2 space-y-8">
              <KpiVariationChart
                key={name}
                title={name}
                data={data}
                selectedLabIds={selectedLabIds}
              />
              <h3 className="text-center">Variations per KPI in {groupName}</h3>
            </div>
          ) : (
            <KpiVariationChart
              key={name}
              title={name}
              data={data}
              selectedLabIds={selectedLabIds}
            />
          ),
        )}
      </div>
    </div>
  );
};
