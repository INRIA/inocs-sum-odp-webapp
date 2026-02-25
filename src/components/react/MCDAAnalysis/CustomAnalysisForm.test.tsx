import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomAnalysisForm } from "./CustomAnalysisForm";
import type { MCDAGoal } from "../../../types";
import ApiClient from "../../../lib/api-client/ApiClient";

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
    vi.mock("../../../lib/api-client/ApiClient");
  });

  afterEach(() => {
    vi.clearAllMocks();
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

    it("has a submit button with an appropriate label", () => {
      render(<CustomAnalysisForm goals={mockGoals} />);
      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
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

    it("calls ApiClient.triggerJobRun with correct parameters on submit", async () => {
      const mockJobResponse = {
        id: "test-job-id-123",
        job_name: "mcda_analysis_qualitative_user_personalized",
        status: "PENDING",
        message: null,
        created_at: "2026-02-25T06:13:46",
        started_at: null,
        completed_at: null,
      };

      const mockTriggerJobRun = vi.fn().mockResolvedValue(mockJobResponse);
      vi.mocked(ApiClient).mockImplementation(function (this: any) {
        return {
          triggerJobRun: mockTriggerJobRun,
        };
      } as any);

      // Stub window.location.href setter
      const locationMock = { href: "" };
      vi.stubGlobal("location", locationMock);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Geneva pilot");

      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockTriggerJobRun).toHaveBeenCalledOnce();
        const [name, goalsWeights] = mockTriggerJobRun.mock.calls[0];
        expect(name).toBe("Geneva pilot");
        expect(typeof goalsWeights).toBe("object");
        expect(Object.keys(goalsWeights).length).toBeGreaterThan(0);
      });

      vi.unstubAllGlobals();
    });

    it("shows a loading indicator while the API call is pending", async () => {
      // Create a promise we control
      let resolvePromise!: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockTriggerJobRun = vi.fn().mockReturnValue(pendingPromise);
      vi.mocked(ApiClient).mockImplementation(function (this: any) {
        return {
          triggerJobRun: mockTriggerJobRun,
        };
      } as any);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Test run");

      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
      await user.click(submitBtn);

      // Loading indicator should be visible
      await waitFor(() => {
        expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
      });

      // Resolve so test cleanup works
      resolvePromise({ id: "x", status: "PENDING" });
    });

    it("disables the submit button while isLoading is true", async () => {
      let resolvePromise!: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockTriggerJobRun = vi.fn().mockReturnValue(pendingPromise);
      vi.mocked(ApiClient).mockImplementation(function (this: any) {
        return {
          triggerJobRun: mockTriggerJobRun,
        };
      } as any);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Test run");

      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /run custom analysis/i }),
        ).toBeDisabled();
      });

      resolvePromise({ id: "x", status: "PENDING" });
    });

    it("navigates to /tools/mcda_analysis/user_personalized/<job-id> on success", async () => {
      const mockJobResponse = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        job_name: "mcda_analysis_qualitative_user_personalized",
        status: "PENDING",
        message: null,
        created_at: "2026-02-25T06:13:46",
        started_at: null,
        completed_at: null,
      };

      const mockTriggerJobRun = vi.fn().mockResolvedValue(mockJobResponse);
      vi.mocked(ApiClient).mockImplementation(function (this: any) {
        return {
          triggerJobRun: mockTriggerJobRun,
        };
      } as any);

      const locationMock = { href: "" };
      vi.stubGlobal("location", locationMock);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Redirect test");

      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(locationMock.href).toBe(
          `/tools/mcda_analysis/user_personalized/${mockJobResponse.id}#results`,
        );
      });

      vi.unstubAllGlobals();
    });
  });

  // ─── Edge-case and error tests (T018) ─────────────────────────────────────

  describe("edge cases and errors", () => {
    it("auto-generates name when left empty using highest and lowest weighted goals", async () => {
      const mockJobResponse = {
        id: "test-id",
        job_name: "mcda_analysis_qualitative_user_personalized",
        status: "PENDING",
        message: null,
        created_at: "2026-02-25T06:13:46",
        started_at: null,
        completed_at: null,
      };
      const mockTriggerJobRun = vi.fn().mockResolvedValue(mockJobResponse);
      vi.mocked(ApiClient).mockImplementation(function (this: any) {
        return {
          triggerJobRun: mockTriggerJobRun,
        };
      } as any);

      const locationMock = { href: "" };
      vi.stubGlobal("location", locationMock);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      // Do not fill in the name input; submit directly
      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockTriggerJobRun).toHaveBeenCalledOnce();
        const [generatedName] = mockTriggerJobRun.mock.calls[0];
        // Since all weights are equal (0.125), the generated name should use first and last goals
        expect(generatedName).toMatch(/^High .+ and low .+$/);
      });

      vi.unstubAllGlobals();
    });

    it("prevents submission and shows a validation message when all weights are zero", async () => {
      const mockTriggerJobRun = vi.fn();
      vi.mocked(ApiClient).mockImplementation(function (this: any) {
        return {
          triggerJobRun: mockTriggerJobRun,
        };
      } as any);

      const zeroGoals: MCDAGoal[] = mockGoals.map((g) => ({ ...g, weight: 0 }));
      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={zeroGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Zero weight test");

      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
      await user.click(submitBtn);

      expect(mockTriggerJobRun).not.toHaveBeenCalled();
      // Should show a validation message about weights
      expect(
        screen.getByText(/at least one goal must have a non-zero weight/i),
      ).toBeInTheDocument();
    });

    it("renders InfoAlert with error variant when API returns an error response", async () => {
      const mockTriggerJobRun = vi
        .fn()
        .mockRejectedValue(
          new Error("API Error (status=502): Service unavailable"),
        );
      vi.mocked(ApiClient).mockImplementation(function (this: any) {
        return {
          triggerJobRun: mockTriggerJobRun,
        };
      } as any);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Error test");

      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
      await user.click(submitBtn);

      await waitFor(() => {
        // Should display an error alert
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
    });

    it("does not trigger a second API call when submit is clicked while isLoading is true", async () => {
      let resolvePromise!: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockTriggerJobRun = vi.fn().mockReturnValue(pendingPromise);
      vi.mocked(ApiClient).mockImplementation(function (this: any) {
        return {
          triggerJobRun: mockTriggerJobRun,
        };
      } as any);

      const user = userEvent.setup();
      render(<CustomAnalysisForm goals={mockGoals} />);

      const nameInput = screen.getByRole("textbox", { name: /analysis name/i });
      await user.type(nameInput, "Double submit test");

      const submitBtn = screen.getByRole("button", {
        name: /run custom analysis/i,
      });
      // First click
      await user.click(submitBtn);
      // Second click while loading
      await user.click(submitBtn);

      // API call should only have been triggered once
      expect(mockTriggerJobRun).toHaveBeenCalledTimes(1);

      resolvePromise({ id: "x", status: "PENDING" });
    });
  });
});
