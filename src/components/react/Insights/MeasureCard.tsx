interface MeasureCardProps {
  rank: number;
  measureName: string;
  cityCount: number;
  cities: { id: number; name: string }[];
  outcome: string;
  evidenceLabel: string;
}

export function MeasureCard({
  rank,
  measureName,
  cityCount,
  cities,
  outcome,
  evidenceLabel,
}: MeasureCardProps) {
  const isStrong = evidenceLabel === "Strong evidence";
  const isModerate = evidenceLabel === "Moderate evidence";

  const badgeClasses = isStrong
    ? "bg-green-50 text-green-700 border-green-200"
    : isModerate
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1">
            {measureName}
          </h3>
          <p className="text-sm text-gray-500 mb-3">{outcome}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClasses}`}
            >
              {evidenceLabel}
            </span>
            <span className="text-xs text-gray-400">
              {cityCount} {cityCount === 1 ? "city" : "cities"}
            </span>
          </div>
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {cities.map((city) => (
                <span
                  key={city.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                >
                  {city.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
