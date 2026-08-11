import React from "react";

export interface CitiesKpiStripProps {
  sumLivingLabs: number;
  contributingCities: number;
  countries: number;
  kpiRecords: number;
  policyMeasures: number;
}

const fmt = new Intl.NumberFormat("en-GB");

const COUNTERS: {
  key: keyof CitiesKpiStripProps;
  label: string;
}[] = [
  { key: "sumLivingLabs", label: "SUM Living Labs" },
  { key: "contributingCities", label: "Contributing cities" },
  { key: "countries", label: "Countries" },
  { key: "kpiRecords", label: "Reported KPI records" },
  { key: "policyMeasures", label: "Policy measures" },
];

export function CitiesKpiStrip(props: CitiesKpiStripProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 py-5 px-4">
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-center">
        {COUNTERS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center">
            <span className="text-2xl font-bold text-primary">
              {fmt.format(props[key])}
            </span>
            <span className="text-xs text-gray-500 max-w-28">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
