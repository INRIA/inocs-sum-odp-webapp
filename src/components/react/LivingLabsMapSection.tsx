import React, { useEffect, useState } from "react";
import { RButton } from "./ui";
import { getUrl } from "../../lib/helpers";
import { MapViewer, type MarkerData } from "./MapViewer";

type LivingLab = {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  status: "complete" | "incomplete" | "in-progress";
  totalMeasures: number;
  kpisBefore: number;
  kpisAfter: number;
  transportModes: number;
  sustainablePercentage: number;
};

type Props = {
  labs: LivingLab[];
};

export function LivingLabsMapSection({ labs }: Props) {
  const [selectedLab, setSelectedLab] = useState<LivingLab | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50, 10]);
  const [mapZoom, setMapZoom] = useState<number>(4);
  const mapKey = mapCenter ? `${mapCenter[0]},${mapCenter[1]}` : "no-center";
  useEffect(() => {
    if (
      selectedLab &&
      selectedLab.coordinates?.lat &&
      selectedLab.coordinates?.lng
    ) {
      setMapCenter([selectedLab.coordinates.lat, selectedLab.coordinates.lng]);
      setMapZoom(6);
    }
  }, [selectedLab]);

  const getStatusColor = (status: LivingLab["status"]) => {
    switch (status) {
      case "complete":
        return "bg-success";
      case "incomplete":
        return "bg-danger";
      case "in-progress":
        return "bg-warning";
    }
  };

  // convert labs to MarkerData for MapViewer
  const markers: MarkerData[] = labs.map((lab) => ({
    id: lab.id,
    name: lab.name,
    coordinates: lab.coordinates,
    radius: lab.radius * 1000, // convert km to meters
    meta: { lab },
  }));

  return (
    <section id="labs-section" className="py-12 px-4 sm:px-8" >
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-dark mb-2">
            Living Labs across Europe
          </h2>
          <p className="text-dark text-lg">
            Explore where shared mobility innovation is happening with the SUM
            project. Click on a city or map marker to view details.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 h-[600px] rounded shadow overflow-hidden">
            <MapViewer
              key={mapKey}
              markers={markers}
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full z-0"
              onMarkerClick={(m) => {
                // prefer passing the original lab if available in meta
                if (m.meta && m.meta.lab) setSelectedLab(m.meta.lab);
                else {
                  const found = labs.find((l) => l.id === m.id);
                  if (found) setSelectedLab(found);
                }
              }}
            />

            {/* Slide-up Detail Panel */}
            {selectedLab && (
              <div className=" lg:mr-80 bg-white rounded-lg p-3 shadow border border-primary sticky bottom-0 left-0 z-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-primary">
                    {selectedLab.name} Living Lab overview
                  </h4>
                  <button
                    onClick={() => setSelectedLab(null)}
                    className="text-sm text-danger hover:underline"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div>
                    <div className="text-dark font-semibold">
                      Total measures
                    </div>
                    <div className="text-gray-700">
                      {selectedLab.totalMeasures}
                    </div>
                  </div>
                  <div>
                    <div className="text-dark font-semibold">
                      New Shared Mobility modes
                    </div>
                    <div className="text-gray-700">
                      {selectedLab.transportModes}
                    </div>
                  </div>
                  <div>
                    <div className="text-dark font-semibold">KPIs (Before)</div>
                    <div className="text-gray-700">
                      {selectedLab.kpisBefore}
                    </div>
                  </div>
                  <div>
                    <div className="text-dark font-semibold">KPIs (After)</div>
                    <div className="text-gray-700">{selectedLab.kpisAfter}</div>
                  </div>
                  {/* <div>
                    <div className="text-dark font-semibold">
                      Sustainable modal split
                    </div>
                    <div className="text-success font-medium">
                      {selectedLab.sustainablePercentage * 100}%
                    </div>
                  </div> */}
                </div>

                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  <RButton
                    variant="primary"
                    href={getUrl(`/living-lab-city/${selectedLab.id}`)}
                  >
                    🔍 Explore {selectedLab.name} Living Lab
                  </RButton>
                </div>
              </div>
            )}
          </div>

          {/* City List */}
          <div className="grid grid-cols-2 gap-4">
            {labs.map((lab) => (
              <div
                key={lab.id}
                onClick={() => setSelectedLab(lab)}
                className={`cursor-pointer p-4 rounded shadow bg-white hover:bg-primary-light transition border-l-4 ${getStatusColor(
                  lab.status
                )}`}
              >
                <h5 className="font-semibold text-primary">{lab.name}</h5>
                <p>
                  {lab.totalMeasures} Measures <br />
                  {lab.transportModes} NSM Modes
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
