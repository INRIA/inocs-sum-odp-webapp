import React, { useState } from "react";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";
import { Badge, type BadgeColor } from "../ui";

interface ChipSelectorProps {
  availableItems: string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
  onAddCustom: (item: string) => void;
  availableLabel: string;
  selectedCountBadgeColor?: BadgeColor;
  customInputPlaceholder: string;
  addButtonLabel: string;
  disabled?: boolean;
}

const normalize = (value: string): string => value.trim().replace(/\s+/g, " ");

export const ChipSelector: React.FC<ChipSelectorProps> = ({
  availableItems,
  selectedItems,
  onToggle,
  onAddCustom,
  availableLabel,
  selectedCountBadgeColor = "info",
  customInputPlaceholder,
  addButtonLabel,
  disabled = false,
}) => {
  const [customValue, setCustomValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAddCustom = () => {
    const normalizedValue = normalize(customValue);
    if (!normalizedValue) {
      setInputError("Please enter a name before adding.");
      return;
    }

    if (normalizedValue.length > 80) {
      setInputError("Please keep names under 80 characters.");
      return;
    }

    const alreadyExists = availableItems.some(
      (item) => item.toLowerCase() === normalizedValue.toLowerCase(),
    );

    if (alreadyExists) {
      setInputError("This entry already exists.");
      return;
    }

    setInputError(null);
    onAddCustom(normalizedValue);
    setCustomValue("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-dark">{availableLabel}</p>
          <Badge
            color={selectedCountBadgeColor}
            size="sm"
            aria-label={`${selectedItems.length} selected`}
          >
            {selectedItems.length} selected
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableItems.map((item) => {
            const isSelected = selectedItems.includes(item);
            return (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(item)}
                aria-label={isSelected ? `Remove ${item}` : undefined}
                className={`rounded-xl border px-4 py-2 text-base font-medium transition-colors ${
                  isSelected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-light bg-white text-dark hover:border-dark/40"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Input
            type="text"
            value={customValue}
            disabled={disabled}
            placeholder={customInputPlaceholder}
            aria-label={customInputPlaceholder}
            onChange={(event) => {
              setCustomValue(event.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddCustom();
              }
            }}
          />
          {inputError && (
            <p className="mt-1 text-sm text-danger" role="alert">
              {inputError}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={handleAddCustom}
          className="my-auto inline-flex h-7 w-7 items-center justify-center rounded-xl bg-secondary px-2 text-xl leading-none text-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={addButtonLabel}
        >
          +
        </button>
      </div>
    </div>
  );
};
