import { useState } from "react";
import { Field, Input, Label } from "../../react-catalyst-ui-kit";
import {
  CheckCircleIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import {
  formatDateToMonthYear,
  parseDateToInputHtml,
} from "../../../lib/helpers";

interface Props {
  /** Currently set default date (YYYY-MM-DD). Empty string = not set. */
  value: string;
  /** Called when user confirms a new date or clears the field. */
  onChange: (date: string) => void;
}

export function DefaultCollectionDate({ value, onChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingDate, setPendingDate] = useState(value);

  const handleEdit = () => {
    setPendingDate(value);
    setIsEditing(true);
  };

  const handleConfirm = () => {
    onChange(pendingDate);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPendingDate(value);
    setIsEditing(false);
  };

  return (
    <div className="mb-4 flex flex-col items-start">
      <Field>
        <Label htmlFor="default-collection-date-input">
          Default collection date (optional)
        </Label>
        <small>New entries will use this date. Leave blank to use today.</small>
        <div className="flex flex-row my-auto items-center gap-2">
          {!isEditing ? (
            <>
              <span className="text-base font-medium" aria-label="Default collection date">
                {value ? formatDateToMonthYear(value) : <span className="text-gray-400">Not set</span>}
              </span>
              <button
                type="button"
                aria-label="Edit"
                onClick={handleEdit}
                className="inline-flex items-center"
              >
                <PencilSquareIcon className="h-6 w-6 text-gray-600 cursor-pointer hover:text-gray-800" />
              </button>
            </>
          ) : (
            <>
              <Input
                id="default-collection-date-input"
                type="date"
                name="default-collection-date"
                value={parseDateToInputHtml(pendingDate)}
                onChange={(e) => setPendingDate(e.target.value)}
                className="mt-0 m-0"
              />
              <button
                type="button"
                aria-label="Confirm"
                onClick={handleConfirm}
                className="inline-flex items-center"
              >
                <CheckCircleIcon className="h-6 w-6 text-success cursor-pointer hover:text-green-700" />
              </button>
              <button
                type="button"
                aria-label="Cancel"
                onClick={handleCancel}
                className="inline-flex items-center"
              >
                <XMarkIcon className="h-6 w-6 text-red-600 cursor-pointer hover:text-red-800" />
              </button>
            </>
          )}
        </div>
      </Field>
    </div>
  );
}
