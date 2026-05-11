import { useEffect, useState } from "react";
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
  living_lab_id?: string;
  livingLabId: number;
  measure: IProject;
  value?: Partial<LivingLabProjectsImplementationInput>;
  isEditable?: boolean;
  className?: string;
};

type MeasureSnapshot = {
  checked: boolean;
  startAt: string;
  description: string;
};

function buildMeasureSnapshot(
  value: Partial<LivingLabProjectsImplementationInput> | undefined,
  measureId: number,
): MeasureSnapshot {
  return {
    checked: value?.project_id === measureId,
    startAt: parseDateToInputHtml(value?.start_at?.toString() || ""),
    description: value?.description || "",
  };
}

export function LivingLabMeasureForm({
  livingLabId,
  measure,
  value,
  isEditable = false,
  className = "",
}: Props) {
  const propSnapshot = buildMeasureSnapshot(value, measure.id);
  const [savedSnapshot, setSavedSnapshot] =
    useState<MeasureSnapshot>(propSnapshot);
  const [checked, setChecked] = useState<boolean>(propSnapshot.checked);
  const [isSaving, setIsSaving] = useState(false);
  const [startAt, setStartAt] = useState<string>(propSnapshot.startAt);
  const [description, setDescription] = useState<string>(
    propSnapshot.description,
  );
  const [showSubform, setShowSubform] = useState<boolean>(false);

  useEffect(() => {
    setSavedSnapshot(propSnapshot);
    setChecked(propSnapshot.checked);
    setStartAt(propSnapshot.startAt);
    setDescription(propSnapshot.description);
  }, [propSnapshot.checked, propSnapshot.startAt, propSnapshot.description]);

  const currentSnapshot: MeasureSnapshot = {
    checked,
    startAt: parseDateToInputHtml(startAt),
    description,
  };
  const hasChanges =
    currentSnapshot.checked !== savedSnapshot.checked ||
    currentSnapshot.startAt !== savedSnapshot.startAt ||
    currentSnapshot.description !== savedSnapshot.description;

  async function toggle(e?: React.MouseEvent) {
    if (!isEditable || isSaving) return;
    if (!showSubform) {
      setChecked(true);
      setShowSubform(true);
    }
  }

  async function handleSave() {
    if (isSaving || !isEditable) return;
    if (!hasChanges) return;

    try {
      setIsSaving(true);
      const payload: LivingLabProjectsImplementationInput = {
        living_lab_id: livingLabId,
        project_id: measure.id,
        description: description?.length ? description : undefined,
        start_at: startAt?.length ? startAt : undefined,
      };
      const response = await api.updateLivingLabMeasure(payload);

      if (response) {
        const nextSnapshot: MeasureSnapshot = {
          checked: true,
          startAt: parseDateToInputHtml(startAt),
          description,
        };

        setSavedSnapshot(nextSnapshot);
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
    if (isSaving || !isEditable) return;

    const isPersistedMeasure = savedSnapshot.checked;
    if (!isPersistedMeasure) {
      setChecked(false);
      setStartAt("");
      setDescription("");
      setShowSubform(false);
      return;
    }

    try {
      setIsSaving(true);
      await api.deleteLivingLabMeasure({
        labId: String(livingLabId),
        projectId: String(measure.id),
      });

      setSavedSnapshot({
        checked: false,
        startAt: "",
        description: "",
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
    if (isSaving || !isEditable) return;
    try {
      setChecked(savedSnapshot.checked);
      setStartAt(savedSnapshot.startAt);
      setDescription(savedSnapshot.description);

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
        className={`relative flex flex-col items-center px-2 py-2 w-full ${
          isEditable ? "cursor-pointer" : ""
        }`}
        aria-label={measure.name}
        onClick={toggle}
      >
        <div
          className={
            "absolute top-1 right-1 flex flex-col" +
            (isEditable ? " cursor-pointer" : " hidden")
          }
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={!isEditable || isSaving}
            aria-label={`select-${measure.id}`}
            readOnly
          />
          {checked && !showSubform && isEditable && (
            <PencilSquareIcon className="h-4 w-4 text-primary" />
          )}
        </div>

        <div
          className={` flex flex-col items-center space-x-2 ${bgClass} ${className}`}
        >
          <div className="shrink-0">
            {measure.image_url ? (
              <img
                alt={measure.name}
                src={getUrl(measure.image_url as string)}
                className="h-14 w-14"
              />
            ) : null}
          </div>

            <div className="min-w-0 flex-1 gap-y-2 text-center">
            <span aria-hidden="true" className="absolute inset-0" />
            <h5 className="font-bold text-sm">{measure.name}</h5>
            {measure.description ? (
              <p className="mt-1 text-xs leading-relaxed line-clamp-3">{measure.description}</p>
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
              <Label>Provide a summary of the activities</Label>
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
                disabled={isSaving || !hasChanges}
                className="bg-primary text-white"
              >
                {isSaving ? "Saving..." : "Validate"}
              </RButton>
            </div>
          </form>
        ) : checked && (startAt || description) ? (
          <div className="flex flex-col gap-1 text-left p-5 text-primary justify-center items-start">
            {startAt ? (
              <div className="flex flex-row justify-center items-center gap-1">
                <CalendarIcon className="h-5 w-5" />
                <p>{formatDateToMonthYear(startAt)}</p>
              </div>
            ) : null}
            <p style={{ whiteSpace: "pre-line" }}>{description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
