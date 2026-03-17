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
    <div className="flex flex-col bg-white rounded-lg shadow p-6 border-l-4 border-primary">
      <span className="text-xl text-gray-500 mb-1">{label}</span>
      <span className={`text-3xl font-bold ${color ?? "text-gray-900"}`}>{value}</span>
    </div>
  );
}

export default MetricCard;
