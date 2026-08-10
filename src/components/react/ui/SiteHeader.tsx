import React, { useState, useEffect } from "react";
import * as Headless from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { BrandLogo } from "./BrandLogo";
import { RButton } from "./RButton";
import { getUrl } from "../../../lib/helpers";
import type { ExperienceState } from "../../../lib/experiences/registry";
import type { SessionLivingLabCookie } from "../../../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MenuItem {
  label?: string;
  href?: string;
  icon?: React.ReactNode;
  separator?: boolean;
  className?: string;
  subItems?: MenuItem[];
}

interface Props {
  menuItems?: MenuItem[];
  experience?: ExperienceState;
  children?: React.ReactNode;
  userInfo?: { name: string; email: string; avatar?: string };
  currentLivingLab?: SessionLivingLabCookie;
  currentPath?: string;
}

// ---------------------------------------------------------------------------
// Band theme — colours for text/controls on the experience band
// ---------------------------------------------------------------------------

interface BandTheme {
  bg: string;
  text: string;
  textMuted: string;
  chevron: string;
  divider: string;
  underline: string;
  hover: string;
  pillText: string;
  dotInactive: string;
  focusOutline: string;
  /** Inactive switch segment text */
  switchInactive: string;
  switchInactiveHoverText: string;
  switchInactiveHoverBg: string;
}

/** Data experience: white-on-blue (contrast 8.3 : 1). */
const DATA_THEME: BandTheme = {
  bg: "bg-primary",
  text: "text-white",
  textMuted: "text-white/70",
  chevron: "text-white/70",
  divider: "bg-white/30",
  underline: "bg-white",
  hover: "hover:bg-white/10",
  pillText: "text-primary",
  dotInactive: "bg-white/50",
  focusOutline: "focus-visible:outline-white",
  switchInactive: "text-white/70",
  switchInactiveHoverText: "hover:text-white",
  switchInactiveHoverBg: "hover:bg-white/10",
};

/** Insights experience: dark-on-green (primary blue on brand green). */
const INSIGHTS_THEME: BandTheme = {
  bg: "bg-secondary",
  text: "text-primary",
  textMuted: "text-primary/70",
  chevron: "text-primary/60",
  divider: "bg-primary/30",
  underline: "bg-primary",
  hover: "hover:bg-primary/10",
  pillText: "text-secondary-dark",
  dotInactive: "bg-primary/50",
  focusOutline: "focus-visible:outline-primary",
  switchInactive: "text-primary/70",
  switchInactiveHoverText: "hover:text-primary",
  switchInactiveHoverBg: "hover:bg-primary/10",
};

/** Landing / neutral: white band with dark text (no experience selected). */
const NEUTRAL_THEME: BandTheme = {
  bg: "bg-white border-b border-light",
  text: "text-primary",
  textMuted: "text-dark",
  chevron: "text-dark/60",
  divider: "bg-dark/30",
  underline: "bg-primary",
  hover: "hover:bg-light/50",
  pillText: "text-primary",
  dotInactive: "bg-dark/40",
  focusOutline: "focus-visible:outline-primary",
  switchInactive: "text-dark",
  switchInactiveHoverText: "hover:text-primary",
  switchInactiveHoverBg: "hover:bg-light/50",
};

function bandThemeFor(exp: string | null): BandTheme {
  if (exp === "insights") return INSIGHTS_THEME;
  if (exp === "data") return DATA_THEME;
  return NEUTRAL_THEME;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Utility links shown in the brand bar (row 1). */
const UTILITY_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "https://sum-project.eu/about", external: true },
  { label: "Resources", href: "/tools/resources" },
  { label: "FAQ", href: "/faq" },
];

// ---------------------------------------------------------------------------
// SVG icons (same as stacked-layout pattern — avoids heroicon import issues)
// ---------------------------------------------------------------------------

function MenuOpenIcon() {
  return (
    <svg
      className="size-6"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
    </svg>
  );
}

