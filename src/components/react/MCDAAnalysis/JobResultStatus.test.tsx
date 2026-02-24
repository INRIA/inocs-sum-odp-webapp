import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JobResultStatus } from "./JobResultStatus";

describe("JobResultStatus", () => {
  // ─── FAILURE state (T010) ─────────────────────────────────────────────────

  describe("status='FAILURE'", () => {
    it("renders an error heading", () => {
      render(<JobResultStatus status="FAILURE" />);
      // Should contain an error heading
      const heading = screen.getByRole("heading");
      expect(heading).toBeInTheDocument();
      expect(heading.textContent?.toLowerCase()).toMatch(/error|failed|analysis/);
    });

    it("renders text instructing the user to contact the platform administrator", () => {
      render(<JobResultStatus status="FAILURE" />);
      expect(screen.getByText(/contact the platform administrator/i)).toBeInTheDocument();
    });

    it("does NOT render a 'Refresh page' button when status is FAILURE", () => {
      render(<JobResultStatus status="FAILURE" />);
      expect(screen.queryByRole("button", { name: /refresh page/i })).not.toBeInTheDocument();
    });
  });

  // ─── PENDING state (T010) ─────────────────────────────────────────────────

  describe("status='PENDING'", () => {
    it("renders the in-process message for PENDING status", () => {
      render(<JobResultStatus status="PENDING" />);
      expect(
        screen.getByText(/the job is currently in process/i),
      ).toBeInTheDocument();
    });

    it("renders 'Please try again by refreshing the page' text for PENDING", () => {
      render(<JobResultStatus status="PENDING" />);
      expect(screen.getByText(/please try again by refreshing the page/i)).toBeInTheDocument();
    });
  });

  // ─── STARTED state (T010) ────────────────────────────────────────────────

  describe("status='STARTED'", () => {
    it("renders the same in-process message for STARTED status", () => {
      render(<JobResultStatus status="STARTED" />);
      expect(
        screen.getByText(/the job is currently in process/i),
      ).toBeInTheDocument();
    });

    it("renders 'Please try again by refreshing the page' text for STARTED", () => {
      render(<JobResultStatus status="STARTED" />);
      expect(screen.getByText(/please try again by refreshing the page/i)).toBeInTheDocument();
    });
  });

  // ─── Interaction and detail tests (T011) ─────────────────────────────────

  describe("Refresh page button", () => {
    it("is visible when status is PENDING", () => {
      render(<JobResultStatus status="PENDING" />);
      expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
    });

    it("is visible when status is STARTED", () => {
      render(<JobResultStatus status="STARTED" />);
      expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
    });

    it("calls window.location.reload() when Refresh page button is clicked (PENDING)", () => {
      const reloadMock = vi.fn();
      vi.stubGlobal("location", { ...window.location, reload: reloadMock });

      render(<JobResultStatus status="PENDING" />);
      fireEvent.click(screen.getByRole("button", { name: /refresh page/i }));

      expect(reloadMock).toHaveBeenCalledOnce();
      vi.unstubAllGlobals();
    });

    it("calls window.location.reload() when Refresh page button is clicked (STARTED)", () => {
      const reloadMock = vi.fn();
      vi.stubGlobal("location", { ...window.location, reload: reloadMock });

      render(<JobResultStatus status="STARTED" />);
      fireEvent.click(screen.getByRole("button", { name: /refresh page/i }));

      expect(reloadMock).toHaveBeenCalledOnce();
      vi.unstubAllGlobals();
    });
  });

  describe("optional message prop", () => {
    it("renders message prop content within the FAILURE state", () => {
      render(
        <JobResultStatus
          status="FAILURE"
          message="Analysis failed due to insufficient data."
        />,
      );
      expect(
        screen.getByText("Analysis failed due to insufficient data."),
      ).toBeInTheDocument();
    });

    it("renders without crashing when message prop is omitted in FAILURE state", () => {
      expect(() => render(<JobResultStatus status="FAILURE" />)).not.toThrow();
    });
  });
});
