import React from "react";
import { formatPopulation } from "../../../lib/helpers/format";

interface InsightsCityOverviewProps {
  cityName: string;
  country: string | null | undefined;
  population: number | null | undefined;
  area: number | null | undefined;
  headlineResult: string;
  lastUpdated: string;
}

export function InsightsCityOverview({
  cityName,
  country,
  population,
  area,
  headlineResult,
  lastUpdated,
}: InsightsCityOverviewProps) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{cityName}</h1>
        {country && <p className="text-sm text-gray-500 mb-6">{country}</p>}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              City context
            </h2>
            <dl className="space-y-2 text-sm">
              {population != null && (
                <div>
                  <dt className="text-gray-500 inline">Population: </dt>
                  <dd className="inline text-gray-900">
                    {formatPopulation(population)}
                  </dd>
                </div>
              )}
              {area != null && (
                <div>
                  <dt className="text-gray-500 inline">Area: </dt>
                  <dd className="inline text-gray-900">{area} km²</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="bg-primary/5 rounded-lg border border-primary/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Headline result
            </h2>
            <p className="text-gray-700">{headlineResult}</p>
            <p className="text-xs text-gray-400 mt-3">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
