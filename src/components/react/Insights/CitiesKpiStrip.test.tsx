import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CitiesKpiStrip } from "./CitiesKpiStrip";

describe("CitiesKpiStrip", () => {
  const defaults = {
    sumLivingLabs: 7,
    contributingCities: 5,
    countries: 9,
    kpiRecords: 142,
    policyMeasures: 63,
  };

  it("renders all five counters with their labels", () => {
    render(<CitiesKpiStrip {...defaults} />);

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("SUM Living Labs")).toBeInTheDocument();

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Contributing cities")).toBeInTheDocument();

    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Countries")).toBeInTheDocument();

    expect(screen.getByText("142")).toBeInTheDocument();
    expect(screen.getByText("Reported KPI records")).toBeInTheDocument();

    expect(screen.getByText("63")).toBeInTheDocument();
    expect(screen.getByText("Policy measures")).toBeInTheDocument();
  });

  it("formats large numbers with locale grouping", () => {
    render(<CitiesKpiStrip {...defaults} kpiRecords={1234} />);
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });
});
