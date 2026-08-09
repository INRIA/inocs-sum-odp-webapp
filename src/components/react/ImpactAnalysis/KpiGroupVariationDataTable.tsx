import React, { useState } from "react";
import { KpiVariationCard } from "./KpiVariationCard";
import { KpiVariationsTable } from "./KpiVariationsTable";
import type { ILivingLabVariation, IKpiVariation } from "../../../types";
import { InfoAlert } from "../ui";
import { EvidenceBadge } from "./EvidenceBadge";
import type { EvidenceBadgeConfig } from "../../../config/evidenceStrength";

interface KpiGroupVariationCardProps {
  livingLabVariations: ILivingLabVariation[];
  groupName?: string;
  globalTotalVariation?: number | null;
  globalTotalVariationPercentage?: string;
  globalKpiVariations?: IKpiVariation[];
  badge?: EvidenceBadgeConfig;
  cityCount?: number;
}

export const KpiGroupVariationDataTable: React.FC<
  KpiGroupVariationCardProps
> = ({
  livingLabVariations,
  groupName,
  globalTotalVariation,
  globalTotalVariationPercentage,
  globalKpiVariations,
  badge,
  cityCount,
}) => {
  const [selectedLabIndex, setSelectedLabIndex] = useState<number | null>(null);

  if (livingLabVariations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">
          No living lab data available for this group.
        </p>
      </div>
    );
  }

  // Determine if global view is available
  const hasGlobalData = globalKpiVariations && globalKpiVariations.length > 0;

  // Get data based on selection
  const isGlobalView = selectedLabIndex === null;
  const selectedLab = isGlobalView
    ? null
    : livingLabVariations[selectedLabIndex];

  const displayData = isGlobalView
    ? {
        name: "All cities",
        totalVariation: globalTotalVariation ?? null,
        totalVariationPercentage: globalTotalVariationPercentage ?? "N/A",
        kpis: globalKpiVariations ?? [],
        labCount: livingLabVariations.length,
      }
    : {
        name: selectedLab?.labName ?? "",
        totalVariation: selectedLab?.totalVariation ?? null,
        totalVariationPercentage:
          selectedLab?.totalVariationPercentage ?? "N/A",
        kpis: selectedLab?.kpis ?? [],
        labCount: 1,
      };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header with Living Lab Selection */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col items-start justify-between gap-4">
          <h4>{groupName}</h4>
          <h5>KPI Variations - Data Overview</h5>
          {badge && cityCount !== undefined && (
            <EvidenceBadge badge={badge} cityCount={cityCount} />
          )}
          <p>
            Observe how key indicators changed across each city for{" "}
            {displayData.kpis?.length ?? 0} metrics collected.
          </p>
        </div>

        {/* Living Lab Selector */}
        {(livingLabVariations.length > 1 || hasGlobalData) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {/* All Living Labs button (Global) */}
            {hasGlobalData && (
              <button
                onClick={() => setSelectedLabIndex(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedLabIndex === null
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All cities
              </button>
            )}
            {/* Individual lab buttons */}
            {livingLabVariations.map((lab, index) => (
              <button
                key={lab.labId}
                onClick={() => setSelectedLabIndex(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedLabIndex === index
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {lab.labName}
              </button>
            ))}
          </div>
        )}

        {/* Selected Lab Summary */}
        {livingLabVariations.length === 1 && !hasGlobalData && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <span className="font-semibold">{displayData.name}</span>
          </div>
        )}
      </div>

      {/* Total Variation for Selected Lab/Global */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="">
          <KpiVariationCard
            title={displayData.name}
            subtitle={`General variation for ${groupName} KPIs`}
            value={displayData.totalVariationPercentage}
            description={
              isGlobalView
                ? `Average percentage change across all ${
                    displayData.kpis.length
                  } metrics collected across ${
                    displayData.labCount
                  } cit${displayData.labCount > 1 ? "ies" : "y"}`
                : `Average percentage change across all ${displayData.kpis.length} metrics collected in this city`
            }
            size="medium"
            ratioValue={displayData.totalVariation}
          />
        </div>
      </div>

      {/* KPI Variations Table */}
      <div className="p-6">
        <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Individual KPI Variations
        </h5>
        <KpiVariationsTable kpis={displayData.kpis} />

        <InfoAlert variant="warning" title="Data information" className="mt-6">
          <p>
            Small inconsistencies might come from rounding errors (rounded to 2
            decimals by default)
          </p>
        </InfoAlert>
      </div>
    </div>
  );
};
