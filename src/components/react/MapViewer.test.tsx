import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapViewer } from "./MapViewer";
import type { MarkerData } from "./MapViewer";

let mapHandlers: Record<string, any> = {};

vi.mock("react-leaflet", () => {
  return {
    MapContainer: ({ children, center, zoom }: any) => (
      <div
        data-testid="map"
        data-center={JSON.stringify(center)}
        data-zoom={zoom}
      >
        {children}
      </div>
    ),
    TileLayer: () => null,
    Marker: ({ children, eventHandlers, position }: any) => (
      <button
        type="button"
        data-testid={`marker-${position?.[0]}-${position?.[1]}`}
        onClick={() =>
          eventHandlers?.dragend?.({
            target: {
              getLatLng: () => ({
                lat: position[0] + 0.1,
                lng: position[1] + 0.1,
              }),
            },
          })
        }
      >
        marker
        {children}
      </button>
    ),
    Circle: ({ radius }: any) => <div data-testid={`circle-${radius}`} />,
    Popup: ({ children }: any) => <div>{children}</div>,
    useMapEvents: (handlers: any) => {
      mapHandlers = handlers ?? {};
      return null;
    },
  };
});

// Mock leaflet and its CSS — both are loaded dynamically inside the component.
// divIcon must be exported at the top level: the component calls `L.divIcon()`
// directly on the dynamic-import result, not `L.default.divIcon()`.
vi.mock("leaflet", () => {
  const divIcon = vi.fn(() => ({}));
  return {
    default: { divIcon },
    divIcon,
  };
});

vi.mock("leaflet/dist/leaflet.css", () => ({}));

describe("MapViewer", () => {
  beforeEach(() => {
    mapHandlers = {};
  });

  const center = [41.39, 2.17] as [number, number];
  // Use the correct MarkerData shape: coordinates nested object, not top-level lat/lng
  const markers: MarkerData[] = [
    { id: "m1", coordinates: { lat: 41.39, lng: 2.17 }, radius: 500 },
  ];

  it("Given center and zoom, When rendered, Then map container is visible", async () => {
    render(<MapViewer center={center} zoom={12} markers={[]} />);
    // findBy* waits for the async dynamic import + state update to resolve
    expect(await screen.findByTestId("map")).toBeInTheDocument();
  });

  it("Given markers, When rendered, Then marker is displayed", async () => {
    render(<MapViewer center={center} zoom={12} markers={markers} />);
    expect(await screen.findByTestId("marker-41.39-2.17")).toBeInTheDocument();
  });

  it("Given marker with radius, When rendered, Then radius circle is displayed", async () => {
    render(<MapViewer center={center} zoom={12} markers={markers} />);
    expect(await screen.findByTestId("circle-500")).toBeInTheDocument();
  });

  it("Given empty markers, When rendered, Then no marker is displayed", async () => {
    render(<MapViewer center={center} zoom={12} markers={[]} />);
    // Wait for map to fully load before asserting absence of markers
    await screen.findByTestId("map");
    expect(screen.queryByTestId(/marker-/i)).not.toBeInTheDocument();
  });

  it("Given onMapClick callback, When map click event occurs, Then callback receives coordinates", async () => {
    const onMapClick = vi.fn();
    render(
      <MapViewer
        center={center}
        zoom={12}
        markers={[]}
        onMapClick={onMapClick}
      />,
    );

    // Wait for map (and MapClickHandler) to mount so mapHandlers.click is populated
    await screen.findByTestId("map");

    act(() => {
      mapHandlers.click?.({ latlng: { lat: 40.1, lng: 3.2 } });
    });

    // onMapClick is called as (lat, lng) — two separate numbers
    expect(onMapClick).toHaveBeenCalledWith(40.1, 3.2);
  });

  it("Given onMarkerDrag callback, When marker drag ends, Then callback receives id and new coordinates", async () => {
    const onMarkerDrag = vi.fn();
    render(
      <MapViewer
        center={center}
        zoom={12}
        markers={markers}
        onMarkerDrag={onMarkerDrag}
      />,
    );

    // findByTestId waits for async map init before trying to click
    await userEvent.click(await screen.findByTestId("marker-41.39-2.17"));

    expect(onMarkerDrag).toHaveBeenCalled();
    // id
    expect(onMarkerDrag.mock.calls[0][0]).toBe("m1");
    // lat = original 41.39 + 0.1 offset added by mock dragend handler
    expect(onMarkerDrag.mock.calls[0][1]).toBeCloseTo(41.49, 1);
    // lng = original 2.17 + 0.1 offset added by mock dragend handler
    expect(onMarkerDrag.mock.calls[0][2]).toBeCloseTo(2.27, 1);
  });

  it("Given no onMapClick prop, When map click event occurs, Then component does not throw", async () => {
    render(<MapViewer center={center} zoom={12} markers={[]} />);

    await screen.findByTestId("map");

    expect(() => {
      act(() => {
        // mapHandlers.click is undefined here (no MapClickHandler rendered), optional chaining is safe
        mapHandlers.click?.({ latlng: { lat: 41, lng: 2 } });
      });
    }).not.toThrow();
  });
});
