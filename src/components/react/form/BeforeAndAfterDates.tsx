import { useEffect, useState } from "react";
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
  valueBeforeDate?: string;
  valueAfterDate?: string;
  onChangeBeforeDate: (date: string) => void;
  onChangeAfterDate: (date: string) => void;
}

export function BeforeAndAfterDates({
  valueBeforeDate,
  valueAfterDate,
  onChangeBeforeDate,
  onChangeAfterDate,
}: Props) {
  const [beforeDate, setBeforeDate] = useState<string>(valueBeforeDate ?? "");
  const [afterDate, setAfterDate] = useState<string>(
    valueAfterDate ? valueAfterDate : ""
  );
  const [isEditingBefore, setIsEditingBefore] = useState(false);
  const [isEditingAfter, setIsEditingAfter] = useState(false);

  const handleBeforeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setBeforeDate(newDate);
  };

  const handleBeforeDateSubmit = () => {
    onChangeBeforeDate(beforeDate);
    setIsEditingBefore(false);
  };

  const handleBeforeDateCancel = () => {
    valueBeforeDate && setBeforeDate(valueBeforeDate);
    setIsEditingBefore(false);
  };

  const handleAfterDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setAfterDate(newDate);
  };

  const handleAfterDateSubmit = () => {
    onChangeAfterDate(afterDate);
    setIsEditingAfter(false);
  };

  const handleAfterDateCancel = () => {
    valueAfterDate && setAfterDate(valueAfterDate);
    setIsEditingAfter(false);
  };

  useEffect(() => {
    if (valueBeforeDate) {
      setBeforeDate(valueBeforeDate);
    }
  }, [valueBeforeDate]);

  useEffect(() => {
    if (valueAfterDate) {
      setAfterDate(valueAfterDate);
    }
  }, [valueAfterDate]);

  return (
    <div className="mb-4 flex flex-col md:flex-row items-center justify-center gap-8">
      <Field>
        <Label>Collection date BEFORE Implementation</Label>
        <small>This date will be set for all KPI values.</small>
        <div className="flex flex-row my-auto items-center gap-2">
          {!isEditingBefore ? (
            <>
              <span className="text-base font-medium">
                {formatDateToMonthYear(valueBeforeDate || beforeDate)}
              </span>
              <PencilSquareIcon
                className="h-6 w-6 text-gray-600 cursor-pointer hover:text-gray-800"
                onClick={() => setIsEditingBefore(true)}
              />
            </>
          ) : (
            <>
              <Input
                type="date"
                name="data-collection-date-before"
                value={parseDateToInputHtml(beforeDate)}
                onChange={handleBeforeDateChange}
                className="mt-0 m-0"
              />
              <CheckCircleIcon
                className="h-6 w-6 text-success cursor-pointer hover:text-green-700"
                onClick={handleBeforeDateSubmit}
              />
              <XMarkIcon
                className="h-6 w-6 text-red-600 cursor-pointer hover:text-red-800"
                onClick={handleBeforeDateCancel}
              />
            </>
          )}
        </div>
      </Field>
      <Field>
        <Label>Collection date AFTER Implementation</Label>
        <small>This date will be set for all KPI values.</small>
        <div className="flex flex-row my-auto items-center gap-2">
          {!isEditingAfter ? (
            <>
              <span className="text-base font-medium">
                {formatDateToMonthYear(valueAfterDate || afterDate)}
              </span>
              <PencilSquareIcon
                className="h-6 w-6 text-gray-600 cursor-pointer hover:text-gray-800"
                onClick={() => setIsEditingAfter(true)}
              />
            </>
          ) : (
            <>
              <Input
                type="date"
                name="data-collection-date-after"
                value={parseDateToInputHtml(afterDate)}
                onChange={handleAfterDateChange}
                className="mt-0 m-0"
              />
              <CheckCircleIcon
                className="h-6 w-6 text-success cursor-pointer hover:text-green-700"
                onClick={handleAfterDateSubmit}
              />
              <XMarkIcon
                className="h-6 w-6 text-red-600 cursor-pointer hover:text-red-800"
                onClick={handleAfterDateCancel}
              />
            </>
          )}
        </div>
      </Field>
    </div>
  );
}
