import {
  Avatar,
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
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
  ArrowRightStartOnRectangleIcon
} from "@heroicons/react/16/solid";
import {
  Cog6ToothIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  BookOpenIcon,
  ChartPieIcon,
  ChartBarSquareIcon,
  QueueListIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/20/solid";
import { UserIcon } from "@heroicons/react/24/solid";
import { getUrl } from "../../../lib/helpers";

interface Props {
  children?: React.ReactNode;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
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

const DEFAULT_DROPDOWN_HEADER = {
  label: "My Living Lab",
  icon: <Cog6ToothIcon />,
};
const DEFAULT_DROPDOWN_HEADER_ITEMS = [
  {
    label: "Edit",
    icon: <Cog8ToothIcon />,
    href: getUrl("/lab-admin/edit"),
  },
];

const HELP_MENU_ITEMS = [
  {
    label: "Useful Resources",
    icon: <BookOpenIcon />,
    href: getUrl("#"),
  },
  {
    label: "FAQ",
    icon: <QuestionMarkCircleIcon />,
    href: getUrl("#"),
  },
  {
    label: "Contact SUM team",
    icon: <EnvelopeIcon />,
    href: getUrl("#"),
  },
];

const DEFAULT_USER_MENU_ITEMS = [
  {
    label: "Logout",
    icon: <ArrowRightStartOnRectangleIcon />,
    href: getUrl("/lab-admin/logout"),
  },
];

export function SidebarMenu({ children, userInfo }: Props) {
  const sidebarContent = (
    <Sidebar>
      <SidebarHeader>
        <img
          src={getUrl("/sum_logo.jpg")}
          alt="SUM Logo"
          className="w-40 my-4"
        />
        {DEFAULT_DROPDOWN_HEADER && (
          <Dropdown>
            <DropdownButton as={SidebarItem} className="mb-2.5">
              {DEFAULT_DROPDOWN_HEADER.icon ? (
                DEFAULT_DROPDOWN_HEADER.icon
              ) : (
                <Avatar src="/sum_logo.svg" />
              )}
              <SidebarLabel>{DEFAULT_DROPDOWN_HEADER.label}</SidebarLabel>
              <ChevronDownIcon />
            </DropdownButton>
            {DEFAULT_DROPDOWN_HEADER_ITEMS?.length &&
              DEFAULT_DROPDOWN_HEADER_ITEMS?.length > 0 && (
                <DropdownMenu className="min-w-64" anchor="bottom start">
                  {DEFAULT_DROPDOWN_HEADER_ITEMS.map((item) => (
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
        {HELP_MENU_ITEMS?.length && HELP_MENU_ITEMS?.length > 0 && (
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
      navbar={sidebarContent}
      sidebar={sidebarContent}
      sidebarOnly={true}
    >
      {children}
    </StackedLayout>
  );
}
