import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Badge, RButton, Tooltip } from "../ui";
import type { CityCardData, CityKpiMovement } from "../../../lib/utils/cityCards";

export interface CityCardProps {
  city: CityCardData;
  /** Adds a visible ring — used when the matching map marker is hovered/selected. */
  highlighted?: boolean;
  className?: string;
}

const numberFormatter = new Intl.NumberFormat("en-GB");

function ContextItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <b className="text-sm font-bold text-gray-900">{value}</b>
    </div>
  );
}

function MeasuresBar({ push, pull }: { push: number; pull: number }) {
  const known = push + pull;
  const pushWidth = known === 0 ? 0 : (push / known) * 100;
  const pullWidth = known === 0 ? 0 : (pull / known) * 100;

  return (
    <>
      <div
        className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-gray-100"
        role="img"
        aria-label={`${push} push and ${pull} pull measures`}
      >
        <span
          className="block h-full bg-warning"
          style={{ width: `${pushWidth}%` }}
        />
        <span
          className="block h-full bg-primary"
          style={{ width: `${pullWidth}%` }}
        />
      </div>
      <div className="mt-2 flex gap-4 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-xs bg-warning" />
          Push
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-xs bg-primary" />
          Pull
        </span>
      </div>
    </>
  );
}

function KpiGroup({
  direction,
  movements,
}: {
  direction: "improved" | "regressed";
  movements: CityKpiMovement[];
}) {
  if (movements.length === 0) return null;
  const isImproved = direction === "improved";
  const tone = isImproved ? "text-secondary-dark" : "text-danger";

  return (
    <div className="mb-3 last:mb-0">
      <div
        className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest ${tone}`}
      >
        <span aria-hidden="true">{isImproved ? "▲" : "▼"}</span>
        {isImproved ? "Improved" : "Declined"}
      </div>
      <ul className="m-0 list-none p-0">
        {movements.map((movement) => (
          <li
            key={movement.kpiId}
            className="flex items-baseline gap-2 py-0.5 text-xs"
          >
            <span className="truncate text-gray-600" title={movement.name}>
              {movement.name}
            </span>
            <span
              className={`ml-auto shrink-0 font-bold tabular-nums ${tone}`}
            >
              {movement.display}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PendingResults({ isContributingCity }: { isContributingCity: boolean }) {
  return (
    <div className="flex flex-1 flex-col justify-center border-b border-gray-200 bg-gray-50/70 px-4 py-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold text-gray-600">
        <InformationCircleIcon className="h-4 w-4 shrink-0 text-gray-400" />
        Results not published yet
      </div>
      <div className="text-xs leading-relaxed text-gray-400">
        {isContributingCity
          ? "This city has recorded the measures it is implementing. Indicator values will follow."
          : "Measures are recorded. Indicator values will appear here once this city reports its follow-up figures."}
      </div>
    </div>
  );
}

/**
 * Card template shared by every city on /insights/cities.
 *
 * Five fixed slots in the same order on every card — identity, context,
 * measures, movement, link — so cards stay visually comparable. Nothing is
 * scaled across cards: the measures bar shows a within-city proportion only.
 */
export function CityCard({
  city,
  highlighted = false,
  className = "",
}: CityCardProps) {
  const hasResults = city.improved.length > 0 || city.regressed.length > 0;

  const measuresTooltip = (
    <div className="text-left">
      {city.measures.pushNames.length > 0 && (
        <div className="mb-1">
          <span className="font-bold uppercase">Push:</span>
          <ul className="m-0 list-disc pl-4">
            {city.measures.pushNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
      {city.measures.pullNames.length > 0 && (
        <div className="mb-1">
          <span className="font-bold uppercase">Pull:</span>
          <ul className="m-0 list-disc pl-4">
            {city.measures.pullNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
      {city.measures.otherNames.length > 0 && (
        <div>
          <span className="font-bold uppercase">Other:</span>
          <ul className="m-0 list-disc pl-4">
            {city.measures.otherNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border bg-white transition-shadow ${
        highlighted
          ? "border-primary ring-2 ring-primary/40"
          : "border-gray-200 hover:border-primary/40 hover:shadow-md"
      } ${className}`}
      aria-label={`${city.name} — ${city.typeLabel}`}
    >
      {/* 1 — identity */}
      <header className="border-b border-gray-200 px-4 pb-3 pt-4">
        <div className="mb-2 flex items-baseline gap-2">
          {/* `!` overrides the global h3 rule in global.css, which is unlayered. */}
          <h3 className="m-0! text-lg! font-semibold! tracking-tight! text-gray-900!">
            {city.name}
          </h3>
          {city.country && (
            <span className="ml-auto shrink-0 text-xs text-gray-400">
              {city.country}
            </span>
          )}
        </div>
        <Badge
          size="sm"
          color={city.type === "sum_living_lab" ? "info" : "light"}
          className="text-[10px] font-extrabold uppercase tracking-wider"
          displayTooltipIcon={false}
        >
          {city.typeLabel}
        </Badge>
      </header>

      {/* 2 — context */}
      <div className="flex flex-wrap gap-4 border-b border-gray-200 px-4 py-3">
        <ContextItem
          label="Population"
          value={
            city.population != null
              ? numberFormatter.format(city.population)
              : "—"
          }
        />
        <ContextItem
          label="Area"
          value={city.area != null ? `${numberFormatter.format(city.area)} km²` : "—"}
        />
        <ContextItem
          label={city.reportingSinceIsRegistration ? "Registered" : "Reporting since"}
          value={city.reportingSince != null ? String(city.reportingSince) : "—"}
        />
      </div>

      {/* 3 — measures */}
      <Tooltip
        content={city.measures.total > 0 ? measuresTooltip : null}
        placement="bottom"
        className="relative"
        tooltipClassName="max-h-48 overflow-y-auto"
      >
        <div className="border-b border-gray-200 px-4 py-3 cursor-default">
          <div className="mb-2 flex items-baseline gap-2">
            <b className="text-sm font-bold text-gray-900">
              {city.measures.total}{" "}
              {city.measures.total === 1 ? "measure" : "measures"}
            </b>
            <span className="ml-auto text-xs text-gray-400">
              {city.measures.push} push · {city.measures.pull} pull
            </span>
          </div>
          <MeasuresBar push={city.measures.push} pull={city.measures.pull} />
        </div>
      </Tooltip>

      {/* 4 — movement */}
      {hasResults ? (
        <div className="flex flex-1 flex-col border-b border-gray-200 px-4 py-3">
          <div className="mb-2 text-xs text-gray-500">
            <b className="font-bold text-gray-900">
              {city.indicatorsImproved} of {city.indicatorsTotal}
            </b>{" "}
            {city.indicatorsTotal === 1 ? "indicator" : "indicators"} improved
          </div>
          <KpiGroup direction="improved" movements={city.improved} />
          <KpiGroup direction="regressed" movements={city.regressed} />
        </div>
      ) : (
        <PendingResults isContributingCity={city.type === "contributing_city"} />
      )}

      {/* 5 — link */}
      <footer className="bg-gray-50/70 px-4 py-2.5">
        <RButton href={city.href} variant="link" defaultArrow>
          {city.name} data{" "}
        </RButton>
      </footer>
    </article>
  );
}
