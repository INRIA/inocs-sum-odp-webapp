import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarMenu } from "./SidebarMenu";

// Mock the BrandLogo and catalyst kit components to avoid complex dependencies
vi.mock("./BrandLogo", () => ({
  BrandLogo: () => <div data-testid="brand-logo" />,
}));

vi.mock("../../../lib/helpers", () => ({
  getUrl: (path: string) => path,
}));

// Minimal stubs for the Catalyst UI kit sidebar primitives
vi.mock("../../react-catalyst-ui-kit", () => {
  const Item = ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  const Section = ({ children }: any) => <div>{children}</div>;
  const Label = ({ children, className }: any) => (
    <span className={className}>{children}</span>
  );
  const Divider = () => <hr />;
  const identity = ({ children }: any) => <div>{children}</div>;
  return {
    Sidebar: identity,
    SidebarBody: identity,
    SidebarDivider: Divider,
    SidebarFooter: identity,
    SidebarHeader: identity,
    SidebarItem: Item,
    SidebarLabel: Label,
    SidebarSection: Section,
    StackedLayout: ({ children, sidebar, navbar }: any) => (
      <div>
        {navbar}
        {sidebar}
        {children}
      </div>
    ),
    Navbar: identity,
    NavbarDivider: Divider,
    NavbarItem: identity,
    NavbarLabel: identity,
    NavbarSection: identity,
    NavbarSpacer: () => <span />,
    Dropdown: identity,
    DropdownButton: identity,
    DropdownDivider: Divider,
    DropdownItem: identity,
    DropdownLabel: identity,
    DropdownMenu: identity,
  };
});

describe("SidebarMenu – admin actions section", () => {
  const baseProps = {
    userInfo: { name: "Admin User", email: "admin@example.com" },
  };

  it("renders the Admin actions section and external link when isAdmin is true", () => {
    render(
      <SidebarMenu
        {...baseProps}
        isAdmin={true}
        odpAdminHost="http://admin.example.com"
      />,
    );

    expect(screen.getByText("Admin actions")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Go to Administrator space/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "http://admin.example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render the Admin actions section when isAdmin is false", () => {
    render(
      <SidebarMenu
        {...baseProps}
        isAdmin={false}
        odpAdminHost="http://admin.example.com"
      />,
    );

    expect(screen.queryByText("Admin actions")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /go to lab editor space/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render the Admin actions section when odpAdminHost is empty", () => {
    render(<SidebarMenu {...baseProps} isAdmin={true} odpAdminHost="" />);

    expect(screen.queryByText("Admin actions")).not.toBeInTheDocument();
  });

  it("does not render the Admin actions section when isAdmin is omitted", () => {
    render(
      <SidebarMenu {...baseProps} odpAdminHost="http://admin.example.com" />,
    );

    expect(screen.queryByText("Admin actions")).not.toBeInTheDocument();
  });
});
