// Experience Registry — single source of truth for route ownership,
// counterpart mapping, and menu definitions.
//
// Downstream components read from this module; nothing is hardcoded elsewhere.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExperienceId = "data" | "insights";

export interface MenuItem {
  label?: string;
  href?: string;
  icon?: unknown;
  separator?: boolean;
  className?: string;
  subItems?: MenuItem[];
}

interface RouteEntry {
  /** Exact path or pattern with :param placeholders, e.g. "/living-lab-city/:labId" */
  pattern: string;
  experience: ExperienceId | "shared" | "landing";
  /** Pattern in the other experience (named params are preserved from the current URL) */
  counterpart?: string;
}

interface ExperienceMenu {
  id: ExperienceId;
  label: string;
  /** Default route used when switching to this experience without a counterpart match */
  home: string;
  items: MenuItem[];
}

export interface ExperienceState {
  /** null on the landing page — no experience is highlighted in the switch */
  active: ExperienceId | null;
  /** Nav items for the active experience (or Data by default for shared routes) */
  menu: MenuItem[];
  switchSegments: { label: string; href: string; active: boolean }[];
  isShared: boolean;
  /** ?view= value present in the URL, if any */
  viewParam: ExperienceId | null;
}

// ---------------------------------------------------------------------------
// Route ownership table
// ---------------------------------------------------------------------------

const ROUTES: RouteEntry[] = [
  // Landing — neither experience
  { pattern: "/", experience: "landing" },

  // Data experience
  { pattern: "/methods", experience: "data" }, // prefix match covers all /methods/* routes
  { pattern: "/data/kpis", experience: "data" },
  { pattern: "/data/modal-split", experience: "data" },
  { pattern: "/data/measures", experience: "data" },
  { pattern: "/data/collection-plan", experience: "data" },
  { pattern: "/tools/impact_analysis", experience: "data" },
  { pattern: "/tools/mcda_analysis", experience: "data" }, // prefix match
  {
    pattern: "/living-lab-city/:labId",
    experience: "data",
    counterpart: "/insights/city/:labId",
  },

  // Insights experience
  {
    pattern: "/insights/city/:labId",
    experience: "insights",
    counterpart: "/living-lab-city/:labId",
  },
  { pattern: "/insights", experience: "insights" },

  // Shared surfaces — keep visitor's current menu
  { pattern: "/tools/resources", experience: "shared" }, // prefix match
  { pattern: "/faq", experience: "shared" },
  { pattern: "/legal-notice", experience: "shared" },
  { pattern: "/privacy-policy", experience: "shared" },
  { pattern: "/join", experience: "shared" },
];

// ---------------------------------------------------------------------------
// Menu definitions
// ---------------------------------------------------------------------------

// Living Labs subItems are injected at runtime by Layout.astro.
// The placeholder empty array is replaced by resolveExperience().
const DATA_MENU: ExperienceMenu = {
  id: "data",
  label: "Data & scientific tools",
  home: "/data/kpis",
  items: [
    { label: "Home", href: "/" },
    { label: "Living Labs", subItems: [] }, // populated from API at runtime
    {
      label: "Data",
      subItems: [
        { href: "/data/measures", label: "Policy measures" },
        { href: "/data/kpis", label: "KPIs" },
        { href: "/data/modal-split", label: "Modal split" },
        { href: "/data/collection-plan", label: "Data collection process" },
      ],
    },
    {
      label: "Tools",
      subItems: [
        { href: "/tools/impact_analysis", label: "Impact analysis" },
        { href: "/tools/mcda_analysis/", label: "Multi-criteria decision tool" },
      ],
    },
    { href: "/tools/resources", label: "Resources" },
    {
      label: "Methods & quality",
      subItems: [
        { href: "/methods/evaluation-framework", label: "Evaluation framework" },
        { href: "/methods/data-collection", label: "Data collection" },
        { href: "/methods/data-quality", label: "Data quality" },
        { href: "/methods/models", label: "How the models work" },
        { href: "/methods/limitations", label: "Limitations" },
        { href: "/methods/glossary", label: "Glossary" },
        { href: "/faq", label: "FAQ" },
      ],
    },
  ],
};

