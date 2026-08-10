import { MAP_LEGEND_ENTRIES } from "../../lib/utils/cityStatus";

export function MapLegend() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">Data available from</p>
      <div className="flex flex-col gap-1.5">
        {MAP_LEGEND_ENTRIES.map((entry) => (
          <div key={entry.label} className="flex items-center gap-2">
            <span
              className={`inline-block w-3 h-3 ${entry.symbol === "circle" ? "rounded-full" : "rotate-45"} ${entry.color === "warning" ? "bg-warning" : "bg-primary"}`}
            />
            <span className="text-gray-600">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
