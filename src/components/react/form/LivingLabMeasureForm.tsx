import { useState } from "react";
import type {
  IProject,
  LivingLabProjectsImplementationInput,
} from "../../../types";
import {
  formatDateToMonthYear,
  getUrl,
  parseDateToInputHtml,
} from "../../../lib/helpers";
import ApiClient from "../../../lib/api-client/ApiClient";
import { Field, Input, Label, Textarea } from "../../react-catalyst-ui-kit";
import { RButton } from "../ui";
import { PencilSquareIcon, CalendarIcon } from "@heroicons/react/20/solid";

const api = new ApiClient();

type Props = {
  livingLabId: string;
  measure: IProject;
  value?: Partial<LivingLabProjectsImplementationInput>;
  disabled?: boolean;
  className?: string;
};

export function LivingLabMeasureForm({
  livingLabId,
  measure,
  value,
  disabled = true,
  className = "",
}: Props) {
  const [checked, setChecked] = useState<boolean>(
    value?.project_id === measure.id
  );
  const [isSaving, setIsSaving] = useState(false);
  const [startAt, setStartAt] = useState<string>(
    value?.start_at?.toString() || ""
  );
  const [description, setDescription] = useState<string>(
    value?.description || ""
  );
  const [showSubform, setShowSubform] = useState<boolean>(false);

  async function toggle(e?: React.MouseEvent) {
    // Prevent double handlers if coming from checkbox change
    if (disabled || isSaving) return;
    if (!showSubform) {
      setChecked(true);
      setShowSubform(true);
    }
  }

  async function handleSave() {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const payload: LivingLabProjectsImplementationInput = {
        living_lab_id: livingLabId,
        project_id: measure.id,
        description: description?.length ? description : undefined,
        start_at: startAt?.length
          ? (new Date(startAt) as unknown as Date)
          : undefined,
      } as LivingLabProjectsImplementationInput;
      const response = await api.updateLivingLabMeasure(payload);

      if (response) {
        setChecked(true);
        setShowSubform(false);
      }
    } catch (error) {
      console.error("Error saving measure details:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const response = await api.deleteLivingLabMeasure({
        labId: livingLabId,
        projectId: measure.id,
      });

      setChecked(false);
      setStartAt("");
      setDescription("");

      setShowSubform(false);
    } catch (error) {
      console.error("Error removing measure:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClose() {
    if (isSaving) return;
    try {
      setChecked(value?.project_id === measure.id);
      setStartAt(value?.start_at?.toString() || "");
      setDescription(value?.description || "");

      setShowSubform(false);
    } catch (error) {
      console.error("Error canceling measure selection:", error);
    } finally {
      setIsSaving(false);
    }
  }

  const bgClass = checked ? "bg-success" : "bg-light";

  return (
    <div
      className={`flex flex-col items-center space-x-2 rounded-lg border border-gray-300 shadow-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 hover:border-gray-400 ${bgClass} ${className}`}
      aria-label={measure.name}
    >
      <div
        className="relative flex flex-col items-center px-2 py-2 w-full cursor-pointer"
        aria-label={measure.name}
        onClick={toggle}
      >
        <div className="absolute top-1 right-1 flex flex-col">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled || isSaving}
            aria-label={`select-${measure.id}`}
            readOnly
          />
          {checked && !showSubform && (
            <PencilSquareIcon className="h-4 w-4 text-primary" />
          )}
        </div>

        <div
          className={` flex flex-col items-center space-x-2${bgClass} ${className}`}
        >
          <div className="shrink-0">
            {measure.image_url ? (
              <img
                alt={measure.name}
                src={getUrl(measure.image_url as string)}
                className="h-10 w-10"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 gap-y-1 text-center">
            <span aria-hidden="true" className="absolute inset-0" />
            <span className="font-semibold text-sm">{measure.name}</span>
            <br />
            {measure.description ? (
              <small className="mt-0 leading-0">{measure.description}</small>
            ) : null}
          </div>
        </div>
      </div>
      {/* Inline subform */}
      <div
        className={
          "w-full mt-2 transition-all duration-300 bg-white/70 rounded-md"
        }
      >
        {showSubform ? (
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start px-2 py-2 "
            onSubmit={(e) => e.preventDefault()}
          >
            <Field>
              <Label>Estimated Start date</Label>
              <Input
                id={`start_at-${measure.id}`}
                type="date"
                value={parseDateToInputHtml(startAt)}
                onChange={(e) => setStartAt(e.target.value)}
                disabled={isSaving}
              />
            </Field>

            <Field className="md:col-span-2">
              <Label>What is the measure about?</Label>
              <Textarea
                id={`desc-${measure.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                resizable={false}
                rows={5}
                disabled={isSaving}
              />
            </Field>

            <div className="flex gap-2 md:col-span-3 justify-end">
              <RButton
                variant="secondary"
                type="button"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </RButton>
              <RButton
                variant="secondary"
                type="button"
                onClick={handleRemove}
                disabled={isSaving}
                className="bg-danger  text-white"
              >
                {isSaving ? "Saving..." : "Remove"}
              </RButton>
              <RButton
                variant="secondary"
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-white"
              >
                {isSaving ? "Saving..." : "Validate"}
              </RButton>
            </div>
          </form>
        ) : checked ? (
          <div className="flex flex-row gap-1 text-left p-5 text-primary justify-center items-start">
            <CalendarIcon className="h-5 w-5" />
            <small>
              {startAt ? formatDateToMonthYear(startAt) : "Unknown"}
            </small>
            <span className="mx-1 border-l border-dark h-4 self-start" />
            <small style={{ whiteSpace: "pre-line" }}>{description}</small>
          </div>
        ) : null}
      </div>
    </div>
  );
}
