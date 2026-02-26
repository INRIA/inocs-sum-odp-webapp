import React from "react";
import type { IMeasureCoefficient } from "../../../types";
import { formatCoefficient } from "../../../lib/helpers/impact-analysis-format";

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

  // Determine colors based on impact
  const colorClasses = ""; //isPositive
  // ? "from-secondary/20 to-secondary/40 border-secondary text-dark"
  // : "from-danger/20 to-danger/40 border-danger text-dark";

  const badgeClasses = isPositive
    ? "bg-secondary text-white"
    : "bg-danger text-white";

  const iconClasses = isPositive ? "text-secondary" : "text-danger";

  const cardSize = size === "large" ? "p-6" : "p-2";
  const coefficientSize = size === "large" ? "text-xl" : "text-lg";

  return (
    <div
      className={`relative bg-gradient-to-br ${colorClasses} border-2 rounded-xl ${cardSize} shadow-md hover:shadow-lg transition-all duration-200 group`}
    >
      {/* Ranking Badge */}
      <div
        className={`absolute top-2 left-2 ${badgeClasses} rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm shadow-sm`}
      >
        {rank}
      </div>
      <div className="flex flex-row">
        {/* Measure Name */}
        <h6 className={`w-2/3 font-bold pl-7 leading-tight`}>{measure.name}</h6>

        {/* Coefficient Value */}
        <div className="w-1/3 flex flex-col items-start">
          <div className="flex flex-col items-baseline mb-2">
            <span
              className={`${coefficientSize} font-extrabold ${iconClasses} flex flex-row justify-center items-center gap-1`}
            >
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
                </>
              )}
              {formatCoefficient(coefficient)}
            </span>
            <small className="text-sm text-dark">
              level of contribution to KPIs{" "}
              {isPositive ? "improvement" : "decline"}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};