function MenuCloseIcon() {
  return (
    <svg
      className="size-6"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether a menu item (or any of its children) matches the current path. */
function isMenuItemActive(item: MenuItem, currentPath: string): boolean {
  if (item.href) {
    if (item.href === "/") return currentPath === "/";
    return (
      currentPath === item.href || currentPath.startsWith(item.href + "/")
    );
  }
  return (
    item.subItems?.some((sub) => {
      if (!sub.href) return false;
      if (sub.href === "/") return currentPath === "/";
      return (
        currentPath === sub.href || currentPath.startsWith(sub.href + "/")
      );
    }) ?? false
  );
}

// ---------------------------------------------------------------------------
// SiteHeader — public export
// ---------------------------------------------------------------------------

export function SiteHeader({
  menuItems = [],
  experience,
  children,
  userInfo,
  currentLivingLab,
  currentPath = "/",
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    handler(); // sync on mount
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const activeExp = experience?.active;
  const theme = bandThemeFor(activeExp);
  const descriptor = experience?.descriptor ?? "";

  // Band menu: filter out "Home" — the logo serves that purpose
  const bandMenuItems = menuItems.filter((item) => item.label !== "Home");

  // User-specific menu items (manage labs, logout)
  const userMenuItems: MenuItem[] = [];
  if (userInfo) {
    if (currentLivingLab?.authorizedLabs?.length) {
      currentLivingLab.authorizedLabs.forEach((lab) => {
        userMenuItems.push({
          label: `Manage ${lab.name}`,
          href: getUrl(`/lab-admin/set-lab?id=${lab.id}`),
        });
      });
    }
    userMenuItems.push({
      label: "Logout",
      href: getUrl("/lab-admin/logout"),
      separator: true,
    });
  }

  return (
    <div className="relative flex min-h-svh w-full flex-col bg-white">
      {/* ── Mobile sidebar ─────────────────────────────────────────── */}
      <Headless.Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden relative z-50"
      >
        <Headless.DialogBackdrop className="fixed inset-0 bg-black/30 motion-safe:transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200" />
        <Headless.DialogPanel className="fixed inset-y-0 left-0 w-full max-w-80 bg-white shadow-xl motion-safe:transition motion-safe:duration-300 data-closed:-translate-x-full">
          {/* sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-light">
            <BrandLogo />
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
              className="p-2 rounded-lg hover:bg-light/50"
            >
              <MenuCloseIcon />
            </button>
          </div>

          <nav className="overflow-y-auto px-4 py-4">
            {/* experience switch inside sidebar */}
            {experience && (
              <div className={`${theme.bg} rounded-lg p-3 mb-4`}>
                <SwitchControl
                  segments={experience.switchSegments}
                  theme={theme}
                  fullWidth
                />
              </div>
            )}

            {/* menu items */}
            <div className="space-y-1">
              {bandMenuItems.map((item, i) => (
                <MobileMenuItem
                  key={`${item.label}-${i}`}
                  item={item}
                  currentPath={currentPath}
                />
              ))}
            </div>

            {/* utility links */}
            <div className="mt-4 pt-4 border-t border-light space-y-1">
              {UTILITY_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.external ? link.href : getUrl(link.href)}
                  className="block px-3 py-2 text-sm text-dark rounded-lg hover:bg-light/50"
                  {...(link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* user menu */}
            {userInfo && userMenuItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-light space-y-1">
                <p className="px-3 py-1 text-xs font-semibold text-dark/60 uppercase">
                  {userInfo.name}
                </p>
                {userMenuItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block px-3 py-2 text-sm text-dark rounded-lg hover:bg-light/50"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}

            {/* login for anonymous users */}
            {!userInfo && (
              <div className="mt-4 pt-4 border-t border-light">
                <RButton
                  variant="primary"
                  text="Login"
                  href={getUrl("/lab-admin/login")}
                  className="w-full justify-center"
                />
              </div>
            )}
          </nav>
        </Headless.DialogPanel>
      </Headless.Dialog>

      {/* ── Row 1 — Brand bar ──────────────────────────────────────── */}
      <div
        className={[
          "bg-white border-b border-light motion-safe:transition-all motion-safe:duration-300 overflow-hidden",
          scrolled ? "max-h-0 border-b-0" : "max-h-24",
        ].join(" ")}
        aria-hidden={scrolled}
      >
        <div className="flex items-center justify-between px-4 py-2 max-w-screen-2xl mx-auto">
          <BrandLogo />

          <div className="hidden md:flex items-center gap-6">
            {UTILITY_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.external ? link.href : getUrl(link.href)}
                className="text-sm text-dark hover:text-primary motion-safe:transition-colors"
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            ))}

            {userInfo ? (
              <div className="relative">
                <Headless.Menu>
                  <Headless.MenuButton className="flex items-center gap-1 text-sm font-medium text-primary border border-secondary rounded-lg px-3 py-1.5 hover:bg-light/50 motion-safe:transition-colors">
                    Manage Labs
                    <ChevronDownIcon className="size-4" />
                  </Headless.MenuButton>
                  <Headless.MenuItems
                    anchor="bottom end"
                    className="z-50 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 py-1"
                  >
                    {userMenuItems.map((item) => (
                      <React.Fragment key={item.label}>
                        {item.separator && (
                          <div className="my-1 border-t border-light" />
                        )}
                        <Headless.MenuItem>
                          <a
                            href={item.href}
                            className="block px-4 py-2 text-sm text-dark data-focus:bg-light/50"
                          >
                            {item.label}
                          </a>
                        </Headless.MenuItem>
                      </React.Fragment>
                    ))}
                  </Headless.MenuItems>
                </Headless.Menu>
              </div>
            ) : (
              <RButton
                variant="primary"
                text="Login"
                href={getUrl("/lab-admin/login")}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2 — Experience band (sticky) ───────────────────────── */}
      {experience && (
        <div className={`sticky top-0 z-40 ${theme.bg} min-h-[62px]`}>
          <div className="flex items-center px-4 py-2 max-w-screen-2xl mx-auto gap-2">
            {/* experience switch */}
            <SwitchControl
              segments={experience.switchSegments}
              theme={theme}
            />

            {/* divider + descriptor (hidden on small screens) */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              <div
                className={`w-px h-8 ${theme.divider}`}
                role="separator"
                aria-hidden="true"
              />
              <span
                className={`text-sm ${theme.textMuted} italic whitespace-nowrap`}
              >
                {descriptor}
              </span>
            </div>

            {/* spacer */}
            <div className="flex-1 min-w-0" />

            {/* desktop nav */}
            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label="Experience navigation"
            >
              {bandMenuItems.map((item, i) => (
                <BandMenuItem
                  key={`${item.label}-${i}`}
                  item={item}
                  currentPath={currentPath}
                  theme={theme}
                />
              ))}
            </nav>

            {/* mobile hamburger (inside band so it stays visible on scroll) */}
            <button
              className={`lg:hidden p-2 ${theme.text} rounded-lg ${theme.hover} motion-safe:transition-colors`}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <MenuOpenIcon />
            </button>
          </div>
        </div>
      )}

      {/* ── Page content ───────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col pb-2 lg:px-2">
        <div className="grow lg:rounded-lg">
          <div className="mx-auto max-w-400">{children}</div>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SwitchControl — the experience toggle
// ---------------------------------------------------------------------------

function SwitchControl({
  segments,
  theme,
  fullWidth = false,
}: {
  segments: { label: string; href: string; active: boolean }[];
  theme: BandTheme;
  fullWidth?: boolean;
}) {
  if (!segments?.length) return null;

  return (
    <div
      className="flex items-center rounded-full bg-black/20 p-1 shrink-0"
      role="tablist"
      aria-label="Experience selector"
    >
      {segments.map((seg) => (
        <a
          key={seg.label}
          href={seg.href}
          role="tab"
          aria-selected={seg.active}
          aria-current={seg.active ? "page" : undefined}
          className={[
            "flex items-center justify-center gap-2 rounded-full text-sm font-bold leading-tight whitespace-nowrap",
            "px-5 py-2.5",
            "motion-safe:transition-all",
            `focus-visible:outline-2 focus-visible:outline-offset-2 ${theme.focusOutline}`,
            fullWidth ? "flex-1" : "",
            seg.active
              ? `bg-white ${theme.pillText} shadow-sm`
              : `${theme.switchInactive} ${theme.switchInactiveHoverText} ${theme.switchInactiveHoverBg}`,
          ].join(" ")}
        >
          <span
            className={[
              "size-2 rounded-full shrink-0",
              seg.active ? "bg-current" : theme.dotInactive,
            ].join(" ")}
            aria-hidden="true"
          />
          {seg.label}
        </a>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BandMenuItem — desktop menu item on the experience band
// ---------------------------------------------------------------------------

function BandMenuItem({
  item,
  currentPath,
  theme,
}: {
  item: MenuItem;
  currentPath: string;
  theme: BandTheme;
}) {
  const isActive = isMenuItemActive(item, currentPath);

  // Dropdown menu item
  if (item.subItems && item.subItems.length > 0) {
    return (
      <Headless.Menu>
        <Headless.MenuButton
          className={[
            `relative flex items-center gap-1 px-3 py-2 text-sm font-medium ${theme.text} rounded-lg`,
            `${theme.hover} motion-safe:transition-colors`,
            `focus-visible:outline-2 focus-visible:outline-offset-2 ${theme.focusOutline}`,
          ].join(" ")}
        >
          {item.label}
          <ChevronDownIcon className={`size-4 ${theme.chevron}`} />
          {isActive && (
            <span
              className={`absolute bottom-0 left-3 right-3 h-0.5 ${theme.underline} rounded-full`}
              aria-hidden="true"
            />
          )}
        </Headless.MenuButton>
        <Headless.MenuItems
          anchor="bottom start"
          className="z-50 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black/5 py-1"
        >
          {item.subItems.map((sub) => (
            <Headless.MenuItem key={sub.label}>
              <a
                href={sub.href ?? "#"}
                className="block px-4 py-2 text-sm text-dark data-focus:bg-light/50"
              >
                {sub.label}
              </a>
            </Headless.MenuItem>
          ))}
        </Headless.MenuItems>
      </Headless.Menu>
    );
  }

  // Simple link
  return (
    <a
      href={item.href ?? "#"}
      className={[
        `relative px-3 py-2 text-sm font-medium ${theme.text} rounded-lg`,
        `${theme.hover} motion-safe:transition-colors`,
        `focus-visible:outline-2 focus-visible:outline-offset-2 ${theme.focusOutline}`,
      ].join(" ")}
      aria-current={isActive ? "page" : undefined}
    >
      {item.label}
      {isActive && (
        <span
          className={`absolute bottom-0 left-3 right-3 h-0.5 ${theme.underline} rounded-full`}
          aria-hidden="true"
        />
      )}
    </a>
  );
}

// ---------------------------------------------------------------------------
// MobileMenuItem — sidebar menu item for narrow viewports
// ---------------------------------------------------------------------------

function MobileMenuItem({
  item,
  currentPath,
}: {
  item: MenuItem;
  currentPath: string;
}) {
  const isActive = isMenuItemActive(item, currentPath);
  const [expanded, setExpanded] = useState(isActive);

  if (item.subItems && item.subItems.length > 0) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={[
            "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg",
            "hover:bg-light/50",
            isActive ? "text-primary font-bold" : "text-dark",
          ].join(" ")}
          aria-expanded={expanded}
        >
          {item.label}
          <ChevronDownIcon
            className={[
              "size-4 motion-safe:transition-transform",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
        {expanded && (
          <div className="ml-4 space-y-1">
            {item.subItems.map((sub) => {
              const subActive =
                sub.href &&
                (currentPath === sub.href ||
                  currentPath.startsWith(sub.href + "/"));
              return (
                <a
                  key={sub.label}
                  href={sub.href ?? "#"}
                  className={[
                    "block px-3 py-2 text-sm rounded-lg hover:bg-light/50",
                    subActive ? "text-primary font-semibold" : "text-dark",
                  ].join(" ")}
                >
                  {sub.label}
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.href ?? "#"}
      className={[
        "block px-3 py-2 text-sm font-medium rounded-lg hover:bg-light/50",
        isActive ? "text-primary font-bold" : "text-dark",
      ].join(" ")}
      aria-current={isActive ? "page" : undefined}
    >
      {item.label}
    </a>
  );
}
