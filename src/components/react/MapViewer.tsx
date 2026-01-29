import React, { useEffect, useState } from "react";
import { COLOR_PRIMARY, COLOR_WARNING } from "../../types";

export type MarkerData = {
  id: string;
  name?: string;
  coordinates: { lat: number; lng: number };
  radius?: number;
  color?: string; // Optional marker color, defaults to COLOR_PRIMARY
  // allow attaching any payload if needed
  meta?: Record<string, any>;
};

type Props = {
  center?: [number, number];
  zoom?: number;
  markers: MarkerData[];
  className?: string;
  scrollWheelZoom?: boolean;
  onMarkerClick?: (m: MarkerData) => void;
};

export function MapViewer({
  center = [50, 10],
  zoom = 5,
  markers,
  className = "h-full w-full",
  scrollWheelZoom = false,
  onMarkerClick,
}: Props) {
  const [leafletComponents, setLeafletComponents] = useState<any | null>(null);
  const [markersState, setMarkersState] = useState<MarkerData[]>(markers);
  const [leaflet, setLeaflet] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadLeaflet() {
      if (typeof window === "undefined") return;
      try {
        const comps = await import("react-leaflet");
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        if (mounted) {
          setLeafletComponents(comps);
          setLeaflet(L);
        }
      } catch (e) {
        if (mounted) setLeafletComponents(null);
      }
    }
    loadLeaflet();
    return () => {
      mounted = false;
    };
  }, []);

  // respond to markers changes: fit bounds when markers present
  useEffect(() => {
    setMarkersState(markers);
  }, [markers]);

  if (!leafletComponents) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-600">
        Loading map...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Circle, Popup } =
    leafletComponents as any;

  const createMarkerIcon = (color: string = COLOR_PRIMARY) =>
    leaflet.divIcon({
      html: `
                  <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${color};
                    font-size: 1rem;
                    width: 1rem;
                    height: 1rem;
                    margin-left: -0.20rem;
                    margin-top: -0.30rem;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                  ">
                  </div>
                `,
    });

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {leaflet &&
        markersState?.map((m) => (
          <React.Fragment key={m.id}>
            <Marker
              position={[m.coordinates.lat, m.coordinates.lng]}
              icon={createMarkerIcon(m.color)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(m),
              }}
            >
              {m.name && (
                <Popup>
                  <strong>{m.name}</strong>
                </Popup>
              )}
            </Marker>

            {typeof m.radius === "number" && (
              <Circle
                center={[m.coordinates.lat, m.coordinates.lng]}
                radius={m.radius}
                pathOptions={{ color: COLOR_WARNING, fillOpacity: 0.2 }}
              />
            )}
          </React.Fragment>
        ))}
    </MapContainer>
  );
}
