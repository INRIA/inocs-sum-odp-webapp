import React from "react";
import { Badge } from "../ui/Badge";
import type { BadgeColor } from "../ui/Badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PolicyMeasureOverviewRow {
  id: number;
  name: string;
  type: string;
  cities: { id: number; name: string }[];
}

interface Props {
  rows: PolicyMeasureOverviewRow[];
}

// Deterministic color palette for city badges (theme-compatible)
const CITY_COLORS: BadgeColor[] = [
  "primary",
  "secondary",
  "info",
  "warning",
  "success",
  "dark",
];

function cityColor(cityId: number): BadgeColor {
  return CITY_COLORS[Math.abs(cityId) % CITY_COLORS.length];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PolicyMeasuresOverview({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-light bg-light/50 p-6 text-dark text-center">
        No policy measures data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mb-10">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-primary/20">
            <th className="text-left py-3 pr-4 font-semibold text-primary w-20">
              Type
            </th>
            <th className="text-left py-3 pr-4 font-semibold text-primary">
              Policy measure
            </th>
            <th className="text-left py-3 px-2 font-semibold text-primary">
              Implemented by
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-light hover:bg-light/30"
            >
              <td className="py-3 pr-4 text-xs font-semibold text-dark/70 uppercase tracking-wide">
                {row.type}
              </td>
              <td className="py-3 pr-4 font-medium text-dark">{row.name}</td>
              <td className="py-3 px-2">
                <div className="flex flex-wrap items-center gap-1">
                  {row.cities.length > 0 ? (
                    <>
                      <span className="text-xs font-semibold text-dark/70 mr-1">
                        {row.cities.length} {row.cities.length === 1 ? "city" : "cities"} –
                      </span>
                      {row.cities.map((city) => (
                        <Badge
                          key={city.id}
                          color={cityColor(city.id)}
                          size="sm"
                        >
                          {city.name}
                        </Badge>
                      ))}
                    </>
                  ) : (
                    <span className="text-dark/40 text-xs">—</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
