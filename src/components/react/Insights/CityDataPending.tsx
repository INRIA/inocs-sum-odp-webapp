import React from "react";

interface CityDataPendingProps {
  cityName: string;
  registrationDate: string;
  counterpartHref: string;
}

export function CityDataPending({
  cityName,
  registrationDate,
  counterpartHref,
}: CityDataPendingProps) {
  return (
    <section className="py-16 px-4 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{cityName}</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 font-medium mb-2">
            Registered — no data published yet
          </p>
          <p className="text-sm text-gray-500">
            Registered on {registrationDate}. Data will appear here once the
            city publishes its first KPI measurements.
          </p>
        </div>
        <a
          href={counterpartHref}
          className="text-primary text-sm hover:underline"
        >
          View city record in Data &amp; scientific tools →
        </a>
      </div>
    </section>
  );
}
