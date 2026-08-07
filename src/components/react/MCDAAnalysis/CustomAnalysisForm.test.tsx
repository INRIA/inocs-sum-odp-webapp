import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomAnalysisForm } from "./CustomAnalysisForm";
import ApiClient from "../../../lib/api-client/ApiClient";

vi.mock("../../../lib/api-client/ApiClient");

const defaultGoals = ["Cost Reduction", "Sustainability"];
const defaultActivities = ["E-Bike Sharing", "Carpool Platform"];

describe("CustomAnalysisForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the four custom-analysis sections", () => {
    render(
      <CustomAnalysisForm
        defaultGoals={defaultGoals}
        defaultActivities={defaultActivities}
      />,
    );

    expect(screen.getByText(/goals selection/i)).toBeInTheDocument();
    expect(screen.getByText(/goal weights/i)).toBeInTheDocument();
    expect(screen.getByText(/business activities/i)).toBeInTheDocument();
    expect(screen.getByText(/your ratings/i)).toBeInTheDocument();
  });

  it("syncs selected goals and activities to the ratings table", async () => {
    const user = userEvent.setup();

    render(
      <CustomAnalysisForm
        defaultGoals={defaultGoals}
        defaultActivities={defaultActivities}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cost Reduction" }));
    await user.click(screen.getByRole("button", { name: "Sustainability" }));
    await user.click(screen.getByRole("button", { name: "E-Bike Sharing" }));

    expect(
      screen.getByRole("spinbutton", {
        name: /score for e-bike sharing and cost reduction/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("spinbutton", {
        name: /score for e-bike sharing and sustainability/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /measurement note for cost reduction/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /measurement note for sustainability/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove sustainability/i }));

    expect(
      screen.queryByRole("spinbutton", {
        name: /score for e-bike sharing and sustainability/i,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("textbox", {
        name: /measurement note for sustainability/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("submits full payload and redirects on success", async () => {
    const mockResponse = {
      id: "full-custom-id-001",
      job_name: "mcda_analysis_qualitative_user_personalized",
      status: "PENDING",
      created_at: "2026-03-31T09:00:00",
    };

    const triggerFullCustomMCDA = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(ApiClient).mockImplementation(function (this: unknown) {
      return {
        triggerFullCustomMCDA,
      } as unknown as ApiClient;
    });

    const locationMock = { href: "" };
    vi.stubGlobal("location", locationMock);

    const user = userEvent.setup();
    render(
      <CustomAnalysisForm
        defaultGoals={defaultGoals}
        defaultActivities={defaultActivities}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cost Reduction" }));
    await user.click(screen.getByRole("button", { name: "Sustainability" }));
    await user.click(screen.getByRole("button", { name: "E-Bike Sharing" }));

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "0.6" } });
    fireEvent.change(sliders[1], { target: { value: "0.4" } });

    await user.type(
      screen.getByRole("spinbutton", {
        name: /score for e-bike sharing and cost reduction/i,
      }),
      "0.82",
    );

    await user.type(
      screen.getByRole("spinbutton", {
        name: /score for e-bike sharing and sustainability/i,
      }),
      "0.67",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: /measurement note for cost reduction/i,
      }),
      "EUR per year",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: /measurement note for sustainability/i,
      }),
      "Survey score 1 to 5",
    );

    await user.type(
      screen.getByRole("textbox", { name: /analysis name/i }),
      "Custom MCDA Run",
    );

    await user.click(
      screen.getByRole("button", {
        name: /run custom analysis/i,
      }),
    );

    await waitFor(() => {
      expect(triggerFullCustomMCDA).toHaveBeenCalledOnce();
    });

    const [payload] = triggerFullCustomMCDA.mock.calls[0];
    expect(payload).toEqual({
      name: "Custom MCDA Run",
      goals: [
        {
          name: "Cost Reduction",
          weight: 0.6,
          direction: "max",
        },
        {
          name: "Sustainability",
          weight: 0.4,
          direction: "max",
        },
      ],
      alternatives: [
        {
          name: "E-Bike Sharing",
          values: {
            "Cost Reduction": 0.82,
            Sustainability: 0.67,
          },
        },
      ],
    });

    await waitFor(() => {
      expect(locationMock.href).toBe(
        `/tools/mcda_analysis/user_personalized/${mockResponse.id}#results`,
      );
    });
  });

  it("blocks submission when weights are not normalized", async () => {
    const triggerFullCustomMCDA = vi.fn();
    vi.mocked(ApiClient).mockImplementation(function (this: unknown) {
      return {
        triggerFullCustomMCDA,
      } as unknown as ApiClient;
    });

    const user = userEvent.setup();
    render(
      <CustomAnalysisForm
        defaultGoals={defaultGoals}
        defaultActivities={defaultActivities}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cost Reduction" }));
    await user.click(screen.getByRole("button", { name: "Sustainability" }));
    await user.click(screen.getByRole("button", { name: "E-Bike Sharing" }));

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "0.6" } });
    fireEvent.change(sliders[1], { target: { value: "0.2" } });

    await user.type(
      screen.getByRole("spinbutton", {
        name: /score for e-bike sharing and cost reduction/i,
      }),
      "0.5",
    );

    await user.type(
      screen.getByRole("spinbutton", {
        name: /score for e-bike sharing and sustainability/i,
      }),
      "0.5",
    );

    await user.click(
      screen.getByRole("button", {
        name: /run custom analysis/i,
      }),
    );

    expect(triggerFullCustomMCDA).not.toHaveBeenCalled();
    expect(
      screen.getByText(/weights must sum to 100% before submitting/i),
    ).toBeInTheDocument();
  });
});
