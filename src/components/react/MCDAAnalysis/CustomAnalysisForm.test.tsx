import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomAnalysisForm } from "./CustomAnalysisForm";
import type { MCDAGoal } from "../../../types";

const mockGoals: MCDAGoal[] = [
  { name: "Improve Accessibility", weight: 0.125 },
  { name: "Improve Mobility Service", weight: 0.125 },
  { name: "Improve Multimodality", weight: 0.125 },
  { name: "Noise Hinderance", weight: 0.125 },
  { name: "Improve Public Transport", weight: 0.125 },
  { name: "Reduction of Congestion", weight: 0.125 },
  { name: "Reduction of Emission", weight: 0.125 },
  { name: "Improve Safety", weight: 0.125 },
];

describe("CustomAnalysisForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── Render tests (T016) ─────────────────────────────────────────────────

  describe("render", () => {
    it("renders without crashing given a goals prop", () => {
      expect(() =>
        render(<CustomAnalysisForm goals={mockGoals} />),
      ).not.toThrow();
    });

    it("displays the privacy hint on every render", () => {
      render(<CustomAnalysisForm goals={mockGoals} />);
      // The privacy hint should always be present in the DOM
      const hint = screen.getByText(
        /do not include names, emails, or other identifying information/i,
      );
      expect(hint).toBeInTheDocument();
    });

    it("has a name input element", () => {
      render(<CustomAnalysisForm goals={mockGoals} />);
      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      expect(nameInput).toBeInTheDocument();
    });

    it("passes editable={true} to GoalsSection", () => {
      render(<CustomAnalysisForm goals={mockGoals} />);
      // GoalsSection with editable=true shows a Validate button
      expect(screen.getByRole("button", { name: /validate/i })).toBeInTheDocument();
    });

    it("has a submit button with an appropriate label", () => {
      render(<CustomAnalysisForm goals={mockGoals} />);
      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      expect(submitBtn).toBeInTheDocument();
    });
  });

  // ─── Interaction and happy path tests (T017) ─────────────────────────────

  describe("interaction and happy path", () => {
    it("reflects name input changes in the controlled state", async () => {
      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "My test analysis");

      expect(nameInput).toHaveValue("My test analysis");
    });

    it("calls fetch with POST /api/v1/job-runs and correct body on submit", async () => {
      const jobId = "test-job-id-123";
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ job_id: jobId }), { status: 200 }),
      );

      // Stub window.location.href setter
      const locationMock = { href: "" };
      vi.stubGlobal("location", locationMock);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Geneva pilot");

      // Click Validate to normalize weights (required before submit)
      const validateBtn = screen.getByRole("button", { name: /validate/i });
      await user.click(validateBtn);

      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledOnce();
        const [url, init] = vi.mocked(fetch).mock.calls[0];
        expect(url).toBe("/api/v1/job-runs");
        expect((init as RequestInit).method).toBe("POST");

        const body = JSON.parse((init as RequestInit).body as string);
        expect(body.name).toBe("Geneva pilot");
        expect(typeof body.goals_weights).toBe("object");
        expect(Object.keys(body.goals_weights).length).toBeGreaterThan(0);
      });
    });

    it("shows a loading indicator while the fetch is pending", async () => {
      // Create a promise we control
      let resolvePromise!: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(fetch).mockReturnValueOnce(pendingPromise);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Test run");

      const validateBtn = screen.getByRole("button", { name: /validate/i });
      await user.click(validateBtn);

      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      await user.click(submitBtn);

      // Loading indicator should be visible
      await waitFor(() => {
        expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
      });

      // Resolve so test cleanup works
      resolvePromise(new Response(JSON.stringify({ job_id: "x" }), { status: 200 }));
    });

    it("disables the submit button while isLoading is true", async () => {
      let resolvePromise!: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(fetch).mockReturnValueOnce(pendingPromise);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Test run");

      const validateBtn = screen.getByRole("button", { name: /validate/i });
      await user.click(validateBtn);

      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /run custom analysis/i }),
        ).toBeDisabled();
      });

      resolvePromise(new Response(JSON.stringify({ job_id: "x" }), { status: 200 }));
    });

    it("navigates to /tools/mcda_analysis/results/<job-id> on success", async () => {
      const jobId = "550e8400-e29b-41d4-a716-446655440001";
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ job_id: jobId }), { status: 200 }),
      );

      const locationMock = { href: "" };
      vi.stubGlobal("location", locationMock);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Redirect test");

      const validateBtn = screen.getByRole("button", { name: /validate/i });
      await user.click(validateBtn);

      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(locationMock.href).toBe(
          `/tools/mcda_analysis/results/${jobId}`,
        );
      });
    });
  });

  // ─── Edge-case and error tests (T018) ─────────────────────────────────────

  describe("edge cases and errors", () => {
    it("prevents submission and shows a validation message when name is empty", async () => {
      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      // Do not fill in the name input; attempt to submit
      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      await user.click(submitBtn);

      expect(fetch).not.toHaveBeenCalled();
      expect(screen.getByText(/analysis name is required/i)).toBeInTheDocument();
    });

    it("prevents submission and shows a validation message when all weights are zero", async () => {
      const zeroGoals: MCDAGoal[] = mockGoals.map((g) => ({ ...g, weight: 0 }));
      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={zeroGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Zero weight test");

      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      await user.click(submitBtn);

      expect(fetch).not.toHaveBeenCalled();
      // Should show a validation message about weights
      expect(
        screen.getByText(/at least one goal must have a non-zero weight/i),
      ).toBeInTheDocument();
    });

    it("renders InfoAlert with error variant when API returns an error response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Service unavailable" }), {
          status: 502,
        }),
      );

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Error test");

      const validateBtn = screen.getByRole("button", { name: /validate/i });
      await user.click(validateBtn);

      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      await user.click(submitBtn);

      await waitFor(() => {
        // Should display an error alert
        expect(
          screen.getByRole("status"),
        ).toBeInTheDocument();
      });
    });

    it("does not trigger a second fetch call when submit is clicked while isLoading is true", async () => {
      let resolvePromise!: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(fetch).mockReturnValue(pendingPromise);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Double submit test");

      const validateBtn = screen.getByRole("button", { name: /validate/i });
      await user.click(validateBtn);

      const submitBtn = screen.getByRole("button", { name: /run custom analysis/i });
      // First click
      await user.click(submitBtn);
      // Second click while loading
      await user.click(submitBtn);

      // fetch should only have been called once
      expect(fetch).toHaveBeenCalledTimes(1);

      resolvePromise(new Response(JSON.stringify({ job_id: "x" }), { status: 200 }));
    });
  });
});
