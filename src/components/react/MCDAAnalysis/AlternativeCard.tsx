import React from "react";

interface AlternativeCardProps {
  label: string;
  flow: number;
  rank: number;
  isTop?: boolean;
}

export const AlternativeCard: React.FC<AlternativeCardProps> = ({
  label,
  flow,
  rank,
  isTop = false,
}) => {
  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 text-center space-y-3 transition-all border-success ${
        isTop ? "md:scale-105 shadow-lg" : " shadow-sm"
      }`}
    >
      <div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span
            className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold ${
              isTop ? "bg-success text-white" : "bg-gray-300 text-gray-700"
            }`}
          >
            {rank}
          </span>
        </div>
        {isTop ? <h4>{label}</h4> : <h4>{label}</h4>}

        {isTop && (
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Top Ranking Business Activity
          </p>
        )}
      </div>
      <p className="text-xs text-gray-600">
        {isTop
          ? "The single business activity with the highest average net PROMETHEE φ across Labs"
          : "High-performing business activity based on PROMETHEE analysis"}
      </p>
      <p className="text-sm font-semibold text-gray-800">
        Ranking: {flow.toFixed(1)} points
      </p>
    </div>
  );
};
