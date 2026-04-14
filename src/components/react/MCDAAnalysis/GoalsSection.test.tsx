import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalsSection } from "./GoalsSection";
import type { MCDAGoal } from "../../../types";

const goals: MCDAGoal[] = [
  { name: "Emissions", weight: 0.2, direction: "min" },
  { name: "Accessibility", weight: 0.3, direction: "max" },
  { name: "Cost", weight: 0.5, direction: "min" },
];

describe("GoalsSection", () => {
  it("applies equal weights across the selected goals", async () => {
    const onWeightsUpdate = vi.fn();
    const user = userEvent.setup();

    render(
      <GoalsSection
        goals={goals}
        editable={true}
        onWeightsUpdate={onWeightsUpdate}
        showDirectionToggle={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: /equal weights/i }));

    const updatedGoals = onWeightsUpdate.mock.calls.at(-1)?.[0] as MCDAGoal[];
    expect(updatedGoals).toBeDefined();
    expect(
      screen.getAllByRole("group", {
        name: /goal optimization direction/i,
      }),
    ).toHaveLength(3);
    expect(updatedGoals.map((goal) => goal.weight)).toEqual([0.34, 0.33, 0.33]);
    expect(updatedGoals.reduce((sum, goal) => sum + goal.weight, 0)).toBe(1);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows only the selected direction in read-only mode", () => {
    render(
      <GoalsSection
        goals={goals.slice(0, 2)}
        editable={false}
        showDirectionToggle={true}
      />,
    );

    expect(
      screen.queryByRole("group", {
        name: /goal optimization direction/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /set goal to maximize/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /set goal to minimize/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("To minimize")).toBeInTheDocument();
    expect(screen.getByText("To maximize")).toBeInTheDocument();
  });
});