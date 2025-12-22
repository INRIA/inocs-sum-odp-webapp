import React from "react";
import type { ILivingLabAnalysis } from "../../../types";
import { findImplementingLabs } from "../../../lib/helpers/impact-analysis-format";

interface MeasureCityBadgesProps {
  measureId: string;
  livingLabsAnalysis: ILivingLabAnalysis[];
  maxDisplay?: number;
}

export const MeasureCityBadges: React.FC<MeasureCityBadgesProps> = ({
  measureId,
  livingLabsAnalysis,
  maxDisplay = 5,
}) => {
  const labs = findImplementingLabs(measureId, livingLabsAnalysis);

  if (labs.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">Not implemented</span>
    );
  }

  const displayLabs = labs.slice(0, maxDisplay);
  const remainingCount = labs.length - maxDisplay;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {displayLabs.map((lab, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
          title={lab}
        >
          {lab}rr
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
          title={`${remainingCount} more: ${labs.slice(maxDisplay).join(", ")}`}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};
