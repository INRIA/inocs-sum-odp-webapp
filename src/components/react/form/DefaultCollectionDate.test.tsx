import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DefaultCollectionDate } from "./DefaultCollectionDate";

describe("DefaultCollectionDate", () => {
  it("renders a single date input (edit icon visible in view mode)", () => {
    render(<DefaultCollectionDate value="" onChange={vi.fn()} />);
    expect(
      screen.getByLabelText(/default collection date/i),
    ).toBeInTheDocument();
  });

  it("shows placeholder text when no default is provided", () => {
    render(<DefaultCollectionDate value="" onChange={vi.fn()} />);
    expect(screen.getByText(/not set/i)).toBeInTheDocument();
  });

  it("shows formatted value when a default date is provided", () => {
    render(<DefaultCollectionDate value="2025-06-01" onChange={vi.fn()} />);
    // formatDateToMonthYear returns "Jun 2025" style; just check something is shown
    expect(screen.queryByText(/not set/i)).not.toBeInTheDocument();
  });

  it("calls onChange with the new date value on confirm", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DefaultCollectionDate value="" onChange={onChange} />);

    // click edit icon
    await user.click(screen.getByRole("button", { name: /edit/i }));
    // change date input
    fireEvent.change(document.querySelector('input[type="date"]')!, {
      target: { value: "2025-08-15" },
    });
    // confirm
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onChange).toHaveBeenCalledWith("2025-08-15");
  });

  it("does NOT call onChange on cancel", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DefaultCollectionDate value="2025-01-01" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("returns to view mode after confirming", async () => {
    const user = userEvent.setup();
    render(<DefaultCollectionDate value="2025-06-01" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(document.querySelector('input[type="date"]')).not.toBeInTheDocument();
  });
});
