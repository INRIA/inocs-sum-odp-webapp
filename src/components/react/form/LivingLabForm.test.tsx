import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LivingLabForm from "./LivingLabForm";

// vi.hoisted ensures these are initialized before vi.mock factories run
// (vi.mock is hoisted above const declarations, so plain const would be in TDZ)
const { createLivingLabMock, updateLivingLabMock } = vi.hoisted(() => ({
  createLivingLabMock: vi.fn(),
  updateLivingLabMock: vi.fn(),
}));

vi.mock("../../../lib/api-client/ApiClient", () => {
  return {
    default: vi.fn(function () {
      return {
        createLivingLab: createLivingLabMock,
        updateLivingLab: updateLivingLabMock,
      };
    }),
  };
});

vi.mock("../MapViewer", () => {
  return {
    MapViewer: function MockMapViewer(props: any) {
      return (
        <div data-testid="mock-map-viewer">
          <button
            type="button"
            onClick={() => props.onMapClick?.(41.11111, 2.22222)}
          >
            mock-map-click
          </button>
          <button
            type="button"
            onClick={() =>
              props.onMarkerDrag?.(
                props.markers?.[0]?.id ?? "marker-1",
                42.33333,
                3.44444,
              )
            }
          >
            mock-marker-drag
          </button>
        </div>
      );
    },
  };
});

const getInput = (...labels: RegExp[]) => {
  for (const label of labels) {
    const el = screen.queryByLabelText(label);
    if (el) return el as HTMLInputElement;
  }
  throw new Error(
    `Input not found for labels: ${labels.map(String).join(", ")}`,
  );
};

const baseLab = {
  name: "Lab A",
  lat: 41.39,
  lng: 2.17,
  radius: 2,
  area: 13,
  population: 100000,
};

