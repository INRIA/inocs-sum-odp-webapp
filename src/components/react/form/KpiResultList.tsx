import { useState } from "react";
import { PlusCircleIcon } from "@heroicons/react/20/solid";
import type { IKpi, IKpiResult } from "../../../types/KPIs";
import { KpiResultRow } from "./KpiResultRow";
import { KpiNewEntryRow } from "./KpiNewEntryRow";

interface Props {
  kpi: IKpi;
  livingLabId: number;
  transportModeId?: number;
  initialResults: IKpiResult[];
  defaultDate?: string;
  onChange?: (results: IKpiResult[]) => void;
  changeDateAllowed?: boolean;
}

export function KpiResultList({
  kpi,
  livingLabId,
  transportModeId,
  initialResults,
  defaultDate,
  onChange,
}: Props) {
  // Sort entries chronologically on initialisation
  const [entries, setEntries] = useState<IKpiResult[]>(() =>
    [...initialResults].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    ),
  );
  const [isAddingNew, setIsAddingNew] = useState(false);

  const notify = (updated: IKpiResult[]) => {
    onChange?.(updated);
  };

  const handleNewEntrySave = (created: IKpiResult) => {
    const updated = [...entries, created].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    setEntries(updated);
    setIsAddingNew(false);
    notify(updated);
  };

  const handleNewEntryCancel = () => {
    setIsAddingNew(false);
  };

  const handleRowSave = (updatedResult: IKpiResult) => {
    const updated = entries.map((e) =>
      e.id === updatedResult.id ? updatedResult : e,
    );
    setEntries(updated);
    notify(updated);
  };

  const handleRowDelete = (id: number) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    notify(updated);
  };

  return (
    <div className="flex flex-col">
      {entries.length === 0 && !isAddingNew && (
        <span className="text-xs text-gray-400 italic">No entries yet</span>
      )}
      {entries.map((result) => (
        <KpiResultRow
          key={result.id}
          result={result}
          kpi={kpi}
          onSave={handleRowSave}
          onDelete={handleRowDelete}
        />
      ))}
      {isAddingNew && (
        <KpiNewEntryRow
          key="new"
          kpi={kpi}
          livingLabId={livingLabId}
          transportModeId={transportModeId}
          defaultDate={defaultDate}
          onSave={handleNewEntrySave}
          onCancel={handleNewEntryCancel}
        />
      )}
      {!isAddingNew && (
        <button
          type="button"
          aria-label="Add new entry"
          onClick={() => setIsAddingNew(true)}
          className="inline-flex items-center gap-1 text-secondary mt-1 w-fit"
        >
          <PlusCircleIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
