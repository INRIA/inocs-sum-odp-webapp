import React from "react";

interface Measure {
  id: number;
  name: string;
  type: string;
  description?: string | null;
  start_at?: string | null;
}

interface InsightsCityMeasuresProps {
  measures: Measure[];
}

function MeasureItem({ measure }: { measure: Measure }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-medium text-gray-900">{measure.name}</h4>
      {measure.description && (
        <p className="text-sm text-gray-600 mt-1">{measure.description}</p>
      )}
      {measure.start_at && (
        <p className="text-xs text-gray-400 mt-2">
          Started: {new Date(measure.start_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export function InsightsCityMeasures({ measures }: InsightsCityMeasuresProps) {
  const pushMeasures = measures.filter((m) => m.type === "PUSH");
  const pullMeasures = measures.filter((m) => m.type === "PULL");
  const otherMeasures = measures.filter(
    (m) => m.type !== "PUSH" && m.type !== "PULL",
  );

  if (measures.length === 0) return null;

  return (
    <section className="bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          What they did
        </h2>
        {pushMeasures.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Push measures
            </h3>
            <div className="space-y-3">
              {pushMeasures.map((m) => (
                <MeasureItem key={m.id} measure={m} />
              ))}
            </div>
          </div>
        )}
        {pullMeasures.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Pull measures
            </h3>
            <div className="space-y-3">
              {pullMeasures.map((m) => (
                <MeasureItem key={m.id} measure={m} />
              ))}
            </div>
          </div>
        )}
        {otherMeasures.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Other measures
            </h3>
            <div className="space-y-3">
              {otherMeasures.map((m) => (
                <MeasureItem key={m.id} measure={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