const INSIGHTS_MENU: ExperienceMenu = {
  id: "insights",
  label: "Insights",
  home: "/insights",
  items: [
    { label: "Home", href: "/" },
    { href: "/insights/goals", label: "What works" }, // Epic 8
    { href: "/insights/cities", label: "Cities" }, // Epic 9
    { href: "/insights/plan", label: "Plan for my city" }, // Epic 10
    { href: "/join", label: "Join & resources" }, // T18
  ],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a route pattern ("/living-lab-city/:labId") into a regex that also
 * captures each named param.
 */
function patternToRegex(pattern: string): {
  regex: RegExp;
  paramNames: string[];
} {
  const paramNames: string[] = [];
  // Escape special regex chars except ":" which introduces a param
  const regexSource = pattern
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        paramNames.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  // Exact match (anchored start & end)
  return { regex: new RegExp(`^${regexSource}$`), paramNames };
}

/**
 * Try to match a pathname against a RouteEntry. Returns the param map if matched,
 * or null if no match. Also performs a prefix match for known prefix-match routes
 * (tools/mcda_analysis, tools/resources).
 */
function matchRoute(
  pathname: string,
  entry: RouteEntry,
): Record<string, string> | null {
  const { regex, paramNames } = patternToRegex(entry.pattern);

  // Exact match
  const m = pathname.match(regex);
  if (m) {
    const params: Record<string, string> = {};
    paramNames.forEach((name, i) => {
      params[name] = m[i + 1];
    });
    return params;
  }

  // Prefix match — only for patterns without params that end up being prefixes
  if (paramNames.length === 0 && pathname.startsWith(entry.pattern + "/")) {
    return {};
  }

  return null;
}

/**
 * Given a counterpart pattern ("/insights/city/:labId") and the params extracted
 * from the current URL, produce the resolved counterpart URL
 * ("/insights/city/5").
 */
function buildCounterpartUrl(
  pattern: string,
  params: Record<string, string>,
): string {
  return pattern.replace(/:([a-zA-Z]+)/g, (_, name) => params[name] ?? name);
}

/**
 * Append ?view=<experience> to a URL string.
 */
export function appendViewParam(href: string, experience: ExperienceId): string {
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}view=${experience}`;
}

// ---------------------------------------------------------------------------
// Resolution algorithm
// ---------------------------------------------------------------------------

/**
 * Resolve which experience is active for the given URL.
 *
 * @param pathname     Astro.url.pathname (may include BASE_URL prefix)
 * @param searchParams Astro.url.searchParams
 * @param labsItems    Dynamic Living Labs menu items from the API
 */
export function resolveExperience(
  pathname: string,
  searchParams: URLSearchParams,
  labsItems?: MenuItem[],
): ExperienceState {
  // 1. Strip BASE_URL prefix if present
  const base =
    (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) ||
    (typeof process !== "undefined" && process.env?.BASE_URL) ||
    "";
  const strippedBase = base === "/" ? "" : base;
  const cleanPath = strippedBase
    ? pathname.replace(new RegExp(`^${escapeRegex(strippedBase)}`), "") ||
      "/"
    : pathname;

  // 2. Find matching route (longest-pattern-first for determinism)
  const sortedRoutes = [...ROUTES].sort(
    (a, b) => b.pattern.length - a.pattern.length,
  );

  let matchedEntry: RouteEntry | null = null;
  let matchedParams: Record<string, string> = {};
  for (const entry of sortedRoutes) {
    const params = matchRoute(cleanPath, entry);
    if (params !== null) {
      matchedEntry = entry;
      matchedParams = params;
      break;
    }
  }

  const rawExperience = matchedEntry?.experience ?? "landing";

  // 3. Read ?view= param
  const viewRaw = searchParams.get("view");
  const viewParam: ExperienceId | null =
    viewRaw === "data" || viewRaw === "insights" ? viewRaw : null;

  // 4. Determine active experience
  let active: ExperienceId | null;
  let isShared = false;

  if (rawExperience === "landing") {
    active = null;
  } else if (rawExperience === "shared") {
    isShared = true;
    active = viewParam ?? "data";
  } else {
    active = rawExperience as ExperienceId;
  }

  // 5. Build switch segment hrefs
  const dataHome = DATA_MENU.home;
  const insightsHome = INSIGHTS_MENU.home;

  let dataHref = dataHome;
  let insightsHref = insightsHome;

  if (isShared) {
    // On shared surfaces, preserve the current path and toggle ?view=
    dataHref = appendViewParam(cleanPath, "data");
    insightsHref = appendViewParam(cleanPath, "insights");
  } else if (matchedEntry?.counterpart) {
    const resolved = buildCounterpartUrl(matchedEntry.counterpart, matchedParams);
    if (active === "data") {
      insightsHref = resolved;
    } else if (active === "insights") {
      dataHref = resolved;
    }
  }

  const switchSegments = [
    {
      label: "Data & tools",
      href: dataHref,
      active: active === "data",
    },
    {
      label: "Insights",
      href: insightsHref,
      active: active === "insights",
    },
  ];

  // 6. Build menu: inject Living Labs into Data menu
  let menu: MenuItem[];
  if (active === "insights") {
    menu = INSIGHTS_MENU.items;
  } else {
    // Data experience (or null landing — show Data menu as default)
    menu = DATA_MENU.items.map((item) => {
      if (item.label === "Living Labs") {
        return { ...item, subItems: labsItems ?? [] };
      }
      return item;
    });
  }

  return { active, menu, switchSegments, isShared, viewParam };
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
