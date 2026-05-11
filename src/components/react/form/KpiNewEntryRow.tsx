import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import {
  EnumKpiMetricType,
  type IKpi,
  type IKpiResult,
} from "../../../types/KPIs";
import { Field, Input } from "../../react-catalyst-ui-kit";
import { parseDateToInputHtml } from "../../../lib/helpers";
import ApiClient from "../../../lib/api-client/ApiClient";
const api = new ApiClient();

const todayISO = () => new Date().toISOString().slice(0, 10);

interface Props {
  kpi: IKpi;
  livingLabId: number;
  transportModeId?: number;
  defaultDate?: string;
  onSave: (created: IKpiResult) => void;
  onCancel: () => void;
}

export function KpiNewEntryRow({
  kpi,
  livingLabId,
  transportModeId,
  defaultDate,
  onSave,
  onCancel,
}: Props) {
  const initialDate = defaultDate ?? todayISO();
  const [pendingValue, setPendingValue] = useState<string>("");
  const [pendingDate, setPendingDate] = useState<string>(initialDate);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = pendingValue.trim() !== "" || pendingDate !== initialDate;
  const canSave =
    !isSaving && isDirty && pendingValue.trim() !== "" && !!pendingDate;

  // Update date when defaultDate prop changes (only while row is open/unsaved)
  useEffect(() => {
    setPendingDate(defaultDate ?? todayISO());
  }, [defaultDate]);

  const validate = (val: string, date: string): boolean => {
    if (!val || val.trim() === "") {
      setError("Value is required");
      return false;
    }
    const num = Number(val);
    if (isNaN(num)) {
      setError("Value must be a number");
      return false;
    }
    if (!date) {
      setError("Date is required");
      return false;
    }
    if (
      kpi.metric === EnumKpiMetricType.PERCENTAGE &&
      kpi.max_value !== undefined &&
      kpi.max_value !== null &&
      num > kpi.max_value
    ) {
      setError(`Invalid value, max value is ${kpi.max_value}`);
      return false;
    }
    if (
      kpi.metric === EnumKpiMetricType.PERCENTAGE &&
      kpi.min_value !== undefined &&
      kpi.min_value !== null &&
      num < kpi.min_value
    ) {
      setError(`Invalid value, min value is ${kpi.min_value}`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (!validate(pendingValue, pendingDate)) return;

    try {
      setIsSaving(true);
      const created = await api.upsertLivingLabKpiResults({
        kpidefinition_id: kpi.id,
        living_lab_id: livingLabId,
        value: Number(pendingValue),
        date: pendingDate,
        transport_mode_id: transportModeId,
      });
      if (created) {
        onSave({
          id: created.id as number,
          kpidefinition_id: kpi.id,
          living_lab_id: livingLabId,
          value: Number(created.value),
          date: created.date ?? pendingDate,
          transport_mode_id: transportModeId,
        });
      }
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex flex-row items-center gap-2">
        <Field className="w-32">
          <Input
            type="number"
            name="value"
            value={pendingValue}
            placeholder="Value"
            onChange={(e) => setPendingValue(e.target.value)}
            step={kpi.metric === EnumKpiMetricType.PERCENTAGE ? 0.01 : 0.1}
            min={kpi.metric === EnumKpiMetricType.PERCENTAGE ? 0 : undefined}
            max={kpi.metric === EnumKpiMetricType.PERCENTAGE ? 1 : undefined}
            className="mt-0"
          />
        </Field>
        <Field className="w-36">
          <Input
            type="date"
            name="date"
            value={parseDateToInputHtml(pendingDate)}
            onChange={(e) => setPendingDate(e.target.value)}
            className="mt-0"
          />
        </Field>
        <button
          type="button"
          aria-label="Save"
          onClick={handleSave}
          disabled={!canSave}
          className={`inline-flex items-center ${
            canSave ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          }`}
        >
          <CheckCircleIcon className="h-4 w-4 text-success" />
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={onCancel}
          className="inline-flex items-center"
        >
          <XMarkIcon className="h-4 w-4 text-dark" />
        </button>
      </div>
      {error && <small className="text-red-600 whitespace-pre-line">{error}</small>}
    </div>
  );
}
