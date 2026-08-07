import React, { useEffect, useState } from "react";
import { RButton } from "./ui";
import { getUrl } from "../../lib/helpers";
import { MapViewer, type MarkerData } from "./MapViewer";
import { XMarkIcon, MapIcon } from "@heroicons/react/24/outline";
import { displayLabType } from "../../lib/labels";

type LivingLab = {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  status: "complete" | "incomplete" | "in-progress";
  totalMeasures: number;
  kpisCollected: number;
  yearsCollected: number[];
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
  const [isListOpen, setIsListOpen] = useState(false);
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
    <section id="labs-section" className="py-12 px-4 sm:px-8">
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

        {/* Map Container - Full Width */}
        <div className="relative h-[600px] rounded shadow overflow-hidden">
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

          {/* Toggle Button - Shows when list is closed */}
          {!isListOpen && (
            <button
              onClick={() => setIsListOpen(true)}
              className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors flex items-center gap-2"
              aria-label="Show living labs list"
            >
              <MapIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Show {labs.length + " "} Living Labs
              </span>
            </button>
          )}

          {/* City List Overlay */}
          {isListOpen && (
            <div className="absolute top-4 right-4 z-10 max-h-[calc(100%-2rem)] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
              {/* List Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-dark">
                  {labs.length + " "} Living Labs
                </h3>
                <button
                  onClick={() => setIsListOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Close living labs list"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* List Content */}
              <div className="overflow-y-auto max-h-[calc(600px-8rem)] p-4">
                <div className="flex flex-col gap-3">
                  {labs.map((lab) => (
                    <div
                      key={lab.id}
                      onClick={() => setSelectedLab(lab)}
                      className={`cursor-pointer p-1 rounded shadow-sm bg-white hover:bg-primary-light transition ${getStatusColor(
                        lab.status,
                      )}`}
                    >
                      <h6 className="font-semibold text-primary">{lab.name}</h6>
                      {/* <p className="text-sm text-gray-600">
                        {lab.totalMeasures} Measures • {lab.transportModes} NSM
                        Modes
                      </p> */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Slide-up Detail Panel */}
          {selectedLab && (
            <div className="w-full lg:w-1/4 absolute bottom-0 left-0 right-0 lg:right-96 bg-white rounded-t-lg p-3 shadow-lg border border-primary z-20">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-primary">
                  {selectedLab.name} — {displayLabType(Number(selectedLab.id))} overview
                </h4>
                <button
                  onClick={() => setSelectedLab(null)}
                  className="text-sm text-danger hover:underline"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 text-sm">
                <div>
                  <div className="text-dark font-semibold">
                    Policy measures implemented
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
                  <div className="text-dark font-semibold">KPIs Collected</div>
                  <div className="text-gray-700">
                    {selectedLab.kpisCollected}
                  </div>
                </div>
                <div>
                  <div className="text-dark font-semibold">Years Collected</div>
                  <div className="text-gray-700">
                    {selectedLab.yearsCollected
                      .map((year) => year.toString())
                      .join(", ")}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                <RButton
                  variant="primary"
                  href={getUrl(`/living-lab-city/${selectedLab.id}`)}
                >
                  Explore {selectedLab.name} — {displayLabType(Number(selectedLab.id))}
                </RButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
