import { useState } from "react";
import type { IProject } from "../../../types";
import { getUrl } from "../../../lib/helpers";
import ApiClient from "../../../lib/api-client/ApiClient";
const api = new ApiClient();

type Props = {
  livingLabId: string;
  measure: IProject;
  initialChecked?: boolean;
  disabled?: boolean;
  onToggle?: (m: IProject, checked: boolean) => void;
  className?: string;
};

export function LivingLabMeasureForm({
  livingLabId,
  measure,
  initialChecked = false,
  disabled = true,
  onToggle,
  className = "",
}: Props) {
  const [checked, setChecked] = useState<boolean>(initialChecked);

  function handleSelect(next: boolean) {
    // Intentionally left empty for backend call — to be implemented.
    // Will be called when user toggles checkbox or clicks the card.
    //api call POST /living-labs/${livingLabId}/projects/${measure.id} with body {selected: next}
    //backend will handle create or delete based on 'next' value
    if (next) {
      api
        .updateLivingLabMeasure({
          labId: livingLabId,
          projectId: measure.id,
        })
        .catch((error) => {
          console.error("Error adding measure to living lab:", error);
          // Optionally revert UI state or show error to user
          setChecked(!next); // revert state on error
        });
    } else {
      api
        .deleteLivingLabMeasure({
          labId: livingLabId,
          projectId: measure.id,
        })
        .catch((error) => {
          console.error("Error removing measure from living lab:", error);
          // Optionally revert UI state or show error to user
          setChecked(!next); // revert state on error
        });
    }
  }

  function toggle(e?: React.MouseEvent) {
    // Prevent double handlers if coming from checkbox change
    const next = !checked;
    setChecked(next);
    handleSelect(next);
    if (onToggle) onToggle(measure, next);
  }

  const bgClass = checked ? "bg-success" : "bg-light";

  return (
    <div
      className={`relative flex flex-col items-center space-x-2 rounded-lg border border-gray-300 px-2 py-2 shadow-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 hover:border-gray-400 ${bgClass} ${className}`}
      aria-label={measure.name}
      onClick={toggle}
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

      <div className="absolute top-1 right-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            // Stop propagation so outer click handler isn't double-invoked
            e.stopPropagation();
            const next = e.target.checked;
            setChecked(next);
            handleSelect(next);
            if (onToggle) onToggle(measure, next);
          }}
          disabled={disabled}
          aria-label={`select-${measure.id}`}
        />
      </div>
    </div>
  );
}
