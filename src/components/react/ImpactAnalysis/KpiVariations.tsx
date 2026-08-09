import React, { useState } from "react";
import type { IKpiGroup, IKpiVariationData } from "../../../types";
import { AnalysisSectionDivider } from "../ui/AnalysisSectionDivider";
import {
  KpiGroupVariationDataTable,
  KpiGroupVariationCharts,
  KpiGroupVariationMap,
} from "./";
import {
  computeEvidenceRatio,
  getEvidenceBadge,
  type EvidenceBadgeConfig,
} from "../../../config/evidenceStrength";

interface KpiVariationsProps {
  selectedGroup: IKpiGroup | null;
  variationsData: IKpiVariationData | null;
  totalPlatformLabs?: number;
}

export const KpiVariations: React.FC<KpiVariationsProps> = ({
  selectedGroup,
  variationsData,
  totalPlatformLabs,
}) => {
  const [viewMode, setViewMode] = useState<"data" | "chart" | "map">("data");

  const divider = (
    <AnalysisSectionDivider
      step={3}
      title="KPI Variations percentage"
      // subtitle={
      //   "Observe and compare " +
      //   selectedGroup?.name +
      //   " KPIs variations among living labs"
      // }
      description={
        "Only cities with enough data collected are included, for KPIs in the scope of " +
        selectedGroup?.name +
        "."
      }
    />
  );

  // No group selected
  if (!selectedGroup) {
    return (
      <div>
        {divider}
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
        {divider}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mt-4">
          <p className="text-gray-700">
            No variations data available for this KPI group.
          </p>
        </div>
      </div>
    );
  }

  // Compute evidence badge for this KPI group
  const labsWithData = variationsData.livingLabVariations.length;
  const kpiObservations = variationsData.allKpiVariations.length;
  const totalLabs = totalPlatformLabs ?? Math.max(labsWithData, 1);
  const totalMeasures = Math.max(kpiObservations, 1);
  const evidenceRatio = computeEvidenceRatio(
    labsWithData,
    kpiObservations,
    totalLabs,
    totalMeasures,
  );
  const badge: EvidenceBadgeConfig = getEvidenceBadge(evidenceRatio);

  return (
    <div>
      {divider}

      <div className="mt-6">
        {/* View mode segmented control */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => setViewMode("data")}
            className={`px-3 py-1.5 text-lg font-bold rounded-md transition-transform hover:scale-105 ${
              viewMode === "data"
                ? "bg-info shadow-lg text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-pressed={viewMode === "data"}
          >
            Data view
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`px-3 py-1.5 text-lg font-bold rounded-md transition-transform hover:scale-105 ${
              viewMode === "chart"
                ? "bg-info shadow-lg text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-pressed={viewMode === "chart"}
          >
            Chart view
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 text-lg font-bold rounded-md transition-transform hover:scale-105 ${
              viewMode === "map"
                ? "bg-info shadow-lg text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-pressed={viewMode === "map"}
          >
            Map view
          </button>
        </div>
        {/* Cities Variations with Global Data */}
        <div>
          {viewMode === "data" ? (
            <KpiGroupVariationDataTable
              livingLabVariations={variationsData.livingLabVariations}
              groupName={variationsData.groupName}
              globalTotalVariation={variationsData.totalVariation}
              globalTotalVariationPercentage={
                variationsData.totalVariationPercentage
              }
              globalKpiVariations={variationsData.allKpiVariations}
              badge={badge}
              cityCount={labsWithData}
            />
          ) : viewMode === "chart" ? (
            <KpiGroupVariationCharts
              groupName={variationsData.groupName}
              livingLabVariations={variationsData.livingLabVariations}
              globalTotalVariation={variationsData.totalVariation}
              globalTotalVariationPercentage={
                variationsData.totalVariationPercentage
              }
              globalKpiVariations={variationsData.allKpiVariations}
            />
          ) : (
            <KpiGroupVariationMap
              livingLabVariations={variationsData.livingLabVariations}
              groupName={variationsData.groupName}
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
