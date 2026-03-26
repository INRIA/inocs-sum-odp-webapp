import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CitySearchSelector } from "./CitySearchSelector";
import type { IGiscoSearchResult } from "../../../types/Gisco";

const { searchCitiesMock } = vi.hoisted(() => ({
  searchCitiesMock: vi.fn(),
}));

vi.mock("../../../lib/api-client/ApiClient", () => ({
  default: vi.fn(function () {
    return { searchCities: searchCitiesMock };
  }),
}));

const lilleResult: IGiscoSearchResult = {
  cityName: "Lille",
  postalCode: "59000",
  country: "France",
  countryCode: "FRA",
  lat: 50.6292,
  lng: 3.0573,
  label: "Lille, Hauts-de-France, France",
};

const parisResult: IGiscoSearchResult = {
  cityName: "Paris",
  postalCode: "75001",
  country: "France",
  countryCode: "FRA",
  lat: 48.8566,
  lng: 2.3522,
  label: "Paris, Île-de-France, France",
};

describe("CitySearchSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Rendering ---

  it("renders a search input and a Search button", () => {
    render(<CitySearchSelector onSelect={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("renders a label for the search input", () => {
    render(<CitySearchSelector onSelect={vi.fn()} />);
    expect(screen.getByLabelText(/search city/i)).toBeInTheDocument();
  });

  // --- Search trigger ---

  it("calls GiscoEuApi.search with the typed query on button click", async () => {
    searchCitiesMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<CitySearchSelector onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "Lille");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(searchCitiesMock).toHaveBeenCalledWith("Lille"));
  });

  it("calls GiscoEuApi.search when Enter key is pressed in the input", async () => {
    searchCitiesMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<CitySearchSelector onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "Lille{Enter}");

    await waitFor(() => expect(searchCitiesMock).toHaveBeenCalledWith("Lille"));
  });

  it("does not call GiscoEuApi.search when query is empty", async () => {
    const user = userEvent.setup();
    render(<CitySearchSelector onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(searchCitiesMock).not.toHaveBeenCalled();
  });

  // --- Loading state ---

  it("shows loading state while search is in progress", async () => {
    let resolve: (val: IGiscoSearchResult[]) => void;
    searchCitiesMock.mockReturnValueOnce(
      new Promise<IGiscoSearchResult[]>((r) => {
        resolve = r;
      }),
    );

    render(<CitySearchSelector onSelect={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Lille" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(
      screen.getByRole("button", { name: /searching/i }),
    ).toBeInTheDocument();

    await act(async () => {
      resolve!([]);
    });

    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  // --- Results display ---

  it("renders city name, postal code, and country for each result", async () => {
    searchCitiesMock.mockResolvedValueOnce([lilleResult, parisResult]);
    const user = userEvent.setup();
    render(<CitySearchSelector onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "France");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByText("Lille")).toBeInTheDocument();
      expect(screen.getByText(/59000/)).toBeInTheDocument();
      expect(screen.getAllByText(/France/)[0]).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.getByText(/75001/)).toBeInTheDocument();
    });
  });

  it("calls onSelect with the correct result when a result is clicked", async () => {
    searchCitiesMock.mockResolvedValueOnce([lilleResult]);
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<CitySearchSelector onSelect={onSelect} />);

    await user.type(screen.getByRole("textbox"), "Lille");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() =>
      screen.getByRole("button", { name: "Lille, Hauts-de-France, France" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Lille, Hauts-de-France, France" }),
    );

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(lilleResult);
  });

  it("shows 'No results found' when the search returns an empty array", async () => {
    searchCitiesMock.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<CitySearchSelector onSelect={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "XYZABCUNKNOWN");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() =>
      expect(screen.getByText(/no results found/i)).toBeInTheDocument(),
    );
  });

  // --- Rate limiting / cooldown ---

  it("does not call GiscoEuApi.search a second time within 5 seconds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    searchCitiesMock.mockResolvedValue([]);

    render(<CitySearchSelector onSelect={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Lille" } });

    // First search
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    // Flush microtasks so the first search completes and button is re-enabled
    await act(async () => {});

    // Second click — time hasn't advanced, still within the 5-second window
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(searchCitiesMock).toHaveBeenCalledTimes(1);
  });

  it("shows a friendly countdown message on the second search within 5 seconds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    searchCitiesMock.mockResolvedValue([]);

    render(<CitySearchSelector onSelect={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Lille" } });

    // First search
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    // Flush microtasks so the first search completes and button is re-enabled
    await act(async () => {});

    // Second click immediately → cooldown
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
  });

  it("countdown message mentions the 5-second delay and explains why", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    searchCitiesMock.mockResolvedValue([]);

    render(<CitySearchSelector onSelect={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Lille" } });

    // First search
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await act(async () => {});

    // Second click → cooldown
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    const message = screen.getByText(/please wait/i);
    expect(message.textContent).toMatch(/5 seconds/i);
    // Should explain the reason in a user-friendly way
    expect(message.textContent?.length).toBeGreaterThan(30);
  });

  it("countdown decrements every second", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    searchCitiesMock.mockResolvedValue([]);

    render(<CitySearchSelector onSelect={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Lille" } });

    // First search
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await act(async () => {});

    // Second click → cooldown at 5s
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByText(/please wait/i).textContent).toContain("5");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/please wait/i).textContent).toContain("4");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/please wait/i).textContent).toContain("3");
  });

  it("hides the countdown message after it reaches zero", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    searchCitiesMock.mockResolvedValue([]);

    render(<CitySearchSelector onSelect={vi.fn()} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Lille" } });

    // First search
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await act(async () => {});

    // Second click → cooldown starts at 5
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText(/please wait/i)).not.toBeInTheDocument();
  });
});
