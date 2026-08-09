import type { EvidenceBadgeConfig } from "../../../config/evidenceStrength";

interface EvidenceBadgeProps {
  badge: EvidenceBadgeConfig;
  cityCount: number;
}

export function EvidenceBadge({ badge, cityCount }: EvidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bgClass} ${badge.colorClass}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-current" />
      {badge.label}
      <span className="text-gray-500 font-normal">
        ({cityCount} {cityCount === 1 ? "city" : "cities"})
      </span>
    </span>
  );
}
