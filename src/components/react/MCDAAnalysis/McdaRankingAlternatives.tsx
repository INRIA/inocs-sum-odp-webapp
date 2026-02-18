import React from "react";

interface McdaRankingAlternativesProps {
  ranking?: string[];
  alternativeLabels: { [key: string]: string };
  netFlows: { [key: string]: number };
  className?: string;
}

export const McdaRankingAlternatives: React.FC<McdaRankingAlternativesProps> = ({
  ranking = [],
  alternativeLabels,
  netFlows,
  className = "",
}) => {
  const alternativeKeys = Array.from(
    new Set([...ranking, ...Object.keys(netFlows)]),
  ).sort((a, b) => {
    const rankA = ranking.indexOf(a);
    const rankB = ranking.indexOf(b);

    if (rankA >= 0 && rankB >= 0) return rankA - rankB;
    if (rankA >= 0) return -1;
    if (rankB >= 0) return 1;

    return (netFlows[b] || 0) - (netFlows[a] || 0);
  });

  return (
    <aside
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <h4 className="text-base font-semibold text-gray-900">Ranking Results</h4>
        <p className="text-xs text-gray-500">Based on current weights</p>
      </div>

      <div className="max-h-175 overflow-y-auto p-2 space-y-2">
        {alternativeKeys.map((key, index) => {
          const rank = ranking.indexOf(key);
          const displayRank = rank >= 0 ? rank + 1 : index + 1;
          const isTop3 = displayRank <= 3;
          const netFlow = netFlows[key] || 0;
          const flowColor =
            netFlow > 0
              ? "text-success"
              : netFlow < 0
                ? "text-danger"
                : "text-gray-500";

          return (
            <div
              key={key}
              className={`rounded-md border p-2 text-xs transition-colors hover:bg-gray-50 ${
                isTop3 ? "border-success bg-success/5" : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`inline-flex h-5 min-w-7 items-center justify-center rounded px-1 font-bold text-white ${
                    isTop3 ? "bg-success text-dark-light" : "bg-dark"
                  }`}
                >
                  {key.toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-900">
                    {alternativeLabels[key] || key}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-600">
                    Rank: #{displayRank} • Net Flow:{" "}
                    <span className={flowColor}>{netFlow.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
