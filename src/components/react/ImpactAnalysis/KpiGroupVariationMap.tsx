import React, { useMemo, useState } from "react";
import type { IKpiVariation, ILivingLabVariation } from "../../../types";
import { getVariationColor } from "../../../lib/helpers/impact-analysis-format";
import { MapViewer, type MarkerData } from "../MapViewer";
import { KpiVariationCard } from "./KpiVariationCard";
import { KpiVariationsTable } from "./KpiVariationsTable";
import {
  COLOR_GREEN,
  COLOR_ORANGE,
  COLOR_RED,
} from "../../../styles/constants";

interface KpiGroupVariationMapProps {
  livingLabVariations: ILivingLabVariation[];
  groupName?: string;
  globalTotalVariation?: number | null;
  globalTotalVariationPercentage?: string;
  globalKpiVariations?: IKpiVariation[];
}

/**
 * Get status label based on marker color
 */
function getStatusLabel(color: string): string {
  if (color === COLOR_GREEN) return "Overall KPI Improvement";
  if (color === COLOR_RED) return "Overall KPI Regression";
  return "Mixed Results";
}

/**
 * Check if a living lab has valid geolocation data
 */
function hasValidGeolocation(lab: ILivingLabVariation): boolean {
  return (
    lab.lat !== null &&
    lab.lat !== undefined &&
    lab.lng !== null &&
    lab.lng !== undefined &&
    !isNaN(lab.lat) &&
    !isNaN(lab.lng)
  );
}

export const KpiGroupVariationMap: React.FC<KpiGroupVariationMapProps> = ({
  livingLabVariations,
  groupName,
}) => {
  const [selectedLab, setSelectedLab] = useState<ILivingLabVariation | null>(
    null,
  );

  // Separate labs with and without valid geolocation
  const { labsWithLocation, labsWithoutLocation } = useMemo(() => {
    const withLocation: ILivingLabVariation[] = [];
    const withoutLocation: ILivingLabVariation[] = [];

    livingLabVariations.forEach((lab) => {
      if (hasValidGeolocation(lab)) {
        withLocation.push(lab);
      } else {
        withoutLocation.push(lab);
      }
    });

    return {
      labsWithLocation: withLocation,
      labsWithoutLocation: withoutLocation,
    };
  }, [livingLabVariations]);

  // Convert living lab variations to map markers
  const markers: MarkerData[] = useMemo(() => {
    return labsWithLocation.map((lab) => ({
      id: lab.labId,
      name: lab.labName,
      coordinates: {
        lat: lab.lat!,
        lng: lab.lng!,
      },
      radius: lab.radius ? lab.radius * 1000 : undefined, // Convert km to meters
      color: getVariationColor(lab.totalVariation),
      meta: { lab },
    }));
  }, [labsWithLocation]);

  // Calculate map center from markers
  const mapCenter: [number, number] = useMemo(() => {
    if (markers.length === 0) {
      return [50, 10]; // Default center (Europe)
    }
    const avgLat =
      markers.reduce((sum, m) => sum + m.coordinates.lat, 0) / markers.length;
    const avgLng =
      markers.reduce((sum, m) => sum + m.coordinates.lng, 0) / markers.length;
    return [avgLat, avgLng];
  }, [markers]);

  // Calculate appropriate zoom level based on marker spread
  const mapZoom = useMemo(() => {
    if (markers.length <= 1) return 6;
    // Calculate the bounding box of all markers
    const lats = markers.map((m) => m.coordinates.lat);
    const lngs = markers.map((m) => m.coordinates.lng);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);

    // Rough zoom level calculation
    if (maxSpread > 40) return 3;
    if (maxSpread > 20) return 4;
    if (maxSpread > 10) return 5;
    if (maxSpread > 5) return 6;
    return 7;
  }, [markers]);

  // Handle marker click
  const handleMarkerClick = (marker: MarkerData) => {
    const lab = marker.meta?.lab as ILivingLabVariation | undefined;
    if (lab) {
      setSelectedLab(lab);
    }
  };

  // Close the info panel
  const handleClosePanel = () => {
    setSelectedLab(null);
  };

  // Get marker color for selected lab
  const selectedLabColor = selectedLab
    ? getVariationColor(selectedLab.totalVariation)
    : null;

  return (
    <div className="mt-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-700">Legend:</span>
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: COLOR_GREEN }}
          />
          <span className="text-sm text-gray-600">Overall KPIs improved</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: COLOR_RED }}
          />
          <span className="text-sm text-gray-600">Overall KPIs regressed</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: COLOR_ORANGE }}
          />
          <span className="text-sm text-gray-600">Mixed results</span>
        </div>
      </div>

      {/* Map container with sliding panel */}
      <div className="relative h-[500px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {markers.length > 0 ? (
          <MapViewer
            markers={markers}
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full z-10"
            scrollWheelZoom={true}
            onMarkerClick={handleMarkerClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p className="text-gray-600">
              No living labs with location data available for{" "}
              {groupName || "this group"}.
            </p>
          </div>
        )}

        {/* Sliding Info Panel */}
        <div
          className={`z-50 absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
            selectedLab ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedLab && (
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: selectedLabColor || COLOR_ORANGE,
                        }}
                      />
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {selectedLab.labName}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      {getStatusLabel(selectedLabColor || COLOR_ORANGE)}
                    </p>
                  </div>
                  <button
                    onClick={handleClosePanel}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                    aria-label="Close panel"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Panel Content - Reusing KpiVariationCard and KpiVariationsTable */}
              <div className="flex-1 overflow-y-auto">
                {/* Total Variation Summary */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <KpiVariationCard
                    title={selectedLab.labName}
                    subtitle={`Overall variation for ${groupName} KPIs`}
                    value={selectedLab.totalVariationPercentage}
                    description={`Average percentage change across ${selectedLab.kpis.length} metrics collected`}
                    size="small"
                    ratioValue={selectedLab.totalVariation}
                  />
                </div>

                {/* Individual KPI Variations Table */}
                <div className="p-4">
                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Individual KPI Variations
                  </h5>
                  <KpiVariationsTable kpis={selectedLab.kpis} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overlay when panel is open (for mobile) */}
        {selectedLab && (
          <div
            className="absolute inset-0 bg-black/20 sm:hidden"
            onClick={handleClosePanel}
          />
        )}
      </div>

      {/* Warning for labs without location */}
      {labsWithoutLocation.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>{labsWithoutLocation.length}</strong> living lab
            {labsWithoutLocation.length > 1 ? "s" : ""} not shown due to missing
            location data:{" "}
            <span className="font-medium">
              {labsWithoutLocation.map((l) => l.labName).join(", ")}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
