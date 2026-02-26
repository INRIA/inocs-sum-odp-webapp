import React, { useState, useCallback, useMemo } from "react";
import { XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";
import type {
  ILivingLabKpiData,
  KpiLivingLabsCardsFilter,
} from "../KPIsDashboard/types";
import type { ICategory } from "../../../types/Category";
import type { IProject } from "../../../types/Project";
import { RButton } from ".";

/**
 * Props for DataDashboardFilter component
 */
export interface DataDashboardFilterProps {
  /** Array of living labs to filter */
  livingLabs?: ILivingLabKpiData[];
  /** Available years to filter */
  availableYears?: number[];
  /** Categories to filter */
  categories?: ICategory[];
  /** Projects to filter */
  projects?: IProject[];
  /** Tags to filter */
  tags?: { id: number; name: string; color: string }[];
  /** Current filter state */
  filter: KpiLivingLabsCardsFilter;
  /** Callback when filter changes */
  onFilterChange: (filter: KpiLivingLabsCardsFilter) => void;
  /** Optional controlled open state - when provided, component becomes controlled */
  isOpen?: boolean;
  /** Optional callback when open state changes - useful for external control */
  onOpenChange?: (isOpen: boolean) => void;
  /** Optional children to render below filter sections */
  children?: React.ReactNode;
}

/**
 * Props for a single filter section
 */
interface FilterSectionProps<T> {
  label: string;
  items: T[];
  selectedItems: number[];
  getItemId: (item: T) => number;
  getItemLabel: (item: T) => string;
  onToggleItem: (id: number) => void;
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
              className={`text-start px-3 py-1.5 rounded-2xl text-sm font-medium transition-all ${
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
 *
 * Supports both controlled and uncontrolled modes for the open/close state:
 * - Uncontrolled: Component manages its own isOpen state internally
 * - Controlled: Pass isOpen and onOpenChange props to control externally
 */
export const DataDashboardFilter: React.FC<DataDashboardFilterProps> = ({
  livingLabs = [],
  availableYears = [],
  categories = [],
  projects = [],
  tags = [],
  filter,
  onFilterChange,
  isOpen: controlledIsOpen,
  onOpenChange,
  children,
}) => {
  // Internal state for uncontrolled mode
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Determine if we're in controlled mode
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Memoized toggle handler to prevent unnecessary re-renders
  const handleToggle = useCallback(() => {
    const newIsOpen = !isOpen;
    if (!isControlled) {
      setInternalIsOpen(newIsOpen);
    }
    onOpenChange?.(newIsOpen);
  }, [isOpen, isControlled, onOpenChange]);

  // Memoized close handler
  const handleClose = useCallback(() => {
    if (!isControlled) {
      setInternalIsOpen(false);
    }
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  // Memoized toggle handler factory
  const createToggleHandler = useCallback(
    <T extends number>(
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
    },
    [],
  );

  // Memoized toggle all handler factory
  const createToggleAllHandler = useCallback(
    <T extends number>(
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
    },
    [],
  );

  // Memoized selected items with defaults
  const selectedLabIds = useMemo<number[]>(
    () =>
      (filter.selectedLabIds ?? [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    [filter.selectedLabIds],
  );
  const selectedYears = useMemo(
    () => filter.selectedYears ?? [],
    [filter.selectedYears],
  );
  const selectedCategoryIds = useMemo(
    () => filter.selectedCategoryIds ?? [],
    [filter.selectedCategoryIds],
  );
  const selectedProjectIds = useMemo(
    () => filter.selectedProjectIds ?? [],
    [filter.selectedProjectIds],
  );
  const selectedTagIds = useMemo(
    () => filter.selectedTagIds ?? [],
    [filter.selectedTagIds],
  );

  // Lab handlers
  const toggleLab = createToggleHandler(selectedLabIds, (newSelection) =>
    onFilterChange({ ...filter, selectedLabIds: newSelection }),
  );
  const toggleAllLabs = createToggleAllHandler(
    selectedLabIds,
    livingLabs.map((lab) => lab.id),
    (newSelection) =>
      onFilterChange({ ...filter, selectedLabIds: newSelection }),
  );

  // Year handlers
  const toggleYear = createToggleHandler(selectedYears, (newSelection) =>
    onFilterChange({ ...filter, selectedYears: newSelection }),
  );
  const toggleAllYears = createToggleAllHandler(
    selectedYears,
    availableYears,
    (newSelection) =>
      onFilterChange({ ...filter, selectedYears: newSelection }),
  );

  // Category handlers
  const toggleCategory = createToggleHandler(
    selectedCategoryIds,
    (newSelection) =>
      onFilterChange({ ...filter, selectedCategoryIds: newSelection }),
  );
  const toggleAllCategories = createToggleAllHandler(
    selectedCategoryIds,
    categories.map((cat) => cat.id),
    (newSelection) =>
      onFilterChange({ ...filter, selectedCategoryIds: newSelection }),
  );

  // Project handlers
  const toggleProject = createToggleHandler(
    selectedProjectIds,
    (newSelection) =>
      onFilterChange({ ...filter, selectedProjectIds: newSelection }),
  );
  const toggleAllProjects = createToggleAllHandler(
    selectedProjectIds,
    projects.map((p) => p.id),
    (newSelection) =>
      onFilterChange({ ...filter, selectedProjectIds: newSelection }),
  );

  // Tag handlers
  const toggleTag = createToggleHandler(selectedTagIds, (newSelection) =>
    onFilterChange({ ...filter, selectedTagIds: newSelection }),
  );
  const toggleAllTags = createToggleAllHandler(
    selectedTagIds,
    tags.map((t) => t.id),
    (newSelection) =>
      onFilterChange({ ...filter, selectedTagIds: newSelection }),
  );

  const hasNoData =
    livingLabs.length === 0 &&
    availableYears.length === 0 &&
    categories.length === 0 &&
    projects.length === 0 &&
    tags.length === 0;

  return (
    <section id="data-dashboard-filters">
      {/* Toggle Button - always visible */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <RButton
          variant="link"
          onClick={handleToggle}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={isOpen ? "Hide filters" : "Show filters"}
          aria-expanded={isOpen}
        >
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <p>{isOpen ? "Hide Filters" : "Show Filters"}</p>
        </RButton>
      </div>

      {/* Filter Panel - conditionally rendered */}
      {isOpen && (
        <div
          className="fixed top-20 right-4 z-40 w-[calc(100%-2rem)] sm:w-80 transition-all duration-300"
          style={{ maxHeight: "calc(100vh - 6rem)" }}
        >
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 6rem)" }}
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col gap-y-2">
              <div className="flex items-center justify-between">
                <h4 className="m-0">Filters</h4>
                <button
                  onClick={handleClose}
                  className="flex p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close filters"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <FilterSection
                label="Living Labs"
                items={livingLabs}
                selectedItems={selectedLabIds}
                getItemId={(lab) => lab.id}
                getItemLabel={(lab) => lab.name}
                onToggleItem={(id) => toggleLab(id)}
                onToggleAll={toggleAllLabs}
                allSelected={selectedLabIds.length === livingLabs.length}
              />

              <FilterSection
                label="Years"
                items={availableYears}
                selectedItems={selectedYears}
                getItemId={(year) => year}
                getItemLabel={(year) => String(year)}
                onToggleItem={(id) => toggleYear(id)}
                onToggleAll={toggleAllYears}
                allSelected={selectedYears.length === availableYears.length}
              />

              <FilterSection
                label="Type of resource"
                items={categories}
                selectedItems={selectedCategoryIds}
                getItemId={(cat) => cat.id}
                getItemLabel={(cat) => cat.name}
                onToggleItem={(id) => toggleCategory(id)}
                onToggleAll={toggleAllCategories}
                allSelected={selectedCategoryIds.length === categories.length}
              />

              <FilterSection
                label="Policy measure"
                items={projects}
                selectedItems={selectedProjectIds}
                getItemId={(p) => p.id}
                getItemLabel={(p) => p.name}
                onToggleItem={(id) => toggleProject(id)}
                onToggleAll={toggleAllProjects}
                allSelected={selectedProjectIds.length === projects.length}
              />

              <FilterSection
                label="Keywords"
                items={tags}
                selectedItems={selectedTagIds}
                getItemId={(t) => t.id}
                getItemLabel={(t) => t.name}
                onToggleItem={(id) => toggleTag(id)}
                onToggleAll={toggleAllTags}
                allSelected={selectedTagIds.length === tags.length}
              />

              {hasNoData && (
                <p className="text-sm text-gray-500">
                  Not enough data available
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </section>
  );
};
