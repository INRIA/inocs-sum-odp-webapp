import React, { useRef, useState, useEffect } from "react";
import {
  Navbar,
  NavbarItem,
  NavbarLabel,
  NavbarSection,
  NavbarSpacer,
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
  StackedLayout,
  Sidebar,
  SidebarBody,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarDivider,
} from "../../react-catalyst-ui-kit";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { getUrl } from "../../../lib/helpers";

type MenuItem = { href?: string; label: string; subItems?: MenuItem[] };
const HOME_URL = getUrl("/");
interface Props {
  livingLabs: MenuItem[];
  children?: React.ReactNode;
}
export function SiteNavBar({ livingLabs, children }: Props) {
  const items = [
    {
      label: "Home",
      href: HOME_URL,
    },
    {
      label: "Living Labs",
      subItems: livingLabs,
    },
    {
      label: "Data",
      subItems: [
        { href: "#", label: "KPIs" },
        { href: "#", label: "Measures" },
        { href: "#", label: "Modal split" },
      ],
    },
    {
      label: "Analysis Tools",
      subItems: [
        { href: "#", label: "Measures impact" },
        { href: "#", label: "Multi‑criteria decision tool" },
      ],
    },
  ];

  const analysisTools: MenuItem[] = [
    { href: "#", label: "Measures impact" },
    { href: "#", label: "Multi‑criteria decision tool" },
  ];

  // state to track which submenu is open
  const [openMenu, setOpenMenu] = useState<
    null | "living" | "data" | "analysis"
  >(null);

  // refs for outside click detection
  const livingRef = useRef<HTMLDivElement | null>(null);
  const dataRef = useRef<HTMLDivElement | null>(null);
  const analysisRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        (livingRef.current && livingRef.current.contains(target)) ||
        (dataRef.current && dataRef.current.contains(target)) ||
        (analysisRef.current && analysisRef.current.contains(target))
      ) {
        // click inside one of the menus -> do nothing
        return;
      }
      // click outside -> close all
      setOpenMenu(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <StackedLayout
      navbar={
        <Navbar className="flex flex-row w-full min-w-0 flex-1">
          <img
            src={getUrl("/sum_logo.jpg")}
            alt="SUM Logo"
            className="w-40 mx-4"
          />

          <NavbarSpacer />

          {/* desktop navbar items (hidden on smaller screens) */}
          <NavbarSection className="px-10 max-lg:hidden w-full flex justify-end">
            {items.map((item) => (
              <React.Fragment key={item.label}>
                {item.subItems?.length !== undefined && (
                  <Dropdown>
                    <DropdownButton
                      as={NavbarItem}
                      aria-label={`${item.label} menu`}
                    >
                      <NavbarLabel className="text-primary">
                        {item.label}
                      </NavbarLabel>
                      <ChevronDownIcon />
                    </DropdownButton>
                    <DropdownMenu
                      className="min-w-64 bg-white"
                      anchor="bottom start"
                    >
                      {item?.subItems?.length > 0 &&
                        item.subItems?.map((sub) => (
                          <DropdownItem key={sub.label} href={sub.href}>
                            <DropdownLabel>{sub.label}</DropdownLabel>
                          </DropdownItem>
                        ))}
                    </DropdownMenu>
                  </Dropdown>
                )}
                {item.href && (
                  <NavbarItem href={item.href}>
                    <NavbarLabel className="text-primary">
                      {item.label}
                    </NavbarLabel>
                  </NavbarItem>
                )}
              </React.Fragment>
            ))}
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarBody>
            <SidebarSection>
              {items.map((item) => (
                <React.Fragment key={item.label}>
                  {item.subItems ? (
                    <>
                      <SidebarItem>
                        <SidebarLabel className="font-bold">
                          {item.label}
                        </SidebarLabel>
                      </SidebarItem>
                      {item.subItems.map((sub) => (
                        <SidebarItem
                          key={sub.label}
                          href={sub.href}
                          className="pl-4"
                        >
                          {sub.label}
                        </SidebarItem>
                      ))}
                    </>
                  ) : (
                    <SidebarItem href={item.href}>{item.label}</SidebarItem>
                  )}
                  <SidebarDivider />
                </React.Fragment>
              ))}
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      {children}
    </StackedLayout>
  );
}
