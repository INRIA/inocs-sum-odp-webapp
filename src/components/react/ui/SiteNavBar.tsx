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
  NavbarDivider,
  DropdownDivider,
} from "../../react-catalyst-ui-kit";
import {
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  Cog8ToothIcon,
} from "@heroicons/react/16/solid";
import { getUrl } from "../../../lib/helpers";
import type { SessionLivingLabCookie } from "../../../types";
import { RButton } from "./RButton";

interface Props {
  menuItems?: MenuItem[];
  children?: React.ReactNode;
  userInfo?: { name: string; email: string; avatar?: string };
  currentLivingLab?: SessionLivingLabCookie;
}
interface MenuItem {
  label?: string;
  href?: string;
  icon?: React.ReactNode;
  separator?: Boolean;
  className?: string;
  subItems?: MenuItem[];
}
export function SiteNavBar({
  menuItems,
  children,
  userInfo,
  currentLivingLab,
}: Props) {
  let navbarItems: MenuItem[] = menuItems ?? [];
  if (userInfo) {
    const userMenu: MenuItem = {
      label: userInfo?.name,
      icon: <UserCircleIcon />,
      subItems: [
        {
          label: "Logout",
          icon: <ArrowRightStartOnRectangleIcon />,
          href: getUrl("/lab-admin/logout"),
          separator: true,
        },
      ],
      className: "max-md:hidden",
    };
    if (currentLivingLab?.authorizedLabs?.length) {
      // If there are authorized labs, add them to the navbar
      userMenu.subItems?.push(
        ...currentLivingLab.authorizedLabs.map((lab) => ({
          label: `Manage ${lab.name}`,
          icon: <Cog8ToothIcon />,
          href: getUrl(`/lab-admin/set-lab?id=${lab.id}`),
        }))
      );
    }
    navbarItems = [...navbarItems, userMenu];
  }
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
          <NavbarSection className="max-lg:hidden flex justify-end">
            {navbarItems.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.subItems?.length !== undefined && (
                  <Dropdown>
                    <DropdownButton
                      as={NavbarItem}
                      aria-label={`${item.label} menu`}
                    >
                      <NavbarLabel className="text-primary">
                        {item.label}
                      </NavbarLabel>
                      {item.icon ? item.icon : <ChevronDownIcon />}
                    </DropdownButton>
                    <DropdownMenu anchor="bottom start">
                      {item?.subItems?.length > 0 &&
                        item.subItems?.map((sub) => (
                          <React.Fragment key={sub.label}>
                            <DropdownItem href={sub.href}>
                              {sub.icon}
                              <DropdownLabel>{sub.label}</DropdownLabel>
                            </DropdownItem>
                            {sub?.separator && (
                              <DropdownDivider key={`${sub.label}-divider`} />
                            )}
                          </React.Fragment>
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
                {item.separator && <NavbarDivider />}
              </React.Fragment>
            ))}
          </NavbarSection>
          {!userInfo && (
            <RButton
              variant="primary"
              text="Login"
              href={getUrl("/lab-admin/login")}
            />
          )}
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarBody>
            <SidebarSection>
              {navbarItems.map((item) => (
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
