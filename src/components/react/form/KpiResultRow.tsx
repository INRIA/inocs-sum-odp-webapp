import { useState } from "react";
import {
  PencilSquareIcon,
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import {
  EnumKpiMetricType,
  type IKpi,
  type IKpiResult,
} from "../../../types/KPIs";
import { Field, Input } from "../../react-catalyst-ui-kit";
import {
  formatDateToMonthYear,
  getKpiValueByMetricType,
  parseDateToInputHtml,
} from "../../../lib/helpers";
import ApiClient from "../../../lib/api-client/ApiClient";
const api = new ApiClient();

interface Props {
  result: IKpiResult;
  kpi: IKpi;
  onSave: (updated: IKpiResult) => void;
  onDelete: (id: number) => void;
}

export function KpiResultRow({ result, kpi, onSave, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingValue, setPendingValue] = useState<number>(result.value);
  const [pendingDate, setPendingDate] = useState<string>(result.date);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges =
    pendingValue !== result.value ||
    parseDateToInputHtml(pendingDate) !== parseDateToInputHtml(result.date);
  const canSave = !isSaving && hasChanges;

  const validate = (val: number, date: string): boolean => {
    if (!date) {
      setError("Date is required");
      return false;
    }
    if (
      kpi.metric === EnumKpiMetricType.PERCENTAGE &&
      kpi.max_value !== undefined &&
      kpi.max_value !== null &&
      val > kpi.max_value
    ) {
      setError(`Invalid value, max value is ${kpi.max_value}`);
      return false;
    }
    if (
      kpi.metric === EnumKpiMetricType.PERCENTAGE &&
      kpi.min_value !== undefined &&
      kpi.min_value !== null &&
      val < kpi.min_value
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
      const updated = await api.upsertLivingLabKpiResults({
        id: result.id,
        kpidefinition_id: result.kpidefinition_id,
        living_lab_id: result.living_lab_id,
        value: pendingValue,
        date: pendingDate,
        transport_mode_id: result.transport_mode_id,
      });
      if (updated) {
        onSave({
          ...result,
          id: updated.id ?? result.id,
          value: Number(updated.value),
          date: updated.date ?? pendingDate,
        });
      }
      setIsEditing(false);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingValue(result.value);
    setPendingDate(result.date);
    setError(null);
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.deleteKpiResult(String(result.id));
      onDelete(result.id);
    } catch {
      setError("Failed to delete. Please try again.");
      setConfirmingDelete(false);
    }
  };

  if (confirmingDelete) {
    return (
      <div className="flex flex-row items-center gap-2 py-1">
        <span className="text-sm text-red-600">Are you sure?</span>
        <button
          type="button"
          aria-label="Confirm"
          onClick={handleDeleteConfirm}
          className="inline-flex items-center text-red-600 hover:text-red-800"
        >
          <CheckCircleIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={() => setConfirmingDelete(false)}
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
        {error && <small className="text-red-600">{error}</small>}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 py-1">
        <div className="flex flex-row items-center gap-2">
          <Field className="w-32">
            <Input
              type="number"
              name="value"
              value={pendingValue}
              onChange={(e) => setPendingValue(Number(e.target.value))}
              disabled={isSaving}
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
              disabled={isSaving}
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
            onClick={handleCancel}
            disabled={isSaving}
            className={`inline-flex items-center ${
              isSaving ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            <XMarkIcon className="h-4 w-4 text-dark" />
          </button>
        </div>
        {error && <small className="text-red-600 whitespace-pre-line">{error}</small>}
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2 py-1">
      <span data-testid="kpi-result-value" className="text-sm font-medium min-w-[3rem]">
        {getKpiValueByMetricType(result.value, kpi.metric) ?? String(result.value)}
      </span>
      <span className="text-xs text-gray-500">{formatDateToMonthYear(result.date)}</span>
      <button
        type="button"
        aria-label="Edit"
        onClick={() => {
          setPendingValue(result.value);
          setPendingDate(result.date);
          setIsEditing(true);
        }}
        className="inline-flex items-center"
      >
        <PencilSquareIcon className="h-4 w-4 text-primary" />
      </button>
      <button
        type="button"
        aria-label="Delete"
        onClick={() => setConfirmingDelete(true)}
        className="inline-flex items-center"
      >
        <TrashIcon className="h-4 w-4 text-red-500" />
      </button>
    </div>
  );
}
