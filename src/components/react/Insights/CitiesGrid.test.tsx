import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CitiesGrid } from "./CitiesGrid";
import type { CityCardData } from "../../../lib/utils/cityCards";

function makeCity(overrides: Partial<CityCardData>): CityCardData {
  return {
    id: "1",
    name: "Coimbra",
    country: "Portugal",
    type: "sum_living_lab",
    typeLabel: "SUM Living Lab",
    dataStatus: "has_data",
    population: 143000,
    area: 319,
    reportingSince: 2023,
    reportingSinceIsRegistration: false,
    measures: { total: 8, push: 3, pull: 5, other: 0, pushNames: ["M1", "M2", "M3"], pullNames: ["M4", "M5", "M6", "M7", "M8"], otherNames: [] },
    modalSplit: [],
    improved: [],
    regressed: [],
    indicatorsImproved: 0,
    indicatorsTotal: 0,
    href: "/living-lab-city/1",
    ...overrides,
  };
}

const cities: CityCardData[] = [
  makeCity({ id: "1", name: "Coimbra" }),
  makeCity({ id: "2", name: "Larnaca", dataStatus: "data_pending" }),
  makeCity({
    id: "42",
    name: "Example City",
    type: "contributing_city",
    typeLabel: "Contributing city",
  }),
  makeCity({
    id: "43",
    name: "Another City",
    type: "contributing_city",
    typeLabel: "Contributing city",
    dataStatus: "data_pending",
  }),
];

const cardNames = () =>
  screen
    .getAllByRole("article")
    .map((article) => within(article).getByRole("heading").textContent);

describe("CitiesGrid", () => {
  it("renders every city by default with a count", () => {
    render(<CitiesGrid cities={cities} />);

    expect(cardNames()).toEqual([
      "Coimbra",
      "Larnaca",
      "Example City",
      "Another City",
    ]);
    expect(screen.getByText(/^4 cities/)).toBeInTheDocument();
  });

  it("offers the three filters from the design plus All", () => {
    render(<CitiesGrid cities={cities} />);

    const group = screen.getByRole("group", { name: "Filter cities" });
    expect(
      within(group)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["All", "SUM Living Labs", "Contributing cities", "Data reported"]);
  });

  it("filters to SUM Living Labs", async () => {
    const user = userEvent.setup();
    render(<CitiesGrid cities={cities} />);

    await user.click(screen.getByRole("button", { name: "SUM Living Labs" }));

    expect(cardNames()).toEqual(["Coimbra", "Larnaca"]);
    expect(
      screen.getByRole("button", { name: "SUM Living Labs" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("filters to contributing cities", async () => {
    const user = userEvent.setup();
    render(<CitiesGrid cities={cities} />);

    await user.click(screen.getByRole("button", { name: "Contributing cities" }));

    expect(cardNames()).toEqual(["Example City", "Another City"]);
  });

  it("filters to cities that reported data", async () => {
    const user = userEvent.setup();
    render(<CitiesGrid cities={cities} />);

    await user.click(screen.getByRole("button", { name: "Data reported" }));

    expect(cardNames()).toEqual(["Coimbra", "Example City"]);
    expect(screen.getByText(/^2 cities/)).toBeInTheDocument();
  });

  it("shows an empty state when a filter matches nothing", async () => {
    const user = userEvent.setup();
    render(<CitiesGrid cities={[cities[0], cities[1]]} />);

    await user.click(screen.getByRole("button", { name: "Contributing cities" }));

    expect(screen.getByText("No cities match this filter.")).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("pages through cities one at a time on phones", async () => {
    const user = userEvent.setup();
    render(<CitiesGrid cities={cities} />);

    expect(screen.getByText("1 / 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous city" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next city" }));
    expect(screen.getByText("2 / 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous city" }));
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("resets the pager when the filter changes", async () => {
    const user = userEvent.setup();
    render(<CitiesGrid cities={cities} />);

    await user.click(screen.getByRole("button", { name: "Next city" }));
    expect(screen.getByText("2 / 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "SUM Living Labs" }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("hides the pager when a single city is shown", async () => {
    const user = userEvent.setup();
    render(<CitiesGrid cities={[cities[0], cities[2]]} />);

    await user.click(screen.getByRole("button", { name: "SUM Living Labs" }));

    expect(
      screen.queryByRole("button", { name: "Next city" }),
    ).not.toBeInTheDocument();
  });
});
