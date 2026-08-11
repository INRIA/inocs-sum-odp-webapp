import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CityCard } from "./CityCard";
import type { CityCardData } from "../../../lib/utils/cityCards";

function makeCity(overrides: Partial<CityCardData> = {}): CityCardData {
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
    improved: [
      { kpiId: 1, name: "Public transport share", change: 0.042, display: "+4.2%" },
    ],
    regressed: [
      { kpiId: 2, name: "Shared-mode share", change: -0.014, display: "−1.4%" },
    ],
    indicatorsImproved: 5,
    indicatorsTotal: 8,
    href: "/living-lab-city/1",
    ...overrides,
  };
}

describe("CityCard", () => {
  it("renders identity and context", () => {
    render(<CityCard city={makeCity()} />);

    expect(screen.getByText("Coimbra")).toBeInTheDocument();
    expect(screen.getByText("Portugal")).toBeInTheDocument();
    expect(screen.getByText("SUM Living Lab")).toBeInTheDocument();
    expect(screen.getByText("143,000")).toBeInTheDocument();
    expect(screen.getByText("319 km²")).toBeInTheDocument();
    expect(screen.getByText("Reporting since")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("shows the measures split", () => {
    render(<CityCard city={makeCity()} />);

    expect(screen.getByText("8 measures")).toBeInTheDocument();
    expect(screen.getByText("3 push · 5 pull")).toBeInTheDocument();
  });

  it("lists improved KPIs above regressed KPIs with their variation", () => {
    render(<CityCard city={makeCity()} />);

    expect(screen.getByText("Improved")).toBeInTheDocument();
    expect(screen.getByText("Public transport share")).toBeInTheDocument();
    expect(screen.getByText("+4.2%")).toBeInTheDocument();
    expect(screen.getByText("Declined")).toBeInTheDocument();
    expect(screen.getByText("Shared-mode share")).toBeInTheDocument();
    expect(screen.getByText("−1.4%")).toBeInTheDocument();

    const improvedLabel = screen.getByText("Improved");
    const declinedLabel = screen.getByText("Declined");
    expect(
      improvedLabel.compareDocumentPosition(declinedLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("summarises how many indicators improved", () => {
    render(<CityCard city={makeCity()} />);
    expect(screen.getByText("5 of 8")).toBeInTheDocument();
  });

  it("renders the pending state instead of KPI lists when nothing is published", () => {
    render(
      <CityCard
        city={makeCity({
          dataStatus: "data_pending",
          improved: [],
          regressed: [],
          indicatorsImproved: 0,
          indicatorsTotal: 0,
        })}
      />,
    );

    expect(screen.getByText("Results not published yet")).toBeInTheDocument();
    expect(screen.queryByText("Improved")).not.toBeInTheDocument();
    // Context and measures stay visible so the card never looks broken.
    expect(screen.getByText("8 measures")).toBeInTheDocument();
    expect(screen.getByText("143,000")).toBeInTheDocument();
  });

  it("labels the year as registration when nothing has been reported", () => {
    render(
      <CityCard
        city={makeCity({
          reportingSinceIsRegistration: true,
          reportingSince: 2026,
        })}
      />,
    );

    expect(screen.getByText("Registered")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  it("falls back to em dashes for missing context values", () => {
    render(
      <CityCard
        city={makeCity({ population: null, area: null, reportingSince: null })}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("links to the city page", () => {
    render(<CityCard city={makeCity()} />);
    const link = screen.getByRole("link", { name: /Coimbra data/ });
    expect(link).toHaveAttribute("href", "/living-lab-city/1");
  });
});
