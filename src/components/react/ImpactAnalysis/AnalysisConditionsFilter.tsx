import React, { useState, useMemo } from "react";
import type { IKpiGroup, IKpiVariationData } from "../../../types";
import { CardFilter, Tooltip } from "../ui";
import { AnalysisSectionDivider } from "../ui/AnalysisSectionDivider";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { isCuratedDomain, hasCuratedSet } from "../../../config/curatedDomains";

interface AnalysisConditionsFilterProps {
  kpiGroups: IKpiGroup[];
  selectedGroupId?: string;
  onGroupSelect: (groupId: string | number) => void;
  kpiVariationsData?: Record<string, IKpiVariationData>;
  variationsByKpis?: Record<string, IKpiVariationData>;
}

export const AnalysisConditionsFilter: React.FC<
  AnalysisConditionsFilterProps
> = ({
  kpiGroups,
  selectedGroupId,
  onGroupSelect,
  kpiVariationsData,
  variationsByKpis,
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!kpiGroups || kpiGroups.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-gray-600">No KPI groups available for analysis.</p>
      </div>
    );
  }

  // When hasCuratedSet is true and showAll is false, filter to curated domains only.
  // Otherwise show all. When the curated set only has -1 placeholder, hasCuratedSet
  // is false and all domains are always shown (graceful degradation).
  const visibleGroups = useMemo(() => {
    if (!hasCuratedSet || showAll) return kpiGroups;
    const curated = kpiGroups.filter((g) => isCuratedDomain(g.id));
    // Graceful degradation: if curated filter would hide everything, show all
    return curated.length > 0 ? curated : kpiGroups;
  }, [kpiGroups, showAll]);

  const hiddenCount = kpiGroups.length - visibleGroups.length;

  return (
    <div>
      <AnalysisSectionDivider
        step={1}
        title="Interest Domain for Analysis"
        // subtitle="Select the analysis conditions: KPI group"
        description="The KPIs have been grouped by scope of interest"
      />

      <div className="mt-6 flex flex-col items-center gap-2 lg:gap-4 content-center">
        <CardFilter
          groups={visibleGroups.map((group) => ({
            id: group.id,
            name: group.name,
            kpis: group.kpis ?? [],
          }))}
          selectedGroupId={selectedGroupId}
          onGroupSelect={onGroupSelect}
          variant={"detailed"}
          kpiVariationsData={kpiVariationsData}
          variationsByKpis={variationsByKpis}
        />

        {/* Toggle between curated and all domains */}
        {hasCuratedSet && (
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="mt-2 text-sm text-primary underline hover:text-primary/80 transition-colors"
          >
            {showAll
              ? "Show recommended domains"
              : `Show all domains${hiddenCount > 0 ? ` (${hiddenCount} more)` : ""}`}
          </button>
        )}
      </div>
    </div>
  );
};
