import React, { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { CityCard } from "./CityCard";
import {
  CITY_FILTERS,
  filterCityCards,
  type CityCardData,
  type CityFilterId,
} from "../../../lib/utils/cityCards";

export interface CitiesGridProps {
  cities: CityCardData[];
}

/**
 * Filterable list of city cards.
 *
 * Desktop: a 1/2/3-column grid. Phones: a horizontal snap carousel so a single
 * card fills the viewport and is read one at a time.
 */
export function CitiesGrid({ cities }: CitiesGridProps) {
  const [filter, setFilter] = useState<CityFilterId>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const visibleCities = useMemo(
    () => filterCityCards(cities, filter),
    [cities, filter],
  );

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      const clamped = Math.max(0, Math.min(index, visibleCities.length - 1));
      setActiveIndex(clamped);
      const target = scroller?.children[clamped] as HTMLElement | undefined;
      if (scroller && target && typeof scroller.scrollTo === "function") {
        scroller.scrollTo({
          left: target.offsetLeft - scroller.offsetLeft,
          behavior,
        });
      }
    },
    [visibleCities.length],
  );

  const handleFilterChange = (next: CityFilterId) => {
    setFilter(next);
    setActiveIndex(0);
    const scroller = scrollerRef.current;
    if (scroller && typeof scroller.scrollTo === "function") {
      scroller.scrollTo({ left: 0, behavior: "auto" });
    }
  };

  // Keeps the mobile position indicator in sync with a manual swipe.
  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const children = Array.from(scroller.children) as HTMLElement[];
    if (children.length === 0) return;
    const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearest = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;
    children.forEach((child, index) => {
      const childCenter =
        child.offsetLeft - scroller.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(childCenter - viewportCenter);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearest = index;
      }
    });
    setActiveIndex(nearest);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="mr-auto text-sm text-gray-400">
          {visibleCities.length}{" "}
          {visibleCities.length === 1 ? "city" : "cities"} · alphabetical,
          cities without published results last
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter cities"
        >
          {CITY_FILTERS.map((option) => {
            const isActive = option.id === filter;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleFilterChange(option.id)}
                aria-pressed={isActive}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-light bg-white text-dark hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {visibleCities.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center text-gray-400">
          No cities match this filter.
        </div>
      ) : (
        <>
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            data-testid="cities-scroller"
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3"
          >
            {visibleCities.map((city) => (
              <div
                key={city.id}
                className="w-[86vw] shrink-0 snap-center sm:w-auto sm:shrink"
              >
                <CityCard city={city} />
              </div>
            ))}
          </div>

          {/* Phone-only pager — one card at a time */}
          {visibleCities.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-4 sm:hidden">
              <button
                type="button"
                onClick={() => scrollToIndex(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label="Previous city"
                className="rounded-full border border-light p-1.5 text-dark disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div
                className="text-sm text-gray-500 tabular-nums"
                aria-live="polite"
              >
                {activeIndex + 1} / {visibleCities.length}
              </div>
              <button
                type="button"
                onClick={() => scrollToIndex(activeIndex + 1)}
                disabled={activeIndex === visibleCities.length - 1}
                aria-label="Next city"
                className="rounded-full border border-light p-1.5 text-dark disabled:opacity-40"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
