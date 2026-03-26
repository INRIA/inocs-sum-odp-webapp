import React, { useEffect, useState } from "react";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";
import { RButton } from "../ui/RButton";
import { getUrl } from "../../../lib/helpers";
import { MapViewer, type MarkerData } from "../MapViewer";
import { CitySearchSelector } from "./CitySearchSelector";
import type { ILivingLab } from "../../../types";
import type { IGiscoSearchResult } from "../../../types/Gisco";
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
  const [countryCode, setCountryCode] = useState(
    livingLab?.country_code2 ?? "",
  );
  const [country, setCountry] = useState(livingLab?.country ?? "");
  const [population, setPopulation] = useState(
    `${livingLab?.population ?? ""}`,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isAreaManuallyEdited, setIsAreaManuallyEdited] = useState(false);
  // In edit mode the search panel starts collapsed; in create mode it is open
  const [showSearch, setShowSearch] = useState(!livingLab?.id);

  const [mapMarker, setMapMarker] = useState<MarkerData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50, 10]);

  // derive a key from center so MapViewer remounts whenever center changes
  const mapKey = mapCenter ? `${mapCenter[0]},${mapCenter[1]}` : "no-center";

  function handleMapClick(lat: number, lng: number) {
    const latStr = lat.toFixed(5);
    const lngStr = lng.toFixed(5);
    setLatitude(latStr);
    setLongitude(lngStr);
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

  function handleCitySelect(result: IGiscoSearchResult) {
    setName(result.cityName);
    setCountry(result.country);
    setCountryCode(result.countryCode);
    setLatitude(result.lat.toFixed(5));
    setLongitude(result.lng.toFixed(5));
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
      country_code2: countryCode,
      country,
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
      <div className="flex flex-col lg:flex-row gap-4">
        {/* City search panel — visible by default on create, collapsed on edit */}
        {showSearch && (
          <div className="lg:w-1/3 h-[400px] overflow-auto">
            <CitySearchSelector onSelect={handleCitySelect} />
          </div>
        )}

        {/* Map — takes full width when search is collapsed */}
        <div className="flex-1 h-[400px] overflow-hidden">
          {/* City Search Helper toggle (shown in edit mode as overlay button) */}
          {!!livingLab?.id && (
            <RButton
              type="button"
              variant="secondary"
              onClick={() => setShowSearch((v) => !v)}
              aria-expanded={showSearch}
            >
              🔍 {showSearch ? "Hide Search" : "Edit with City Search Helper"}
            </RButton>
          )}
          <MapViewer
            key={mapKey}
            markers={mapMarker ? [mapMarker] : []}
            center={mapCenter}
            zoom={10}
            className="h-full w-full z-0"
            onMapClick={handleMapClick}
            onMarkerDrag={handleMarkerDrag}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Living Lab or city Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            placeholder="e.g. Geneva Living Lab"
            required
          />
        </div>
        <div>
          <label htmlFor="lat" className="block text-sm font-medium mb-1">
            Country
          </label>
          <Input id="country" type="text" value={country} disabled />
        </div>
        <div className="hidden">
          <label htmlFor="lat" className="block text-sm font-medium mb-1">
            Country code
          </label>
          <Input id="country_code2" type="text" value={countryCode} />
        </div>
        <div className="hidden">
          <label htmlFor="lat" className="block text-sm font-medium mb-1">
            Latitude
          </label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={latitude}
            onChange={(e: any) => setLatitude(e.target.value)}
            placeholder="50.05"
          />
        </div>

        <div className="hidden">
          <label htmlFor="lng" className="block text-sm font-medium mb-1">
            Longitude
          </label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={longitude}
            onChange={(e: any) => setLongitude(e.target.value)}
            placeholder="19.94"
          />
        </div>

        <div>
          <label htmlFor="radius" className="block text-sm font-medium mb-1">
            Activity radius (km)
          </label>
          <Input
            id="radius"
            type="number"
            value={radius}
            onChange={(e: any) => handleRadiusChange(e.target.value)}
            placeholder="100"
          />
        </div>
        <div>
          <label htmlFor="area" className="block text-sm font-medium mb-1">
            Area
          </label>
          <Input
            id="area"
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
        <div>
          <label
            htmlFor="population"
            className="block text-sm font-medium mb-1"
          >
            Estimated Population
          </label>
          <Input
            id="population"
            type="number"
            value={population}
            onChange={(e: any) => setPopulation(e.target.value)}
            placeholder="e.g. 500000"
          />
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
