import React from "react";
import type { IKpiReading } from "../../../config/kpiReadings";

interface KpiResult {
  kpidefinition_id: number;
  kpi_name: string;
  results: Array<{ date: string; value: number }>;
}

interface InsightsCityKPIsProps {
  kpiResults: KpiResult[];
  kpiReadings: Record<number, IKpiReading>;
  kpiResources?: Array<{
    id: number;
    name: string;
    url?: string | null;
    kpiDefinitionId: number;
  }>;
}

function DirectionBadge({ direction }: { direction: IKpiReading["direction"] }) {
  if (direction === "up_is_good")
    return (
      <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
        Higher is better
      </span>
    );
  if (direction === "down_is_good")
    return (
      <span className="text-xs text-info bg-info/10 px-2 py-0.5 rounded-full">
        Lower is better
      </span>
    );
  return (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      Direction depends on context
    </span>
  );
}

function KpiCard({
  kpiResult,
  reading,
  relatedResources,
}: {
  kpiResult: KpiResult;
  reading: IKpiReading | null;
  relatedResources: Array<{ id: number; name: string; url?: string | null }>;
}) {
  const values = kpiResult.results ?? [];
  const sorted = [...values].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const latest = sorted[sorted.length - 1];
  const lastUpdated = latest?.date
    ? new Date(latest.date).toLocaleDateString()
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">
          {kpiResult.kpi_name}
        </h3>
        {reading && <DirectionBadge direction={reading.direction} />}
      </div>
      {reading && reading.reading !== "PLACEHOLDER — awaiting WP1 content" && (
        <p className="text-xs text-gray-500 mb-3 italic">{reading.reading}</p>
      )}
      <div className="flex flex-wrap gap-3 text-sm">
        {sorted.map((v) => (
          <div key={v.date} className="text-center">
            <div className="font-semibold text-gray-900">
              {v.value.toFixed(1)}
              {reading?.unit ? ` ${reading.unit}` : ""}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(v.date).getFullYear()}
            </div>
          </div>
        ))}
      </div>
      {lastUpdated && (
        <p className="text-xs text-gray-400 mt-3">Updated: {lastUpdated}</p>
      )}
      {relatedResources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Related documents:</p>
          {relatedResources.map((r) =>
            r.url ? (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-primary hover:underline"
              >
                {r.name}
              </a>
            ) : (
              <span key={r.id} className="block text-xs text-gray-600">
                {r.name}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function InsightsCityKPIs({
  kpiResults,
  kpiReadings,
  kpiResources = [],
}: InsightsCityKPIsProps) {
  if (kpiResults.length === 0) return null;

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Results at a glance
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {kpiResults.map((kr) => {
            const reading = kpiReadings[kr.kpidefinition_id] ?? null;
            const relatedResources = kpiResources.filter(
              (r) => r.kpiDefinitionId === kr.kpidefinition_id,
            );
            return (
              <KpiCard
                key={kr.kpidefinition_id}
                kpiResult={kr}
                reading={reading}
                relatedResources={relatedResources}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
