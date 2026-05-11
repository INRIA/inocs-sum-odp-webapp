import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RButton } from "./RButton";

describe("RButton", () => {
  it("applies disabled visual classes for disabled button", () => {
    render(
      <RButton type="button" text="Save" variant="primary" disabled />,
    );

    const button = screen.getByRole("button", { name: /save/i });

    expect(button).toBeDisabled();
    expect(button).toHaveClass("cursor-not-allowed");
    expect(button).toHaveClass("opacity-60");
    expect(button).toHaveClass("pointer-events-none");
  });

  it("applies disabled semantics and visuals for disabled link mode", () => {
    render(<RButton href="/lab-admin" text="Go" disabled />);

    const link = screen.getByRole("link", { name: /go/i });

    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
    expect(link).toHaveClass("cursor-not-allowed");
    expect(link).toHaveClass("opacity-60");
    expect(link).toHaveClass("pointer-events-none");
  });
});
