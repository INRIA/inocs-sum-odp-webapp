// T011 — TriggerDownloadCsv component tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Hoist the mock function so it is available in both the mock factory and test bodies
const mockDownloadCsvBlob = vi.hoisted(() => vi.fn());

// Mock ApiClient module
vi.mock("../../../lib/api-client/ApiClient", () => ({
  // Must use regular 'function' (not arrow) so it works as a constructor via `new ApiClient()`
  default: vi.fn(function () { return { downloadCsvBlob: mockDownloadCsvBlob }; }),
  ApiDownloadError: class ApiDownloadError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "ApiDownloadError";
      this.status = status;
    }
  },
}));

// Also mock URL.createObjectURL and revokeObjectURL for jsdom
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "blob:mock-url"),
});
Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
});

import { TriggerDownloadCsv, buildFilename } from "./TriggerDownloadCsv";

describe("TriggerDownloadCsv", () => {
  beforeEach(() => {
    mockDownloadCsvBlob.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── Idle state labels ────────────────────────────────────────────────────

  it("renders 'All KPIs CSV' label for kpi-results-all type", () => {
    render(<TriggerDownloadCsv type="kpi-results-all" />);
    expect(screen.getByRole("button", { name: /all kpis csv/i })).toBeTruthy();
  });

  it("renders label for kpi-results-lab type", () => {
    render(
      <TriggerDownloadCsv type="kpi-results-lab" living_lab_id={3} />,
    );
    // Label is defined in LABEL_MAP; just assert the button exists
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("renders 'KPIs CSV' label for kpi-results-definition type", () => {
    render(<TriggerDownloadCsv type="kpi-results-definition" />);
    expect(screen.getByRole("button", { name: /kpis csv/i })).toBeTruthy();
  });

  it("renders 'Group of KPIs CSV' label for kpi-results-category type", () => {
    render(<TriggerDownloadCsv type="kpi-results-category" />);
    expect(
      screen.getByRole("button", { name: /group of kpis csv/i }),
    ).toBeTruthy();
  });

  // ─── Path construction + download trigger ─────────────────────────────────

  it("calls downloadCsvBlob with /csv/kpiresults for kpi-results-all", async () => {
    const user = userEvent.setup();
    mockDownloadCsvBlob.mockResolvedValueOnce(new Blob(["data"]));
    render(<TriggerDownloadCsv type="kpi-results-all" />);

    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(mockDownloadCsvBlob).toHaveBeenCalledOnce());
    expect(mockDownloadCsvBlob).toHaveBeenCalledWith(expect.stringContaining("/csv/kpiresults"));
  });

  it("includes living_lab_id query param for kpi-results-lab", async () => {
    const user = userEvent.setup();
    mockDownloadCsvBlob.mockResolvedValueOnce(new Blob(["data"]));
    render(<TriggerDownloadCsv type="kpi-results-lab" living_lab_id={5} />);

    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(mockDownloadCsvBlob).toHaveBeenCalledOnce());
    expect(mockDownloadCsvBlob).toHaveBeenCalledWith(
      expect.stringContaining("living_lab_id=5"),
    );
  });

  it("includes category_id query param for kpi-results-category", async () => {
    const user = userEvent.setup();
    mockDownloadCsvBlob.mockResolvedValueOnce(new Blob(["data"]));
    render(
      <TriggerDownloadCsv type="kpi-results-category" category_id={7} />,
    );

    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(mockDownloadCsvBlob).toHaveBeenCalledOnce());
    expect(mockDownloadCsvBlob).toHaveBeenCalledWith(
      expect.stringContaining("category_id=7"),
    );
  });

  it("includes kpidefinition_id query param for kpi-results-definition", async () => {
    const user = userEvent.setup();
    mockDownloadCsvBlob.mockResolvedValueOnce(new Blob(["data"]));
    render(
      <TriggerDownloadCsv type="kpi-results-definition" kpidefinition_id={12} />,
    );

    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(mockDownloadCsvBlob).toHaveBeenCalledOnce());
    expect(mockDownloadCsvBlob).toHaveBeenCalledWith(
      expect.stringContaining("kpidefinition_id=12"),
    );
  });

  // ─── Disabled state ────────────────────────────────────────────────────────

  it("button is disabled for kpi-results-lab when living_lab_id is not provided", () => {
    render(<TriggerDownloadCsv type="kpi-results-lab" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveProperty("disabled", true);
  });

  it("button is NOT disabled for kpi-results-lab when living_lab_id is provided", () => {
    render(<TriggerDownloadCsv type="kpi-results-lab" living_lab_id={3} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveProperty("disabled", false);
  });

  it("button is not disabled for kpi-results-lab when only kpidefinition_id is absent (optional)", () => {
    render(<TriggerDownloadCsv type="kpi-results-lab" living_lab_id={3} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveProperty("disabled", false);
  });

  it("button is disabled when disabled prop is true", () => {
    render(<TriggerDownloadCsv type="kpi-results-all" disabled />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveProperty("disabled", true);
  });

  // ─── Size mapping ──────────────────────────────────────────────────────────

  it("renders xs padding class when size is sm", () => {
    const { container } = render(
      <TriggerDownloadCsv type="kpi-results-all" size="sm" />,
    );
    expect(container.innerHTML).toContain("px-2");
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it("shows 'Downloading…' text while download is in progress", async () => {
    const user = userEvent.setup();
    let resolveBlob!: (b: Blob) => void;
    const blobPromise = new Promise<Blob>((res) => {
      resolveBlob = res;
    });
    mockDownloadCsvBlob.mockReturnValueOnce(blobPromise);
    render(<TriggerDownloadCsv type="kpi-results-all" />);

    await user.click(screen.getByRole("button"));

    expect(screen.queryByText(/downloading/i)).toBeTruthy();

    // Resolve and clean up
    resolveBlob(new Blob(["data"]));
    await waitFor(() => expect(screen.queryByText(/downloading/i)).toBeFalsy());
  });

  // ─── Error state ──────────────────────────────────────────────────────────

  it("shows error message when download fails", async () => {
    const { ApiDownloadError } = await import("../../../lib/api-client/ApiClient");
    const user = userEvent.setup();
    mockDownloadCsvBlob.mockRejectedValueOnce(
      new ApiDownloadError("ApiDownloadError: status=404", 404),
    );
    render(<TriggerDownloadCsv type="kpi-results-all" />);

    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.queryByText(/404/i)).toBeTruthy());
  });

  // ─── Projects download types (T024) ──────────────────────────────────────

  it("renders 'All Measures CSV' label for projects-all type", () => {
    render(<TriggerDownloadCsv type="projects-all" />);
    expect(screen.getByRole("button", { name: /all measures csv/i })).toBeTruthy();
  });

  it("renders 'Lab Measures CSV' label for projects-lab type", () => {
    render(<TriggerDownloadCsv type="projects-lab" living_lab_id={2} />);
    expect(screen.getByRole("button", { name: /lab measures csv/i })).toBeTruthy();
  });

  it("calls downloadCsvBlob with /csv/projects for projects-all", async () => {
    const user = userEvent.setup();
    mockDownloadCsvBlob.mockResolvedValueOnce(new Blob(["data"]));
    render(<TriggerDownloadCsv type="projects-all" />);

    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(mockDownloadCsvBlob).toHaveBeenCalledOnce());
    expect(mockDownloadCsvBlob).toHaveBeenCalledWith(
      expect.stringContaining("/csv/projects"),
    );
  });

  it("includes living_lab_id query param for projects-lab", async () => {
    const user = userEvent.setup();
    mockDownloadCsvBlob.mockResolvedValueOnce(new Blob(["data"]));
    render(<TriggerDownloadCsv type="projects-lab" living_lab_id={7} />);

    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(mockDownloadCsvBlob).toHaveBeenCalledOnce());
    expect(mockDownloadCsvBlob).toHaveBeenCalledWith(
      expect.stringContaining("living_lab_id=7"),
    );
  });

  it("button is disabled for projects-lab when living_lab_id is not provided", () => {
    render(<TriggerDownloadCsv type="projects-lab" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveProperty("disabled", true);
  });

  it("button is NOT disabled for projects-all even without living_lab_id", () => {
    render(<TriggerDownloadCsv type="projects-all" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveProperty("disabled", false);
  });

  // ─── Filename pattern (unit tests on exported buildFilename) ─────────────

  it("filename includes kpi id, lab id, category id and date for kpi-results", () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    expect(buildFilename({ type: "kpi-results-definition", kpidefinition_id: 3, living_lab_id: 5, category_id: 2 }))
      .toBe(`kpi-results_kpi3_lab5_category2_${dd}-${mm}-${yyyy}.csv`);
  });

  it("filename omits missing filter segments for kpi-results-all", () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    expect(buildFilename({ type: "kpi-results-all" }))
      .toBe(`kpi-results_${dd}-${mm}-${yyyy}.csv`);
  });

  it("projects filename includes lab id when provided", () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    expect(buildFilename({ type: "projects-lab", living_lab_id: 7 }))
      .toBe(`projects_lab7_${dd}-${mm}-${yyyy}.csv`);
  });

  it("projects-all filename has no lab segment when living_lab_id is absent", () => {
    expect(buildFilename({ type: "projects-all" }))
      .toMatch(/^projects_\d{2}-\d{2}-\d{4}\.csv$/);
  });
});