describe("LivingLabForm", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, href: "http://localhost/" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("Given no livingLab, When mounted, Then form shows empty values", () => {
    render(<LivingLabForm />);
    const name = getInput(/living lab name/i, /name/i);
    expect(name.value).toBe("");
  });

  it("Given livingLab data, When mounted, Then fields are pre-filled", () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    const name = getInput(/living lab name/i, /name/i);
    expect(name.value).toBe("Lab A");
  });

  it("Given area is auto-calculated, When rendered, Then auto-calculated hint is visible", () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    expect(
      screen.getByText(/auto-calculated from radius/i),
    ).toBeInTheDocument();
  });

  it("Given area not manually edited, When rendered, Then recalculate button is hidden", () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    expect(
      screen.queryByRole("button", { name: /recalculate from radius/i }),
    ).not.toBeInTheDocument();
  });

  it("Given area manually edited, When rendered, Then recalculate button is visible", async () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    const area = getInput(/area/i);
    await userEvent.clear(area);
    await userEvent.type(area, "100");
    expect(
      screen.getByRole("button", { name: /recalculate from radius/i }),
    ).toBeInTheDocument();
  });

  it("Given no marker, When mounted, Then map placement hint is visible", () => {
    render(<LivingLabForm />);
    expect(screen.getByText(/click to place/i)).toBeInTheDocument();
  });

  it("Given map click happens, When marker is placed, Then map hint is hidden", async () => {
    render(<LivingLabForm />);
    await userEvent.click(
      screen.getByRole("button", { name: /mock-map-click/i }),
    );
    expect(screen.queryByText(/click to place/i)).not.toBeInTheDocument();
  });

  it("Given initial render, When not submitted, Then no error message is displayed", () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    expect(screen.queryByText(/an error occurred/i)).not.toBeInTheDocument();
  });

  it("Given name input, When user types, Then value updates", async () => {
    render(<LivingLabForm />);
    const name = getInput(/living lab name/i, /name/i);
    await userEvent.type(name, "New Lab");
    expect(name.value).toContain("New Lab");
  });

  it("Given area not manually edited, When radius changes, Then area updates from radius", async () => {
    render(<LivingLabForm livingLab={{ ...baseLab, area: 0 } as any} />);
    const radius = getInput(/radius/i);
    const area = getInput(/area/i);

    await userEvent.clear(radius);
    await userEvent.type(radius, "2");

    expect(Number(area.value)).toBe(Math.round(Math.PI * 2 * 2));
  });

  it("Given area manually edited, When radius changes, Then area stays manual", async () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    const radius = getInput(/radius/i);
    const area = getInput(/area/i);

    await userEvent.clear(area);
    await userEvent.type(area, "999");
    await userEvent.clear(radius);
    await userEvent.type(radius, "4");

    expect(area.value).toBe("999");
  });

  it("Given area manually edited, When recalculate clicked, Then area resets from radius", async () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    const radius = getInput(/radius/i);
    const area = getInput(/area/i);

    await userEvent.clear(area);
    await userEvent.type(area, "999");
    await userEvent.clear(radius);
    await userEvent.type(radius, "3");
    await userEvent.click(
      screen.getByRole("button", { name: /recalculate from radius/i }),
    );

    expect(Number(area.value)).toBe(Math.round(Math.PI * 3 * 3));
  });

  it("Given map click, When callback fires, Then latitude and longitude fields update", async () => {
    render(<LivingLabForm />);
    await userEvent.click(
      screen.getByRole("button", { name: /mock-map-click/i }),
    );

    const lat = getInput(/latitude/i, /lat/i);
    const lng = getInput(/longitude/i, /lng/i);

    expect(lat.value).toMatch(/41\.11111/);
    expect(lng.value).toMatch(/2\.22222/);
  });

  it("Given marker drag, When callback fires, Then latitude and longitude fields update", async () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    await userEvent.click(
      screen.getByRole("button", { name: /mock-marker-drag/i }),
    );

    const lat = getInput(/latitude/i, /lat/i);
    const lng = getInput(/longitude/i, /lng/i);

    expect(lat.value).toMatch(/42\.33333/);
    expect(lng.value).toMatch(/3\.44444/);
  });

  it("Given valid new lab data, When submitted, Then createLivingLab is called", async () => {
    createLivingLabMock.mockResolvedValueOnce({ id: 1 });
    render(<LivingLabForm livingLab={baseLab as any} />);

    const form = screen
      .getByRole("button", { name: /save|create|update/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createLivingLabMock).toHaveBeenCalledTimes(1);
    });
  });

  it("Given existing lab id, When submitted, Then updateLivingLab is called", async () => {
    updateLivingLabMock.mockResolvedValueOnce({ id: 99 });
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);

    const form = screen
      .getByRole("button", { name: /save|create|update/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(updateLivingLabMock).toHaveBeenCalledTimes(1);
    });
  });

  it("Given successful create, When submitted, Then redirects to /lab-admin", async () => {
    createLivingLabMock.mockResolvedValueOnce({ id: 1 });
    render(<LivingLabForm livingLab={baseLab as any} />);

    const form = screen
      .getByRole("button", { name: /save|create|update/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(window.location.href).toContain("/lab-admin");
    });
  });

  it("Given API 400 error, When submitted, Then shows validation error", async () => {
    createLivingLabMock.mockRejectedValueOnce(new Error("API Error (status=400): Unprocessable Entity"));
    render(<LivingLabForm livingLab={baseLab as any} />);

    const form = screen
      .getByRole("button", { name: /save|create|update/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(
      await screen.findByText(/only positive numbers are allowed/i),
    ).toBeInTheDocument();
  });

  it("Given API 409 error, When submitted, Then shows duplicate name error", async () => {
    createLivingLabMock.mockRejectedValueOnce(new Error("API Error (status=409): Conflict"));
    render(<LivingLabForm livingLab={baseLab as any} />);

    const form = screen
      .getByRole("button", { name: /save|create|update/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(await screen.findByText(/name already exists/i)).toBeInTheDocument();
  });

  it("Given unknown API error, When submitted, Then shows fallback error", async () => {
    createLivingLabMock.mockRejectedValueOnce(new Error("boom"));
    render(<LivingLabForm livingLab={baseLab as any} />);

    const form = screen
      .getByRole("button", { name: /save|create|update/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(
      await screen.findByText(
        /an error occurred while creating the living lab/i,
      ),
    ).toBeInTheDocument();
  });

  it("Given cancel button, When rendered, Then links to /lab-admin", () => {
    render(<LivingLabForm livingLab={baseLab as any} />);
    const cancelLink = screen.getByRole("link", { name: /cancel/i });
    expect(cancelLink).toHaveAttribute("href", "/lab-admin");
  });
});
