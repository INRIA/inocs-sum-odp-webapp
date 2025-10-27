import { useState, type ReactNode } from "react";
import LivingLabKpiResultForm from "./LivingLabKpiResultForm";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  EqualsIcon,
} from "@heroicons/react/20/solid";
import type { IKpi } from "../../../types";

type Props = {
  livingLabId: string;
  kpi: IKpi;
  transportModeId?: string;
  initialBefore?: any;
  initialAfter?: any;
  defaultBeforeDate?: string;
  defaultAfterDate?: string;
  onChange?: (before: number | null, after: number | null) => void;
  changeDateAllowed?: boolean;
};

export function LivingLabKpiResultsForm({
  kpi,
  livingLabId,
  transportModeId,
  initialBefore,
  initialAfter,
  defaultBeforeDate,
  defaultAfterDate,
  onChange,
  changeDateAllowed,
}: Props) {
  const [before, setBefore] = useState<number | null>(initialBefore?.value);
  const [after, setAfter] = useState<number | null>(initialAfter?.value);

  function getChangeIcon(a: number | null, b: number | null): ReactNode {
    if (b === null || a === null || b === undefined || a === undefined)
      return null;

    const diff = b - a;
    if (diff === 0) return <EqualsIcon className="h-5 w-5 text-gray-500" />;
    return diff > 0 ? (
      <ArrowTrendingUpIcon className="h-5 w-5 text-success" />
    ) : (
      <ArrowTrendingDownIcon className="h-5 w-5 text-danger" />
    );
  }

  return (
    <div className="flex flex-row w-full items-center">
      <div className="flex-1">
        <LivingLabKpiResultForm
          livingLabId={livingLabId}
          kpi={kpi}
          transportModeId={transportModeId}
          initial={initialBefore}
          defaultDate={defaultBeforeDate}
          placeholder="Before value"
          onChange={(result) => {
            setBefore(result?.value ?? null);
            if (onChange) onChange(result?.value, after);
          }}
          changeDateAllowed={changeDateAllowed}
        />
      </div>
      <div className="flex items-center justify-center mx-4">
        {getChangeIcon(before, after)}
      </div>
      <div className="flex-1">
        {initialBefore?.value && (
          <LivingLabKpiResultForm
            livingLabId={livingLabId}
            kpi={kpi}
            transportModeId={transportModeId}
            initial={initialAfter}
            defaultValue={initialBefore?.value}
            defaultDate={defaultAfterDate}
            placeholder="After value"
            onChange={(result) => {
              setAfter(result?.value ?? null);
              if (onChange) onChange(before, result?.value);
            }}
            changeDateAllowed={changeDateAllowed}
          />
        )}
      </div>
    </div>
  );
}
