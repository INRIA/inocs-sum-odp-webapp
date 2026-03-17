/**
 * MetricCard Component
 * 
 * SSR-only React component that displays a single summary metric.
 * Used for the platform overview section in the Analytics Dashboard.
 * 
 * @module User Story 1
 */

import type { MetricCardData } from "./types";

export interface MetricCardProps {
  data: MetricCardData;
}

/**
 * A card displaying a single metric with label, value, and optional styling.
 * This component is rendered server-side without hydration (no client:* directive).
 */
export function MetricCard({ data }: MetricCardProps) {
  const { label, value, icon, color } = data;

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-primary">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
}

export default MetricCard;
