interface SimpleCity {
  id: number;
  name: string;
}

interface InsightsCityMapProps {
  cities: SimpleCity[];
}

export function InsightsCityMap({ cities }: InsightsCityMapProps) {
  if (cities.length === 0) {
    return <p className="text-gray-500 text-sm">No cities with evidence found.</p>;
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">
        Cities with at least one implemented measure
      </p>
      <div className="flex flex-wrap gap-2">
        {cities.map((city) => (
          <span
            key={city.id}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
          >
            {city.name}
          </span>
        ))}
      </div>
    </div>
  );
}
