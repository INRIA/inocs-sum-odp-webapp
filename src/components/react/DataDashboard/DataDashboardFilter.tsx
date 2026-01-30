import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ILivingLabKpiData, KpiLivingLabsCardsFilter } from "./types";
import type { ICategory } from "../../../types/Category";

/**
 * Props for DataDashboardFilter component
 */
export interface DataDashboardFilterProps {
  /** Array of living labs to filter */
  livingLabs: ILivingLabKpiData[];
  /** Available years to filter */
  availableYears: number[];
  /** Categories to filter */
  categories: ICategory[];
  /** Current filter state */
  filter: KpiLivingLabsCardsFilter;
  /** Callback when filter changes */
  onFilterChange: (filter: KpiLivingLabsCardsFilter) => void;
  /** Optional callback to close the filter panel (desktop only) */
  onClose?: () => void;
}

/**
 * Props for a single filter section
 */
interface FilterSectionProps<T> {
  label: string;
  items: T[];
  selectedItems: (string | number)[];
  getItemId: (item: T) => string | number;
  getItemLabel: (item: T) => string;
  onToggleItem: (id: string | number) => void;
  onToggleAll: () => void;
  allSelected: boolean;
}

/**
 * Reusable filter section component
 */
function FilterSection<T>({
  label,
  items,
  selectedItems,
  getItemId,
  getItemLabel,
  onToggleItem,
  onToggleAll,
  allSelected,
}: FilterSectionProps<T>) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button
          onClick={onToggleAll}
          className="text-sm text-primary hover:underline"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const id = getItemId(item);
          const isSelected = selectedItems.includes(id);

          return (
            <button
              key={String(id)}
              onClick={() => onToggleItem(id)}
              className={`px-3 py-1.5 rounded-2xl text-sm font-medium transition-all ${
                isSelected
                  ? "bg-dark text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {getItemLabel(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * DataDashboardFilter - Filter component for the Data Dashboard
 *
 * Single Responsibility: Manages filter UI and state changes for living labs, years, and categories.
 * Emits filter changes via onFilterChange callback.
 */
export const DataDashboardFilter: React.FC<DataDashboardFilterProps> = ({
  livingLabs,
  availableYears,
  categories,
  filter,
  onFilterChange,
  onClose,
  children,
}) => {
  // Toggle handlers that maintain at least one selection
  const createToggleHandler = <T extends string | number>(
    currentSelection: T[],
    updateFilter: (newSelection: T[]) => void,
  ) => {
    return (id: T) => {
      const isSelected = currentSelection.includes(id);
      if (isSelected && currentSelection.length === 1) {
        return; // Keep at least one selected
      }
      updateFilter(
        isSelected
          ? currentSelection.filter((item) => item !== id)
          : [...currentSelection, id],
      );
    };
  };

  // Toggle all handlers
  const createToggleAllHandler = <T extends string | number>(
    currentSelection: T[],
    allItems: T[],
    updateFilter: (newSelection: T[]) => void,
  ) => {
    return () => {
      updateFilter(
        currentSelection.length === allItems.length
          ? [allItems[0]] // Keep at least one
          : [...allItems],
      );
    };
  };

  // Lab handlers
  const toggleLab = createToggleHandler(filter.selectedLabIds, (newSelection) =>
    onFilterChange({ ...filter, selectedLabIds: newSelection }),
  );
  const toggleAllLabs = createToggleAllHandler(
    filter.selectedLabIds,
    livingLabs.map((lab) => lab.id),
    (newSelection) =>
      onFilterChange({ ...filter, selectedLabIds: newSelection }),
  );

  // Year handlers
  const toggleYear = createToggleHandler(filter.selectedYears, (newSelection) =>
    onFilterChange({ ...filter, selectedYears: newSelection }),
  );
  const toggleAllYears = createToggleAllHandler(
    filter.selectedYears,
    availableYears,
    (newSelection) =>
      onFilterChange({ ...filter, selectedYears: newSelection }),
  );

  // Category handlers
  const toggleCategory = createToggleHandler(
    filter.selectedCategoryIds,
    (newSelection) =>
      onFilterChange({ ...filter, selectedCategoryIds: newSelection }),
  );
  const toggleAllCategories = createToggleAllHandler(
    filter.selectedCategoryIds,
    categories.map((cat) => cat.id),
    (newSelection) =>
      onFilterChange({ ...filter, selectedCategoryIds: newSelection }),
  );

  return (
    <section id="data-dashboard-filters">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <h4 className="m-0">Filters</h4>
          {onClose && (
            <button
              onClick={onClose}
              className="flex p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close filters"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <FilterSection
          label="Living Labs"
          items={livingLabs}
          selectedItems={filter.selectedLabIds}
          getItemId={(lab) => lab.id}
          getItemLabel={(lab) => lab.name}
          onToggleItem={(id) => toggleLab(id as string)}
          onToggleAll={toggleAllLabs}
          allSelected={filter.selectedLabIds.length === livingLabs.length}
        />

        <FilterSection
          label="Years"
          items={availableYears}
          selectedItems={filter.selectedYears}
          getItemId={(year) => year}
          getItemLabel={(year) => String(year)}
          onToggleItem={(id) => toggleYear(id as number)}
          onToggleAll={toggleAllYears}
          allSelected={filter.selectedYears.length === availableYears.length}
        />

        <FilterSection
          label="KPI Categories"
          items={categories}
          selectedItems={filter.selectedCategoryIds}
          getItemId={(cat) => cat.id}
          getItemLabel={(cat) => cat.name}
          onToggleItem={(id) => toggleCategory(id as number)}
          onToggleAll={toggleAllCategories}
          allSelected={filter.selectedCategoryIds.length === categories.length}
        />
      </div>
      {children}
    </section>
  );
};
