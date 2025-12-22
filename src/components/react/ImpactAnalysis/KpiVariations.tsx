import React, { useState } from "react";
import type { IKpiGroup, IKpiVariationData } from "../../../types";
import { AnalysisSectionDivider } from "../AnalysisSectionDivider";
import { KpiGroupVariationCard } from "./KpiGroupVariationCard";
import { KpiGroupVariationCharts } from "./KpiGroupVariationCharts";

interface KpiVariationsProps {
  selectedGroup: IKpiGroup | null;
  variationsData: IKpiVariationData | null;
}

export const KpiVariations: React.FC<KpiVariationsProps> = ({
  selectedGroup,
  variationsData,
}) => {
  const [viewMode, setViewMode] = useState<"data" | "chart">("data");

  // No group selected
  if (!selectedGroup) {
    return (
      <div>
        <AnalysisSectionDivider
          step={3}
          title="KPI Variations"
          subtitle="Observe and compare KPI variations among living labs"
          description="Only Living Labs with enough data collected are included"
        />
        <p className="text-gray-600 mt-4">
          Please select a KPI group above to view variations.
        </p>
      </div>
    );
  }

  // Group selected but no variations data
  if (!variationsData || variationsData.livingLabVariations.length === 0) {
    return (
      <div>
        <AnalysisSectionDivider
          step={3}
          title="KPI Variations"
          subtitle="Observe and compare KPI variations among living labs"
          description="Only Living Labs with enough data collected are included"
        />
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mt-4">
          <p className="text-gray-700">
            No variations data available for this KPI group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AnalysisSectionDivider
        step={3}
        title="KPI Variations"
        subtitle="Observe and compare KPI variations among living labs"
        description="Only Living Labs with enough data collected are included"
      />

      <div className="mt-6 space-y-6">
        {/* View mode segmented control */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => setViewMode("data")}
            className={`px-3 py-1.5 text-sm rounded-md ${
              viewMode === "data"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
            aria-pressed={viewMode === "data"}
          >
            Data
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`px-3 py-1.5 text-sm rounded-md ${
              viewMode === "chart"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
            aria-pressed={viewMode === "chart"}
          >
            Chart
          </button>
        </div>
        {/* Living Labs Variations with Global Data */}
        <div>
          {viewMode === "data" ? (
            <KpiGroupVariationCard
              livingLabVariations={variationsData.livingLabVariations}
              groupName={variationsData.groupName}
              globalTotalVariation={variationsData.totalVariation}
              globalTotalVariationPercentage={
                variationsData.totalVariationPercentage
              }
              globalKpiVariations={variationsData.allKpiVariations}
            />
          ) : (
            <KpiGroupVariationCharts
              groupName={variationsData.groupName}
              livingLabVariations={variationsData.livingLabVariations}
              globalTotalVariation={variationsData.totalVariation}
              globalTotalVariationPercentage={
                variationsData.totalVariationPercentage
              }
              globalKpiVariations={variationsData.allKpiVariations}
            />
          )}
        </div>
      </div>
    </div>
  );
};
