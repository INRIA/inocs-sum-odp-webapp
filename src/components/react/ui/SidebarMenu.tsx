import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  Navbar,
  NavbarDivider,
  NavbarItem,
  NavbarLabel,
  NavbarSection,
  NavbarSpacer,
  Sidebar,
  SidebarBody,
  SidebarDivider,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  StackedLayout,
} from "../../react-catalyst-ui-kit";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  ArrowRightStartOnRectangleIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/16/solid";
import {
  GlobeEuropeAfricaIcon,
  HomeIcon,
  MapPinIcon,
  ChartPieIcon,
  ChartBarSquareIcon,
  QueueListIcon,
  PresentationChartLineIcon,
  UserCircleIcon,
  EyeIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/20/solid";
import { getUrl } from "../../../lib/helpers";
import React from "react";
import type { SessionLivingLabCookie } from "../../../types";
import { BrandLogo } from "./BrandLogo";

interface Props {
  children?: React.ReactNode;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
  currentLivingLab?: SessionLivingLabCookie;
  /** When true, displays the "Admin actions" section at the top of the sidebar. */
  isAdmin?: boolean;
  /** URL of the external administration platform (ODP_ADMIN_HOST_PUBLIC). */
  odpAdminHost?: string;
}

interface MenuItem {
  label?: string;
  href?: string;
  icon?: React.ReactNode;
  separator?: Boolean;
  className?: string;
  subItems?: MenuItem[];
  dropdown?: Boolean;
  navbar?: Boolean;
}

const HOME_ITEM = {
  label: "Go back to ODP ⬅️",
  icon: <HomeIcon />,
  href: getUrl("/"),
};

const DEFAULT_MENU_ITEMS = [
  {
    label: "Data Overview",
    icon: <PresentationChartLineIcon />,
    href: getUrl("/lab-admin"),
  },
  {
    label: "Modal Split",
    icon: <ChartPieIcon />,
    href: getUrl("/lab-admin/modal-split"),
  },
  {
    label: "KPIs",
    icon: <ChartBarSquareIcon />,
    href: getUrl("/lab-admin/kpis"),
  },
  {
    label: "Measures",
    icon: <QueueListIcon />,
    href: getUrl("/lab-admin/measures"),
  },
];

const HELP_MENU_ITEMS = [
  // {
  //   label: "Useful Resources",
  //   icon: <BookOpenIcon />,
  //   href: getUrl("#"),
  // },
  {
    label: "FAQ",
    icon: <QuestionMarkCircleIcon />,
    href: getUrl("/faq"),
  },
  {
    label: "Contact\nodp@sum-project.eu",
    icon: <EnvelopeIcon />,
    href: "mailto:odp@sum-project.eu",
  },
];

const DEFAULT_USER_MENU_ITEMS = [
  {
    label: "Logout",
    icon: <ArrowRightStartOnRectangleIcon />,
    href: getUrl("/lab-admin/logout"),
  },
];

export function SidebarMenu({ children, userInfo, currentLivingLab, isAdmin, odpAdminHost }: Props) {
  const navbarItems: MenuItem[] = [
    {
      label: userInfo ? HOME_ITEM.label : "Home",
      icon: <HomeIcon />,
      href: getUrl("/"),
      className: "max-md:hidden",
      separator: true,
      dropdown: false,
      navbar: true,
    },
  ];

  if (currentLivingLab) {
    if (
      currentLivingLab?.authorizedLabs &&
      currentLivingLab?.authorizedLabs?.length > 1
    ) {
      navbarItems.push({
        label: "My Labs",
        icon: <GlobeEuropeAfricaIcon />,
        subItems: currentLivingLab?.authorizedLabs?.map((item) => ({
          label: item.name,
          href: getUrl("/lab-admin/set-lab?id=" + item.id),
        })),
        dropdown: true,
        navbar: false,
      });
    }
    navbarItems.push(
      ...[
        {
          label: "Edit Lab information",
          icon: <Cog8ToothIcon />,
          href: getUrl("/lab-admin/lab/edit"),
        },
        {
          label: "View lab dashboard",
          icon: <EyeIcon />,
          href: getUrl("/living-lab-city/" + currentLivingLab?.id),      separator: true,

        },
      ]);

    navbarItems.push({
      label: `Manage ${currentLivingLab?.name ?? "my Living Lab"} data`,
      icon: <DocumentChartBarIcon />,
      subItems: [...DEFAULT_MENU_ITEMS],
      separator: true,
      className: "bg-warning/50 rounded-lg",
      dropdown: false,
    });
  }

  navbarItems.push({
    icon: <QuestionMarkCircleIcon />,
    subItems: HELP_MENU_ITEMS,
    className: "max-md:hidden",
  });

  if (userInfo)
    navbarItems.push({
      label: "My account",
      icon: <UserCircleIcon />,
      subItems: [
        {
          label: `${userInfo.name}\n${userInfo.email}`,
          separator: true,
        },
        ...DEFAULT_USER_MENU_ITEMS,
      ],
      className: "max-md:hidden",
      dropdown: true,
      navbar: true,
    });

  const sidebarHeader = navbarItems[0];
  const sidebarBodyItems = navbarItems.slice(1, navbarItems.length - 1);
  const sidebarFooter = navbarItems[navbarItems.length - 1];

  const getDropdownSection = (
    item: MenuItem,
    anchor: "bottom start" | "top start" = "bottom start",
  ) => {
    return (
      <Dropdown>
        <DropdownButton as={SidebarItem}>
          {item.icon}
          <SidebarLabel>{item.label}</SidebarLabel>
          {anchor.startsWith("bottom") ? (
            <ChevronDownIcon />
          ) : (
            <ChevronUpIcon />
          )}
        </DropdownButton>
        {item.subItems?.length && item.subItems?.length > 0 && (
          <DropdownMenu className="min-w-64" anchor={anchor}>
            {item.subItems.map((subItem) => (
              <>
                <DropdownItem key={subItem.label} href={subItem.href}>
                  {subItem.icon}
                  <DropdownLabel className="whitespace-pre-line">
                    {subItem.label}
                  </DropdownLabel>
                </DropdownItem>
                {subItem?.separator && <DropdownDivider />}
              </>
            ))}
          </DropdownMenu>
        )}
      </Dropdown>
    );
  };

  const getSidebarItem = (item: MenuItem) => {
    return (
      <SidebarItem key={item.label} href={item.href}>
        {item.icon}
        <SidebarLabel>{item.label}</SidebarLabel>
      </SidebarItem>
    );
  };

  const sidebarContent = (
    <Sidebar>
      <SidebarHeader>
        {sidebarHeader?.dropdown
          ? getDropdownSection(sidebarHeader)
          : getSidebarItem(sidebarHeader)}
      </SidebarHeader>
      <SidebarBody>
        {isAdmin && odpAdminHost && (
          <>
            <SidebarSection>
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Admin actions
              </p>
              <SidebarItem
                href={odpAdminHost}
                // @ts-expect-error – SidebarItem forwards extra anchor attributes at runtime
                target="_blank"
                rel="noopener noreferrer"
              >
                <ArrowTopRightOnSquareIcon />
                <SidebarLabel>Go to Administrator space</SidebarLabel>
              </SidebarItem>
              <SidebarItem href={getUrl("/lab-admin/analytics")}>
                <PresentationChartLineIcon />
                <SidebarLabel>Living Lab Analytics</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
            <SidebarDivider />
          </>
        )}
        <SidebarSection>
          {sidebarBodyItems?.length &&
            sidebarBodyItems?.length > 0 &&
            sidebarBodyItems.map((item) => (
              <>
                {item.dropdown ? (
                  getDropdownSection(item)
                ) : item.subItems?.length !== undefined ? (
                  item.subItems.map((sub) => (
                    <>
                      <SidebarItem key={sub.label} href={sub.href}>
                        {sub.icon}
                        <SidebarLabel className="whitespace-pre-line">
                          {sub.label}
                        </SidebarLabel>
                      </SidebarItem>
                      {sub.separator && <SidebarDivider />}
                    </>
                  ))
                ) : (
                  <SidebarItem key={item.label} href={item.href}>
                    {item.icon}
                    <SidebarLabel>{item.label}</SidebarLabel>
                  </SidebarItem>
                )}
                {item.separator && <SidebarDivider />}
              </>
            ))}
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter>
        {sidebarFooter?.dropdown
          ? getDropdownSection(sidebarFooter, "top start")
          : getSidebarItem(sidebarFooter)}
      </SidebarFooter>
    </Sidebar>
  );

  const navBarContent = (
    <Navbar className="flex flex-row gap-x-0">
      <BrandLogo className="mx-4" />

      <NavbarSpacer />

      {navbarItems.map(
        (item) =>
          item.navbar === true && (
            <NavbarSection className={item.className ?? ""} key={item.label}>
              {item.subItems?.length !== undefined && getDropdownSection(item)}
              {item?.href && (
                <NavbarItem href={item.href}>
                  <NavbarLabel className="text-primary">
                    {item.label}
                  </NavbarLabel>
                </NavbarItem>
              )}
              {item.separator && <NavbarDivider />}
            </NavbarSection>
          ),
      )}
    </Navbar>
  );

  return (
    <StackedLayout
      navbar={navBarContent}
      sidebar={sidebarContent}
      sidebarAndNavbarInLargeScreens={true}
    >
      {children}
    </StackedLayout>
  );
}
