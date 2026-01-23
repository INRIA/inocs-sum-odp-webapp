import React from "react";
import type { IMeasureCoefficient } from "../../../types";
import { coefficientToPercentage } from "../../../lib/helpers/impact-analysis-format";

interface MeasureImpactCardProps {
  measure: IMeasureCoefficient;
  rank: number;
  size?: "large" | "small";
}

export const MeasureImpactCard: React.FC<MeasureImpactCardProps> = ({
  measure,
  rank,
  size = "large",
}) => {
  const coefficient = measure.coefficient;
  const isPositive = coefficient >= 0;
  const formattedCoefficient = (coefficient * 100).toFixed(2);
  const absCoefficient = Math.abs(coefficientToPercentage(coefficient));

  // Determine colors based on impact
  const colorClasses = isPositive
    ? "from-secondary/20 to-secondary/40 border-secondary text-secondary"
    : "from-danger/20 to-danger/40 border-danger text-danger";

  const badgeClasses = isPositive
    ? "bg-secondary text-white"
    : "bg-danger text-white";

  const iconClasses = isPositive ? "text-secondary" : "text-danger";

  const cardSize = size === "large" ? "p-6" : "p-4";
  const coefficientSize = size === "large" ? "text-xl" : "text-lg";

  return (
    <div
      className={`relative bg-gradient-to-br ${colorClasses} border-2 rounded-xl ${cardSize} shadow-md hover:shadow-lg transition-all duration-200 group`}
    >
      {/* Ranking Badge */}
      <div
        className={`absolute top-3 right-3 ${badgeClasses} rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-sm`}
      >
        {rank}
      </div>

      {/* Measure Name */}
      <h5 className={`font-bold mb-2 pr-5 leading-tight`}>{measure.name}</h5>

      {/* Coefficient Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`${coefficientSize} font-extrabold ${iconClasses}`}>
          {isPositive ? "+" : "-"}
          {absCoefficient}
        </span>
        <span className="text-sm text-dark">level of contribution to KPIs</span>
      </div>

      {/* Impact Direction Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {isPositive ? (
          <>
            <svg
              className={`w-5 h-5 ${iconClasses}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span className="font-medium">Positive contribution</span>
          </>
        ) : (
          <>
            <svg
              className={`w-5 h-5 ${iconClasses}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
            <span className="font-medium">Negative contribution</span>
          </>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-200"></div>
    </div>
  );
};
