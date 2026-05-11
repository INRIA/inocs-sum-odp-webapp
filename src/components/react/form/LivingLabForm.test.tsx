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

vi.mock("./CitySearchSelector", () => ({
  CitySearchSelector: function MockCitySearchSelector({ onSelect }: any) {
    return (
      <div data-testid="mock-city-search-selector">
        <button
          type="button"
          onClick={() =>
            onSelect({
              cityName: "Lille",
              postalCode: "59000",
              country: "France",
              countryCode: "FRA",
              lat: 50.62919,
              lng: 3.05726,
              label: "Lille, Hauts-de-France, France",
            })
          }
        >
          mock-city-select
        </button>
      </div>
    );
  },
}));

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

  it("Given existing lab with unchanged fields, Then save button is disabled", () => {
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);

    const saveButton = screen.getByRole("button", { name: /save living lab/i });
    expect(saveButton).toBeDisabled();
  });

  it("Given existing lab, When user changes then reverts field, Then save button re-disables", async () => {
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);

    const saveButton = screen.getByRole("button", { name: /save living lab/i });
    const nameInput = getInput(/living lab or city name/i, /name/i);

    expect(saveButton).toBeDisabled();

    await userEvent.type(nameInput, " Updated");
    expect(saveButton).not.toBeDisabled();

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Lab A");
    expect(saveButton).toBeDisabled();
  });

  it("Given existing lab with unchanged fields, When form is submitted programmatically, Then update is not called", async () => {
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);

    const form = screen
      .getByRole("button", { name: /save|create|update/i })
      .closest("form") as HTMLFormElement;

    fireEvent.submit(form);

    await waitFor(() => {
      expect(updateLivingLabMock).not.toHaveBeenCalled();
    });
  });

  it("Given existing lab id, When submitted, Then updateLivingLab is called", async () => {
    updateLivingLabMock.mockResolvedValueOnce({ id: 99 });
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);

    const name = getInput(/living lab or city name/i, /name/i);
    await userEvent.type(name, " Updated");

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

  // --- CitySearchSelector integration ---

  it("Given city selector, When a city is selected, Then name field is filled with cityName", async () => {
    render(<LivingLabForm />);
    await userEvent.click(
      screen.getByRole("button", { name: /mock-city-select/i }),
    );
    const name = getInput(/living lab or city name/i, /name/i);
    expect(name.value).toBe("Lille");
  });

  it("Given city selector, When a city is selected, Then country field is filled with country", async () => {
    render(<LivingLabForm />);
    await userEvent.click(
      screen.getByRole("button", { name: /mock-city-select/i }),
    );
    const country = document.getElementById("country") as HTMLInputElement;
    expect(country.value).toBe("France");
  });

  it("Given city selector, When a city is selected, Then hidden countryCode is updated", async () => {
    render(<LivingLabForm />);
    await userEvent.click(
      screen.getByRole("button", { name: /mock-city-select/i }),
    );
    const countryCode = document.getElementById(
      "country_code2",
    ) as HTMLInputElement;
    expect(countryCode.value).toBe("FRA");
  });

  it("Given city selector, When a city is selected, Then lat/lng hidden fields are updated", async () => {
    render(<LivingLabForm />);
    await userEvent.click(
      screen.getByRole("button", { name: /mock-city-select/i }),
    );
    const lat = document.getElementById("lat") as HTMLInputElement;
    const lng = document.getElementById("lng") as HTMLInputElement;
    expect(lat.value).toBe("50.62919");
    expect(lng.value).toBe("3.05726");
  });

  it("Given city selector, When a city is selected, Then map placement hint is hidden", async () => {
    render(<LivingLabForm />);
    await userEvent.click(
      screen.getByRole("button", { name: /mock-city-select/i }),
    );
    expect(screen.queryByText(/click to place/i)).not.toBeInTheDocument();
  });

  it("Given city selector, When a city is selected, Then submit payload includes country and countryCode", async () => {
    createLivingLabMock.mockResolvedValueOnce({ id: 1 });
    render(<LivingLabForm />);

    await userEvent.click(
      screen.getByRole("button", { name: /mock-city-select/i }),
    );

    const form = screen
      .getByRole("button", { name: /save/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createLivingLabMock).toHaveBeenCalledWith(
        expect.objectContaining({
          country: "France",
          country_code2: "FRA",
          lat: "50.62919",
          lng: "3.05726",
        }),
      );
    });
  });

  // --- Search panel visibility (edit vs create mode) ---

  it("Given create mode (no id), When mounted, Then CitySearchSelector is visible", () => {
    render(<LivingLabForm />);
    expect(screen.getByTestId("mock-city-search-selector")).toBeInTheDocument();
  });

  it("Given edit mode (has id), When mounted, Then CitySearchSelector is collapsed", () => {
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);
    expect(
      screen.queryByTestId("mock-city-search-selector"),
    ).not.toBeInTheDocument();
  });

  it("Given edit mode, When mounted, Then 'City Search Helper' button is visible", () => {
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);
    expect(
      screen.getByRole("button", { name: /city search helper/i }),
    ).toBeInTheDocument();
  });

  it("Given edit mode, When 'City Search Helper' is clicked, Then CitySearchSelector appears", async () => {
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);
    await userEvent.click(
      screen.getByRole("button", { name: /city search helper/i }),
    );
    expect(screen.getByTestId("mock-city-search-selector")).toBeInTheDocument();
  });

  it("Given edit mode with search open, When 'Hide Search' is clicked, Then CitySearchSelector collapses", async () => {
    render(<LivingLabForm livingLab={{ ...baseLab, id: 99 } as any} />);
    await userEvent.click(
      screen.getByRole("button", { name: /city search helper/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /hide search/i }),
    );
    expect(
      screen.queryByTestId("mock-city-search-selector"),
    ).not.toBeInTheDocument();
  });

  it("Given create mode, Then 'City Search Helper' toggle button is not shown", () => {
    render(<LivingLabForm />);
    expect(
      screen.queryByRole("button", { name: /city search helper/i }),
    ).not.toBeInTheDocument();
  });
});
