interface ExperienceSwitchProps {
  segments: { label: string; href: string; active: boolean }[];
}

/**
 * Segmented control that lets users switch between experiences (Data / Insights).
 * Renders as a pair of pill-shaped anchor tags — no client-side state needed;
 * each click triggers a full-page navigation.
 */
export function ExperienceSwitch({ segments }: ExperienceSwitchProps) {
  if (!segments || segments.length === 0) return null;

  return (
    <div className="flex items-center rounded-full border border-primary overflow-hidden shrink-0 mx-2">
      {segments.map((seg) => (
        <a
          key={seg.label}
          href={seg.href}
          className={[
            "px-3 py-1 text-xs font-medium leading-tight transition-colors whitespace-nowrap",
            seg.active
              ? "bg-primary text-white"
              : "text-primary hover:bg-primary/10",
          ].join(" ")}
          aria-current={seg.active ? "page" : undefined}
        >
          {seg.label}
        </a>
      ))}
    </div>
  );
}
