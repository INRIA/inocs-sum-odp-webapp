import {
  Avatar,
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
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
  StackedLayout,
} from "../../react-catalyst-ui-kit";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  ArrowRightStartOnRectangleIcon,
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
} from "@heroicons/react/20/solid";
import { UserIcon } from "@heroicons/react/24/solid";
import { getUrl } from "../../../lib/helpers";
import React from "react";
import type { SessionLivingLabCookie } from "../../../types";

interface Props {
  children?: React.ReactNode;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
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

const HOME_ITEM = {
  label: "Go to ODP website",
  icon: <HomeIcon />,
  href: getUrl("/"),
};

const DEFAULT_MENU_ITEMS = [
  {
    label: "Data Overview",
    icon: <PresentationChartLineIcon />,
    href: getUrl("/lab-admin"),
    separator: true,
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
  // {
  //   label: "FAQ",
  //   icon: <QuestionMarkCircleIcon />,
  //   href: getUrl("#"),
  // },
  // {
  //   label: "Contact SUM team",
  //   icon: <EnvelopeIcon />,
  //   href: getUrl("#"),
  // },
];

const DEFAULT_USER_MENU_ITEMS = [
  {
    label: "Logout",
    icon: <ArrowRightStartOnRectangleIcon />,
    href: getUrl("/lab-admin/logout"),
  },
];

export function SidebarMenu({ children, userInfo, currentLivingLab }: Props) {
  const labItem = {
    label: currentLivingLab?.name ?? "My Living Lab",
    icon: <MapPinIcon />,
  };
  const labMenu: MenuItem[] = [
    {
      label: "Edit",
      icon: <Cog8ToothIcon />,
      href: getUrl("/lab-admin/edit"),
    },
    {
      label: "View public dashboard",
      icon: <EyeIcon />,
      href: getUrl("/living-lab-city/" + currentLivingLab?.id),
      separator: true,
    },
  ];

  const navbarItems: MenuItem[] = [
    {
      label: "Home",
      icon: <HomeIcon />,
      href: getUrl("/"),
      className: "max-md:hidden",
      separator: true,
    },
    // {
    //   icon: <QuestionMarkCircleIcon />,
    //   subItems: HELP_MENU_ITEMS,
    //   className: "max-md:hidden",
    //   separator: true,
    // },
  ];
  if (currentLivingLab) {
    if (
      currentLivingLab?.authorizedLabs?.length &&
      currentLivingLab?.authorizedLabs?.length > 1
    ) {
      navbarItems.push({
        label: "Labs",
        icon: <GlobeEuropeAfricaIcon />,
        subItems: currentLivingLab?.authorizedLabs?.map((item) => ({
          label: item.name,
          href: getUrl("/lab-admin/set-lab?id=" + item.id),
        })),
      });
    }
    navbarItems.push({
      ...labItem,
      subItems: [...labMenu, ...DEFAULT_MENU_ITEMS],
      separator: true,
      className: "bg-warning/50 rounded-lg",
    });
  }

  if (userInfo)
    navbarItems.push({
      label: userInfo?.name,
      icon: <UserCircleIcon />,
      subItems: DEFAULT_USER_MENU_ITEMS,
      className: "max-md:hidden",
    });

  const sidebarContent = (
    <Sidebar>
      <SidebarHeader>
        <img
          src={getUrl("/sum_logo.jpg")}
          alt="SUM Logo"
          className="w-40 my-4"
        />
        {labItem && (
          <Dropdown>
            <DropdownButton as={SidebarItem} className="mb-2.5">
              {labItem.icon ? labItem.icon : <Avatar src="/sum_logo.svg" />}
              <SidebarLabel>{labItem.label}</SidebarLabel>
              <ChevronDownIcon />
            </DropdownButton>
            {labMenu?.length && labMenu?.length > 0 && (
              <DropdownMenu className="min-w-64" anchor="bottom start">
                {labMenu.map((item) => (
                  <DropdownItem key={item.label} href={item.href}>
                    {item.icon}
                    <DropdownLabel>{item.label}</DropdownLabel>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            )}
          </Dropdown>
        )}
        <SidebarItem key={HOME_ITEM.label} href={HOME_ITEM.href}>
          {HOME_ITEM.icon}
          <SidebarLabel>{HOME_ITEM.label}</SidebarLabel>
        </SidebarItem>
      </SidebarHeader>
      <SidebarBody>
        {DEFAULT_MENU_ITEMS?.length && DEFAULT_MENU_ITEMS?.length > 0 && (
          <SidebarSection>
            {DEFAULT_MENU_ITEMS.map((item) => (
              <SidebarItem key={item.label} href={item.href}>
                {item.icon}
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            ))}
          </SidebarSection>
        )}
        <SidebarSpacer />
      </SidebarBody>

      <SidebarFooter>
        {HELP_MENU_ITEMS?.length > 0 && (
          <SidebarSection>
            {HELP_MENU_ITEMS.map((item) => (
              <SidebarItem key={item.label} href={item.href}>
                {item.icon}
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            ))}
          </SidebarSection>
        )}
        <SidebarSpacer />

        {userInfo && (
          <Dropdown>
            <DropdownButton as={SidebarItem}>
              <span className="flex min-w-0 items-center gap-3">
                {userInfo.avatar ? (
                  <Avatar
                    src={userInfo.avatar}
                    className="size-8"
                    square
                    alt=""
                  />
                ) : (
                  <UserIcon className="size-8" />
                )}
                <span className="max-w-32 flex flex-col">
                  <span className="text-sm/5 font-medium text-zinc-950 dark:text-white">
                    {userInfo.name}
                  </span>
                  <small className="text-dark">{userInfo.email}</small>
                </span>
              </span>
              <ChevronUpIcon />
            </DropdownButton>
            {DEFAULT_USER_MENU_ITEMS?.length &&
              DEFAULT_USER_MENU_ITEMS?.length > 0 && (
                <DropdownMenu className="min-w-64" anchor="top start">
                  {DEFAULT_USER_MENU_ITEMS.map((item) => (
                    <DropdownItem key={item.label} href={item.href}>
                      {item.icon}
                      <DropdownLabel>{item.label}</DropdownLabel>
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              )}
          </Dropdown>
        )}
      </SidebarFooter>
    </Sidebar>
  );

  return (
    <StackedLayout
      navbar={
        <Navbar className="flex flex-row gap-x-0">
          <img
            src={getUrl("/sum_logo.jpg")}
            alt="SUM Logo"
            className="w-40 mx-4 max-sm:w-20"
          />

          <NavbarSpacer />

          {navbarItems.map((item) => (
            <NavbarSection className={item.className ?? ""} key={item.label}>
              {item.subItems?.length !== undefined && (
                <Dropdown>
                  <DropdownButton
                    as={NavbarItem}
                    aria-label={`${item.label} menu`}
                  >
                    {item.label && (
                      <NavbarLabel className="text-primary">
                        {item.label}
                      </NavbarLabel>
                    )}
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
                          {sub?.separator && <DropdownDivider />}
                        </React.Fragment>
                      ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {item?.href && (
                <NavbarItem href={item.href}>
                  <NavbarLabel className="text-primary">
                    {item.label}
                  </NavbarLabel>
                </NavbarItem>
              )}
              {item.separator && <NavbarDivider />}
            </NavbarSection>
          ))}
        </Navbar>
      }
      sidebar={sidebarContent}
      sidebarOnly={false}
    >
      {children}
    </StackedLayout>
  );
}
