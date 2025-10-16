import React, { useState } from "react";
import {
  PencilSquareIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusCircleIcon,
} from "@heroicons/react/20/solid";
import {
  EnumKpiMetricType,
  type IKpiResult,
  type IKpiResultInput,
} from "../../../types/KPIs";
import { Field, Input } from "../../react-catalyst-ui-kit";
import {
  formatDateToMonthYear,
  getKpiValueByMetricType,
  parseDateToInputHtml,
} from "../../../lib/helpers";
import ApiClient from "../../../lib/api-client/ApiClient";
const api = new ApiClient();

type Props = {
  initial?: IKpiResult | null;
  kpiId: string;
  livingLabId: string;
  transportModeId?: string;
  kpiMetric?: string;
  defaultDate?: string;
  defaultValue?: number;
  onChange?: (result: IKpiResultInput) => void;
  min?: number;
  max?: number;
  placeholder?: string;
};

export function LivingLabKpiResultForm({
  kpiId,
  initial,
  livingLabId,
  transportModeId,
  kpiMetric,
  defaultDate = "",
  defaultValue,
  onChange,
  min,
  max,
  placeholder = "Enter value",
}: Props) {
  //TODO adapt to metric type
  const _setValue = (value?: number | undefined) => {
    return value !== undefined && value !== null
      ? Math.round(Number(value) * 100) / 100
      : undefined;
  };
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number | undefined>(
    _setValue(initial?.value)
  );
  const [date, setDate] = useState<string>(initial?.date ?? defaultDate);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | undefined>(initial?.id);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value || !validateValue(value) || !validateDate(date)) return;

    try {
      const result = await api.upsertLivingLabKpiResults({
        id: id,
        kpidefinition_id: kpiId,
        living_lab_id: livingLabId,
        value: Number(value),
        date,
        transport_mode_id: transportModeId,
      });
      setId(result?.id);
    } catch (err) {
      console.error("Error saving KPI result:", err);
      return;
    }

    onChange?.({
      id,
      value: Number(value),
      date: date,
      kpidefinition_id: kpiId,
      living_lab_id: livingLabId,
      transport_mode_id: transportModeId,
    });
    setEditing(false);
  };

  const handleClose = () => {
    setValue(_setValue(initial?.value));
    initial?.date ? setDate(initial?.date) : setDate("");
    setEditing(false);
  };

  const validateValue = (val: number) => {
    if (
      kpiMetric === EnumKpiMetricType.PERCENTAGE &&
      min !== undefined &&
      min !== null &&
      val < min
    ) {
      setError(`Min value is ${min}, lower values are not accepted`);
      return false;
    } else if (
      kpiMetric === EnumKpiMetricType.PERCENTAGE &&
      max !== undefined &&
      max !== null &&
      val > max
    ) {
      setError(`Max value is ${max}, higher values are not accepted`);
      return false;
    } else if (min !== undefined && min !== null && val < min) {
      setError(
        `Min value observed is ${min}, are you sure your value is correct ?`
      );
    } else if (max !== undefined && max !== null && val > max) {
      setError(
        `Max value observed is ${max}, are you sure your value is correct ?`
      );
    } else {
      setError(null);
    }
    return true;
  };

  const validateDate = (d: string) => {
    if (d && isNaN(new Date(d).getTime())) {
      setError("Invalid date");
      return false;
    } else {
      setError(null);
    }
    return true;
  };
  const validateAndSetValue = (val: number) => {
    validateValue(val);
    setValue(val);
  };

  const setDefaultAndOpenEditing = () => {
    if (value === undefined && defaultValue !== undefined) {
      setValue(_setValue(defaultValue));
    }
    setEditing(true);
  };
  if (!editing) {
    return (
      <div className="flex flex-col flex-1 items-start justify-start content-start">
        <div className="flex flex-row gap-1 items-start min-h-[1.25rem]">
          <p className="flex items-center">
            {getKpiValueByMetricType(value, kpiMetric) || <span>&nbsp;</span>}
          </p>
          <button
            type="button"
            aria-label="Edit"
            onClick={setDefaultAndOpenEditing}
            className="inline-flex items-center"
          >
            {value ? (
              <PencilSquareIcon className="h-4 w-4 text-primary" />
            ) : (
              <PlusCircleIcon className="h-4 w-4 text-secondary" />
            )}
          </button>
        </div>
        {value && date && <small>{formatDateToMonthYear(date)}</small>}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col items-start space-x-3 gap-2 w-28"
    >
      <Field className="w-28">
        <Input
          placeholder={placeholder}
          type="number"
          name="value"
          value={value}
          onChange={(e) => validateAndSetValue(Number(e.target.value))}
          className="mt-0 m-O"
          step={kpiMetric === EnumKpiMetricType.PERCENTAGE ? 0.01 : 0.1}
          min={kpiMetric === EnumKpiMetricType.PERCENTAGE ? 0 : undefined}
          max={kpiMetric === EnumKpiMetricType.PERCENTAGE ? 1 : undefined}
        />
        <small className="text-red-600">{error}</small>
      </Field>

      <Field className="w-28">
        <Input
          type="date"
          name="date"
          value={parseDateToInputHtml(date)}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>

      <div className="flex flex-row justify-end items-end w-full space-x-2">
        <button
          type="submit"
          aria-label="Save"
          onClick={handleSave}
          className="inline-flex items-center"
        >
          <CheckCircleIcon className="h-4 w-4 text-success" />
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={handleClose}
          className="inline-flex items-center"
        >
          <XMarkIcon className="h-4 w-4 text-dark" />
        </button>
      </div>
    </form>
  );
}

export default LivingLabKpiResultForm;
