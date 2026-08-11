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
  const [selectedLabIds, setSelectedLabIds] = useState<(number | string)[]>(
    labs.map((l) => l.id),
  );

  const normalizeTransportMode = (mode?: string | null): string | null => {
    if (!mode) return null;
    const trimmed = mode.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const buildKpiModeKey = (
    kpiId: number | string,
    mode?: string | null,
  ): string => {
    const normalizedMode = normalizeTransportMode(mode);
    return normalizedMode ? `${kpiId}__${normalizedMode}` : String(kpiId);
  };

  const chartsByName = new Map<string, KpiVariationChartData>();
  chartsByName.set(`Variation per Lab for all KPIs in ${groupName} group`, {
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

  const chartGroups = new Map<
    string,
    {
      parentName: string;
      transportMode: string | null;
      kpis: IKpiVariation[];
    }
  >();

  globalKpiVariations.forEach((kpi) => {
    const parentId = kpi.kpiParentId ?? kpi.kpiId;
    const parentName = kpi.kpiParentName ?? kpi.kpiName ?? "Unnamed KPI";
    const transportMode = normalizeTransportMode(kpi.transportModeName);
    const groupKey = `${parentId}__${transportMode ?? "no-mode"}`;

    if (!chartGroups.has(groupKey)) {
      chartGroups.set(groupKey, {
        parentName,
        transportMode,
        kpis: [],
      });
    }

    chartGroups.get(groupKey)!.kpis.push(kpi);
  });

  chartGroups.forEach((group) => {
    const kpiMap = new Map<string, IKpiVariation>();
    for (const kpi of group.kpis) {
      const kpiModeKey = buildKpiModeKey(kpi.kpiId, kpi.transportModeName);
      if (!kpiMap.has(kpiModeKey)) {
        kpiMap.set(kpiModeKey, kpi);
      }
    }

    const kpis = Array.from(kpiMap.values())
      .map((globalKpi) => {
        const globalMode = normalizeTransportMode(globalKpi.transportModeName);

        // Build variation by lab for this KPI and transport mode
        const byLab: Record<number | string, number> = {};
        for (const lab of livingLabVariations) {
          const labKpi = lab.kpis.find(
            (k) =>
              k.kpiId === globalKpi.kpiId &&
              normalizeTransportMode(k.transportModeName) === globalMode,
          );

          byLab[lab.labId] = toPercent(
            labKpi?.ratioVariation,
            labKpi?.ratioVariationPercentage,
          );
        }

        return {
          id: buildKpiModeKey(globalKpi.kpiId, globalKpi.transportModeName),
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

    const chartTitle = group.transportMode
      ? `${group.parentName} (${group.transportMode})`
      : group.parentName;

    chartsByName.set(chartTitle, { labs, kpis });
  });

  //actions

  const toggleLab = (labId: number | string) => {
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
              <h3 className="text-center">
                Variations per KPI in {groupName} group
              </h3>
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
