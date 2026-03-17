import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "./MetricCard";
import type { MetricCardData } from "./types";

describe("MetricCard component - User Story 1", () => {
  it("renders label and value correctly", () => {
    const data: MetricCardData = {
      label: "Living Labs",
      value: "12",
    };

    render(<MetricCard data={data} />);

    expect(screen.getByText("Living Labs")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders with color class when provided", () => {
    const data: MetricCardData = {
      label: "Users",
      value: "45 / 3",
      color: "text-primary",
    };

    render(<MetricCard data={data} />);

    const valueElement = screen.getByText("45 / 3");
    expect(valueElement).toHaveClass("text-primary");
  });

  it("renders without color class when not provided", () => {
    const data: MetricCardData = {
      label: "Count",
      value: "100",
    };

    render(<MetricCard data={data} />);

    const valueElement = screen.getByText("100");
    expect(valueElement).toHaveClass("text-gray-900");
  });

  it("renders zero value correctly (edge case)", () => {
    const data: MetricCardData = {
      label: "Empty Metric",
      value: "0",
      icon: "chart",
    };

    render(<MetricCard data={data} />);

    expect(screen.getByText("Empty Metric")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders compound value like active/pending users", () => {
    const data: MetricCardData = {
      label: "Users (active / pending)",
      value: "25 / 5",
      icon: "users",
      color: "text-secondary",
    };

    render(<MetricCard data={data} />);

    expect(screen.getByText("Users (active / pending)")).toBeInTheDocument();
    expect(screen.getByText("25 / 5")).toBeInTheDocument();
  });

  it("applies card styling classes", () => {
    const data: MetricCardData = {
      label: "Test",
      value: "1",
    };

    const { container } = render(<MetricCard data={data} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-white");
    expect(card).toHaveClass("rounded-lg");
    expect(card).toHaveClass("shadow");
  });
});
