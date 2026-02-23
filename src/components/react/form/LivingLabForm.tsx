import React, { useEffect, useState } from "react";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";
import { RButton } from "../ui/RButton";
import { getUrl } from "../../../lib/helpers";
import { MapViewer, type MarkerData } from "../MapViewer";
import type { ILivingLab } from "../../../types";
import ApiClient from "../../../lib/api-client/ApiClient";
const api = new ApiClient();

type Props = {
  livingLab?: ILivingLab;
};

export default function LivingLabForm({ livingLab }: Props) {
  const [name, setName] = useState(livingLab?.name ?? "");
  const [latitude, setLatitude] = useState(livingLab?.lat ?? "");
  const [longitude, setLongitude] = useState(livingLab?.lng ?? "");
  const [radius, setRadius] = useState(`${livingLab?.radius ?? ""}`);
  const [area, setArea] = useState(`${livingLab?.area ?? ""}`);
  const [population, setPopulation] = useState(
    `${livingLab?.population ?? ""}`,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isAreaManuallyEdited, setIsAreaManuallyEdited] = useState(false);
  const [hasPlacedMarker, setHasPlacedMarker] = useState(
    !!(livingLab?.lat && livingLab?.lng),
  );

  const [mapMarker, setMapMarker] = useState<MarkerData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50, 10]);

  // derive a key from center so MapViewer remounts whenever center changes
  const mapKey = mapCenter ? `${mapCenter[0]},${mapCenter[1]}` : "no-center";

  function handleMapClick(lat: number, lng: number) {
    const latStr = lat.toFixed(5);
    const lngStr = lng.toFixed(5);
    setLatitude(latStr);
    setLongitude(lngStr);
    setHasPlacedMarker(true);
  }

  function handleMarkerDrag(markerId: string, lat: number, lng: number) {
    setLatitude(lat.toFixed(5));
    setLongitude(lng.toFixed(5));
  }

  function calcAreaFromRadius(r: number): string {
    return `${Math.round(Math.PI * r * r)}`;
  }

  function handleRadiusChange(value: string) {
    setRadius(value);
    if (!isAreaManuallyEdited) {
      const r = parseFloat(value);
      if (!isNaN(r) && r > 0) {
        setArea(calcAreaFromRadius(r));
      }
    }
  }

  function handleAreaChange(value: string) {
    setArea(value);
    setIsAreaManuallyEdited(true);
  }

  function recalculateArea() {
    setIsAreaManuallyEdited(false);
    const r = parseFloat(radius);
    if (!isNaN(r) && r > 0) {
      setArea(calcAreaFromRadius(r));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    const payload = {
      name,
      lat: latitude || "0",
      lng: longitude || "0",
      radius: radius ? parseFloat(radius) : 0,
      area: area ? parseInt(area, 10) : null,
      population: population ? parseInt(population, 10) : null,
    };

    try {
      if (livingLab?.id) {
        const data = { ...payload, id: livingLab.id };
        await api.updateLivingLab(data);
      } else {
        await api.createLivingLab(payload);
      }
      window.location.href = getUrl("/lab-admin");
    } catch (error) {
      const errorString =
        error instanceof Error ? error.message : String(error);
      if (errorString.includes("status=400")) {
        setErrorMessage("Verify the values, only positive numbers are allowed");
      } else if (errorString.includes("status=409")) {
        setErrorMessage("Name already exists");
      } else {
        setErrorMessage("An error occurred while creating the living lab");
      }
    }
  }

  useEffect(() => {
    if (latitude && longitude) {
      setMapMarker({
        id: "lab-marker",
        name,
        coordinates: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        radius: radius ? parseFloat(radius) * 1000 : undefined, // convert km to meters
      });
      setMapCenter([parseFloat(latitude), parseFloat(longitude)]);
    }
  }, [latitude, longitude, radius]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Living Lab or city Name
          </label>
          <Input
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            placeholder="e.g. Geneva Living Lab"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Estimated Population
          </label>
          <Input
            type="number"
            value={population}
            onChange={(e: any) => setPopulation(e.target.value)}
            placeholder="e.g. 500000"
          />
        </div>
        <div className="hidden">
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <Input
            type="number"
            step="any"
            value={latitude}
            onChange={(e: any) => setLatitude(e.target.value)}
            placeholder="50.05"
          />
        </div>

        <div className="hidden">
          <label className="block text-sm font-medium mb-1">Longitude</label>
          <Input
            type="number"
            step="any"
            value={longitude}
            onChange={(e: any) => setLongitude(e.target.value)}
            placeholder="19.94"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Activity radius (km)
          </label>
          <Input
            type="number"
            value={radius}
            onChange={(e: any) => handleRadiusChange(e.target.value)}
            placeholder="100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Area</label>
          <Input
            value={area}
            onChange={(e: any) => handleAreaChange(e.target.value)}
            placeholder="e.g. 120 km²"
          />
          {!isAreaManuallyEdited && area && radius && (
            <small>(auto-calculated from radius)</small>
          )}
          {isAreaManuallyEdited && radius && (
            <RButton
              type="button"
              onClick={recalculateArea}
              variant="link"
              // className="text-xs text-blue-600 underline mt-1 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Recalculate from radius
            </RButton>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Instruction panel */}
        <div className="lg:w-1/3 bg-gray-50 rounded shadow p-4 text-sm space-y-4">
          <p className="font-semibold text-gray-800">
            How to set your Living Lab location
          </p>
          <div className="flex gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-info text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <div>
              <p className="font-medium text-gray-700">
                Place your lab on the map
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Click anywhere on the map to drop a marker. The latitude and
                longitude fields will update automatically.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-info text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <div>
              <p className="font-medium text-gray-700">
                Fine-tune the position
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Drag the marker to adjust the location precisely.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-info text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <div>
              <p className="font-medium text-gray-700">
                Set the activity radius
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Enter the estimated radius (in km) of your lab's intervention
                area. The circle on the map will update in real time.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-info text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <div>
              <p className="font-medium text-gray-700">Review the area</p>
              <p className="text-gray-500 text-xs mt-0.5">
                The area is automatically calculated from the radius. You can
                edit it manually if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Map with hint overlay */}
        <div className="h-[400px] lg:h-auto relative lg:flex-1 rounded shadow overflow-hidden lg:w-2/3">
          <MapViewer
            key={mapKey}
            markers={mapMarker ? [mapMarker] : []}
            center={mapCenter}
            zoom={9}
            className="h-full w-full z-0"
            onMapClick={handleMapClick}
            onMarkerDrag={handleMarkerDrag}
          />
          {!hasPlacedMarker && (
            <div
              className="absolute bottom-3 right-3 z-10 bg-white/90 text-xs rounded px-2 py-1 shadow pointer-events-none"
              aria-label="Click to place marker, drag to move"
            >
              🖱 Click to place · Drag to move
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="text-red-600 text-sm font-medium">{errorMessage}</div>
      )}
      <div className="flex gap-4">
        <RButton
          variant="secondary"
          text="Cancel"
          href={getUrl("/lab-admin")}
        />
        <RButton
          type="submit"
          variant="primary"
          text="Save Living Lab"
          href="#"
        />
      </div>
    </form>
  );
}
