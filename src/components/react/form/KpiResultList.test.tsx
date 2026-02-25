import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KpiResultList } from "./KpiResultList";
import type { IKpi, IKpiResult } from "../../../types/KPIs";
import { EnumKpiMetricType, EnumKpiType } from "../../../types/KPIs";

const { upsertMock, deleteMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("../../../lib/api-client/ApiClient", () => {
  return {
    default: vi.fn(function () {
      return {
        upsertLivingLabKpiResults: upsertMock,
        deleteKpiResult: deleteMock,
      };
    }),
  };
});

const mockKpi: IKpi = {
  id: 1,
  kpi_number: "1",
  name: "Test KPI",
  type: EnumKpiType.GLOBAL,
  progression_target: 1,
  metric: EnumKpiMetricType.ABSOLUTE,
};

const mockResult1: IKpiResult = {
  id: 10,
  kpidefinition_id: 1,
  living_lab_id: 42,
  value: 100,
  date: "2024-01-15",
};

const mockResult2: IKpiResult = {
  id: 11,
  kpidefinition_id: 1,
  living_lab_id: 42,
  value: 200,
  date: "2024-06-15",
};

describe("KpiResultList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Displayed information
  it("renders empty state when initialResults is empty", () => {
    render(
      <KpiResultList kpi={mockKpi} livingLabId={42} initialResults={[]} />,
    );
    expect(screen.getByText(/no entries/i)).toBeInTheDocument();
  });

  it("renders N rows when initialResults has N entries", () => {
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[mockResult1, mockResult2]}
      />,
    );
    // Each row shows the value
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("renders entries in chronological order", () => {
    const reversed = [mockResult2, mockResult1];
    render(
      <KpiResultList kpi={mockKpi} livingLabId={42} initialResults={reversed} />,
    );
    const cells = screen.getAllByTestId("kpi-result-value");
    expect(cells[0].textContent).toBe("100");
    expect(cells[1].textContent).toBe("200");
  });

  it("'+' button is visible initially", () => {
    render(
      <KpiResultList kpi={mockKpi} livingLabId={42} initialResults={[]} />,
    );
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  // User interactions
  it("clicking '+' opens new entry row; '+' button hidden", async () => {
    const user = userEvent.setup();
    render(
      <KpiResultList kpi={mockKpi} livingLabId={42} initialResults={[]} />,
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    expect(screen.queryByRole("button", { name: /add/i })).not.toBeInTheDocument();
    expect(document.querySelector('input[name="value"]')).toBeInTheDocument();
  });

  it("cancelling new entry closes row; list unchanged", async () => {
    const user = userEvent.setup();
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[mockResult1]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("kpi-result-value")).toHaveLength(1);
  });

  // Happy path
  it("saving new entry calls API with correct args", async () => {
    const user = userEvent.setup();
    upsertMock.mockResolvedValue({ id: 99, value: 55, date: "2025-01-10", kpidefinition_id: 1, living_lab_id: 42 });
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[]}
        defaultDate="2025-01-10"
      />,
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    const valueInput = document.querySelector('input[name="value"]') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "55" } });
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 55,
          kpidefinition_id: 1,
          living_lab_id: 42,
        }),
      );
    });
  });

  it("saved entry appears in list", async () => {
    const user = userEvent.setup();
    upsertMock.mockResolvedValue({ id: 99, value: 55, date: "2025-01-10", kpidefinition_id: 1, living_lab_id: 42 });
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[]}
        defaultDate="2025-01-10"
      />,
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    const valueInput = document.querySelector('input[name="value"]') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "55" } });
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText("55")).toBeInTheDocument();
    });
  });

  it("editing existing entry and saving updates displayed value", async () => {
    const user = userEvent.setup();
    upsertMock.mockResolvedValue({ ...mockResult1, value: 999 });
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[mockResult1]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /edit/i }));
    const valueInput = document.querySelector('input[name="value"]') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "999" } });
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText("999")).toBeInTheDocument();
    });
  });

  it("editing existing entry and cancelling restores original", async () => {
    const user = userEvent.setup();
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[mockResult1]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /edit/i }));
    const valueInput = document.querySelector('input[name="value"]') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "999" } });
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("deleting with confirmation removes entry from list", async () => {
    const user = userEvent.setup();
    deleteMock.mockResolvedValue(undefined);
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[mockResult1, mockResult2]}
      />,
    );
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    await waitFor(() => {
      expect(screen.queryByText("100")).not.toBeInTheDocument();
    });
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("deleting then cancelling leaves list unchanged", async () => {
    const user = userEvent.setup();
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[mockResult1]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("inline error shown for empty date on save", async () => {
    const user = userEvent.setup();
    render(
      <KpiResultList kpi={mockKpi} livingLabId={42} initialResults={[]} />,
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    // clear the date field
    const dateInput = document.querySelector('input[name="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "" } });
    const valueInput = document.querySelector('input[name="value"]') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "50" } });
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(upsertMock).not.toHaveBeenCalled();
    expect(screen.getByText(/date/i)).toBeInTheDocument();
  });

  it("inline error shown for out-of-range percentage", async () => {
    const user = userEvent.setup();
    const percentageKpi: IKpi = {
      ...mockKpi,
      metric: EnumKpiMetricType.PERCENTAGE,
      min_value: 0,
      max_value: 1,
    };
    render(
      <KpiResultList
        kpi={percentageKpi}
        livingLabId={42}
        initialResults={[]}
        defaultDate="2025-01-10"
      />,
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    const valueInput = document.querySelector('input[name="value"]') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("changing defaultDate pre-fills new entry row", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[]}
        defaultDate="2025-06-01"
      />,
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    const dateInput = document.querySelector('input[name="date"]') as HTMLInputElement;
    expect(dateInput.value).toBe("2025-06-01");

    rerender(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[]}
        defaultDate="2026-01-01"
      />,
    );
    expect((document.querySelector('input[name="date"]') as HTMLInputElement).value).toBe("2026-01-01");
  });

  it("changing defaultDate does NOT change saved entries", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[mockResult1]}
        defaultDate="2025-06-01"
      />,
    );
    expect(screen.getByText("100")).toBeInTheDocument();
    rerender(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[mockResult1]}
        defaultDate="2099-12-31"
      />,
    );
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("API save failure shows error; entry stays in edit mode", async () => {
    const user = userEvent.setup();
    upsertMock.mockRejectedValue(new Error("Server error"));
    render(
      <KpiResultList
        kpi={mockKpi}
        livingLabId={42}
        initialResults={[]}
        defaultDate="2025-01-10"
      />,
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    const valueInput = document.querySelector('input[name="value"]') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "55" } });
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
    // New entry row should still be open
    expect(document.querySelector('input[name="value"]')).toBeInTheDocument();
  });
});
