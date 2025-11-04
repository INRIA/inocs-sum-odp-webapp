import React, { useState } from "react";

export type Tab = {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
};

type TabAlign = "left" | "center" | "right";

type Props = {
  tabs: Tab[];
  defaultTabId?: string | null; // null = start with no active tab
  onChange?: (id: string) => void;
  align?: TabAlign; // new prop
};

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const ALIGN_CLASSES: Record<TabAlign, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export function Tabs({
  tabs = [],
  defaultTabId,
  onChange,
  align = "left",
}: Props) {
  // defaultTabId === null  -> no tab active initially (closed)
  // defaultTabId === undefined -> keep previous behavior: default to 0
  const defaultIndex =
    defaultTabId === null
      ? -1
      : defaultTabId
      ? Math.max(0, tabs.findIndex((t) => t.id === defaultTabId))
      : 0;

  const maxIndex = Math.max(-1, tabs.length - 1);
  const [activeIndex, setActiveIndex] = useState<number>(
    Math.min(Math.max(defaultIndex, -1), maxIndex)
  );

  const activeTab = activeIndex >= 0 ? tabs[activeIndex] : undefined;

  function selectByIndex(i: number) {
    if (i < 0 || i >= tabs.length) return;
    setActiveIndex(i);
    onChange?.(tabs[i].id);
  }

  return (
    <div>
      {/* Desktop: tab list */}
      <div className="border-b border-gray-200">
        <nav
          aria-label="Tabs"
          className={classNames(
            "-mb-px flex space-x-2",
            ALIGN_CLASSES[align] || ALIGN_CLASSES.left
          )}
        >
          {tabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => selectByIndex(i)}
              aria-current={i === activeIndex ? "page" : undefined}
              className={classNames(
                i === activeIndex
                  ? "border-warning text-warning"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                "group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium bg-transparent"
              )}
              type="button"
            >
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content area: render active tab content */}
      <div className="mt-4">{activeTab ? activeTab.content : <div />}</div>
    </div>
  );
}
