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
    `${livingLab?.population ?? ""}`
  );

  const [mapMarker, setMapMarker] = useState<MarkerData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50, 10]);
  const [mapZoom, setMapZoom] = useState<number>(4);

  // derive a key from center so MapViewer remounts whenever center changes
  const mapKey = mapCenter ? `${mapCenter[0]},${mapCenter[1]}` : "no-center";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!livingLab?.id) return;

    const payload = {
      id: livingLab?.id,
      name,
      lat: latitude || "0",
      lng: longitude || "0",
      radius: radius ? parseFloat(radius) : 0,
      area: area ? parseInt(area, 10) : undefined,
      population: population ? parseInt(population, 10) : undefined,
    };
    api.updateLivingLab(payload).then(() => {
      // Handle successful update
      window.location.href = getUrl("/lab-admin");
    });
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
      setMapZoom(8);
    }
  }, [latitude, longitude, radius]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <Input
            type="number"
            step="any"
            value={latitude}
            onChange={(e: any) => setLatitude(e.target.value)}
            placeholder="50.05"
          />
        </div>

        <div>
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
            onChange={(e: any) => setRadius(e.target.value)}
            placeholder="100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Area</label>
          <Input
            value={area}
            onChange={(e: any) => setArea(e.target.value)}
            placeholder="e.g. 120 km²"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Population</label>
          <Input
            type="number"
            value={population}
            onChange={(e: any) => setPopulation(e.target.value)}
            placeholder="e.g. 500000"
          />
        </div>
      </div>

      <div className="h-[400px] rounded shadow ">
        <MapViewer
          key={mapKey}
          markers={mapMarker ? [mapMarker] : []}
          center={mapCenter}
          zoom={mapZoom ?? 8}
          className="h-full w-full z-0"
        />
      </div>

      <div className="flex gap-4">
        <RButton
          type="submit"
          variant="primary"
          text="Save Living Lab"
          href={getUrl("/lab-admin")}
        />
        <RButton
          type="button"
          variant="secondary"
          text="Cancel"
          onClick={() => {
            setName("");
            setLatitude("");
            setLongitude("");
            setRadius("");
            setArea("");
            setPopulation("");
          }}
        />
      </div>
    </form>
  );
}
