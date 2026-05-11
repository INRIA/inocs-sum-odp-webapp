import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LivingLabMeasureForm } from "./LivingLabMeasureForm";

const { updateLivingLabMeasureMock, deleteLivingLabMeasureMock } = vi.hoisted(() => ({
  updateLivingLabMeasureMock: vi.fn(),
  deleteLivingLabMeasureMock: vi.fn(),
}));

vi.mock("../../../lib/api-client/ApiClient", () => {
  return {
    default: vi.fn(function () {
      return {
        updateLivingLabMeasure: updateLivingLabMeasureMock,
        deleteLivingLabMeasure: deleteLivingLabMeasureMock,
      };
    }),
  };
});

const measure = {
  id: 1,
  name: "Measure A",
  description: "Project description",
  type: "PUSH",
};

describe("LivingLabMeasureForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("existing unchanged measure keeps Validate disabled", async () => {
    const user = userEvent.setup();
    render(
      <LivingLabMeasureForm
        livingLabId={42}
        measure={measure}
        isEditable
        value={{
          living_lab_id: 42,
          project_id: 1,
          description: "Initial summary",
          start_at: "2025-01-10",
        }}
      />,
    );

    await user.click(screen.getByText("Measure A"));
    const validateButton = screen.getByRole("button", { name: /validate/i });

    expect(validateButton).toBeDisabled();
  });

  it("changed measure enables Validate and saves", async () => {
    const user = userEvent.setup();
    updateLivingLabMeasureMock.mockResolvedValue({ id: 10 });

    render(
      <LivingLabMeasureForm
        livingLabId={42}
        measure={measure}
        isEditable
        value={{
          living_lab_id: 42,
          project_id: 1,
          description: "Initial summary",
          start_at: "2025-01-10",
        }}
      />,
    );

    await user.click(screen.getByText("Measure A"));

    const summaryInput = screen.getByLabelText(/provide a summary/i);
    await user.type(summaryInput, " updated");

    const validateButton = screen.getByRole("button", { name: /validate/i });
    expect(validateButton).not.toBeDisabled();

    await user.click(validateButton);

    await waitFor(() => {
      expect(updateLivingLabMeasureMock).toHaveBeenCalledWith(
        expect.objectContaining({
          living_lab_id: 42,
          project_id: 1,
          description: "Initial summary updated",
          start_at: "2025-01-10",
        }),
      );
    });
  });

  it("after saving new measure, reopening without changes keeps Validate disabled", async () => {
    const user = userEvent.setup();
    updateLivingLabMeasureMock.mockResolvedValue({ id: 10 });

    render(
      <LivingLabMeasureForm
        livingLabId={42}
        measure={measure}
        isEditable
      />,
    );

    await user.click(screen.getByText("Measure A"));
    const firstValidateButton = screen.getByRole("button", {
      name: /validate/i,
    });

    expect(firstValidateButton).not.toBeDisabled();
    await user.click(firstValidateButton);

    await waitFor(() => {
      expect(updateLivingLabMeasureMock).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByText("Measure A"));
    const secondValidateButton = screen.getByRole("button", {
      name: /validate/i,
    });

    expect(secondValidateButton).toBeDisabled();
    await user.click(secondValidateButton);
    expect(updateLivingLabMeasureMock).toHaveBeenCalledTimes(1);
  });

  it("reverting changes disables Validate again", async () => {
    const user = userEvent.setup();
    render(
      <LivingLabMeasureForm
        livingLabId={42}
        measure={measure}
        isEditable
        value={{
          living_lab_id: 42,
          project_id: 1,
          description: "Initial summary",
          start_at: "2025-01-10",
        }}
      />,
    );

    await user.click(screen.getByText("Measure A"));

    const summaryInput = screen.getByLabelText(/provide a summary/i);
    const validateButton = screen.getByRole("button", { name: /validate/i });

    await user.clear(summaryInput);
    await user.type(summaryInput, "Modified summary");
    expect(validateButton).not.toBeDisabled();

    await user.clear(summaryInput);
    await user.type(summaryInput, "Initial summary");
    expect(validateButton).toBeDisabled();
  });

  it("removing unsaved measure does not call backend delete", async () => {
    const user = userEvent.setup();
    render(
      <LivingLabMeasureForm
        livingLabId={42}
        measure={measure}
        isEditable
      />,
    );

    await user.click(screen.getByText("Measure A"));
    await user.click(screen.getByRole("button", { name: /remove/i }));

    expect(deleteLivingLabMeasureMock).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(/estimated start date/i)).not.toBeInTheDocument();
  });
});
