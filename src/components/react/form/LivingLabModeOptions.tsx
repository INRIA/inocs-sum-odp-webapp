import React from "react";
import {
  Radio,
  RadioField,
  RadioGroup,
} from "../../react-catalyst-ui-kit/typescript/radio";
import { Label } from "../../react-catalyst-ui-kit/typescript/fieldset";
import { Select } from "../../react-catalyst-ui-kit/typescript/select";

export type LivingLabMode = "select" | "create";

export interface LivingLabModeOptionsProps {
  /**
   * List of available living labs for selection
   */
  livingLabs: { id: string; name: string }[];

  /**
   * Current mode: "select" to choose from existing labs, "create" to make a new one
   */
  mode: LivingLabMode;

  /**
   * Callback when mode changes between "select" and "create"
   */
  onModeChange: (mode: LivingLabMode) => void;

  /**
   * Currently selected lab ID (when mode is "select")
   */
  selectedLabId?: string;

  /**
   * Callback when a lab is selected from the dropdown
   */
  onLabSelect?: (labId: string) => void;

  /**
   * Whether the form is in a loading/disabled state
   */
  isLoading?: boolean;

  /**
   * When true, hides the "Create new" radio option (login/switch flow)
   */
  hideCreate?: boolean;

  /**
   * Custom labels for the radio options
   */
  labels?: {
    select?: string;
    create?: string;
    selectDropdown?: string;
  };
}

/**
 * Reusable component for selecting between creating a new Living Lab
 * or choosing from existing ones. Follows SOLID principles by separating
 * the presentation logic from business logic.
 */
export function LivingLabModeOptions({
  livingLabs,
  mode,
  onModeChange,
  selectedLabId = "",
  onLabSelect,
  isLoading = false,
  labels = {},
  hideCreate = false,
}: LivingLabModeOptionsProps) {
  const {
    select = "Select existing Living Lab",
    create = "Create new Living Lab",
    selectDropdown = "Select a Living Lab",
  } = labels;

  const handleLabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onLabSelect) {
      onLabSelect(e.target.value);
    }
  };

  return (
    <div className="space-y-4">
      {!hideCreate && (
        <div className="text-sm">
          <RadioGroup
            name="labMode"
            value={mode}
            onChange={(v) => onModeChange(v as LivingLabMode)}
            aria-label="Living lab mode"
            disabled={isLoading}
          >
            <RadioField>
              <Radio value="select" disabled={livingLabs.length === 0} />
              <Label>{select}</Label>
            </RadioField>

            <RadioField>
              <Radio value="create" />
              <Label>{create}</Label>
            </RadioField>
          </RadioGroup>
        </div>
      )}

      {mode === "select" && (
        <div>
          <label>{selectDropdown}</label>
          <Select
            value={selectedLabId}
            onChange={handleLabChange}
            disabled={isLoading}
          >
            <option value="">{selectDropdown}</option>
            {livingLabs.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
