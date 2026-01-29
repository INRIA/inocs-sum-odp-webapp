import React, { useState, useMemo } from "react";
import type {
  DataDashboardProps,
  KpiLivingLabsCardsFilter,
  ILabColorAssignment,
} from "./types";
import { KpiLivingLabsCards } from "./KpiLivingLabsCards";

// Predefined color palette for living labs (consistent across all charts)
const LAB_COLOR_PALETTE = [
  "#004494", // Primary blue
  "#98c33a", // Success green
  "#ff632f", // Warning orange
  "#9333ea", // Purple
  "#0891b2", // Cyan
  "#dc2626", // Red
  "#ca8a04", // Yellow
  "#16a34a", // Green
  "#2563eb", // Blue
  "#c026d3", // Fuchsia
  "#ea580c", // Orange
  "#0d9488", // Teal
  "#7c3aed", // Violet
  "#be123c", // Rose
  "#65a30d", // Lime
];

/**
 * Generate consistent color assignments for living labs
 */
function generateLabColors(
  labs: { id: string; name: string }[],
): ILabColorAssignment[] {
  return labs.map((lab, index) => ({
    labId: lab.id,
    labName: lab.name,
    color: LAB_COLOR_PALETTE[index % LAB_COLOR_PALETTE.length],
  }));
}

export const DataDashboard: React.FC<DataDashboardProps> = ({
  livingLabs,
  kpis,
  availableYears,
  categories,
}) => {
  // Generate consistent color assignments for all labs (defined once at parent level)
  const labColors = useMemo(
    () =>
      generateLabColors(
        livingLabs.map((lab) => ({ id: lab.id, name: lab.name })),
      ),
    [livingLabs],
  );

  // Create color lookup for filter UI
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    labColors.forEach((lc) => map.set(lc.labId, lc.color));
    return map;
  }, [labColors]);

  // Initialize filter with all labs and years selected
  const [filter, setFilter] = useState<KpiLivingLabsCardsFilter>({
    selectedLabIds: livingLabs.map((lab) => lab.id),
    selectedYears: availableYears,
    selectedCategoryIds: categories.map((cat) => cat.id),
  });

  // Toggle living lab selection
  const toggleLab = (labId: string) => {
    setFilter((prev) => {
      const isSelected = prev.selectedLabIds.includes(labId);
      if (isSelected && prev.selectedLabIds.length === 1) {
        // Keep at least one lab selected
        return prev;
      }
      return {
        ...prev,
        selectedLabIds: isSelected
          ? prev.selectedLabIds.filter((id) => id !== labId)
          : [...prev.selectedLabIds, labId],
      };
    });
  };

  // Toggle year selection
  const toggleYear = (year: number) => {
    setFilter((prev) => {
      const isSelected = prev.selectedYears.includes(year);
      if (isSelected && prev.selectedYears.length === 1) {
        // Keep at least one year selected
        return prev;
      }
      return {
        ...prev,
        selectedYears: isSelected
          ? prev.selectedYears.filter((y) => y !== year)
          : [...prev.selectedYears, year],
      };
    });
  };

  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    setFilter((prev) => {
      const isSelected = prev.selectedCategoryIds.includes(categoryId);
      if (isSelected && prev.selectedCategoryIds.length === 1) {
        // Keep at least one category selected
        return prev;
      }
      return {
        ...prev,
        selectedCategoryIds: isSelected
          ? prev.selectedCategoryIds.filter((id) => id !== categoryId)
          : [...prev.selectedCategoryIds, categoryId],
      };
    });
  };

  // Select/deselect all labs
  const toggleAllLabs = () => {
    setFilter((prev) => ({
      ...prev,
      selectedLabIds:
        prev.selectedLabIds.length === livingLabs.length
          ? [livingLabs[0].id] // Keep at least one
          : livingLabs.map((lab) => lab.id),
    }));
  };

  // Select/deselect all years
  const toggleAllYears = () => {
    setFilter((prev) => ({
      ...prev,
      selectedYears:
        prev.selectedYears.length === availableYears.length
          ? [availableYears[0]] // Keep at least one
          : [...availableYears],
    }));
  };

  // Select/deselect all categories
  const toggleAllCategories = () => {
    setFilter((prev) => ({
      ...prev,
      selectedCategoryIds:
        prev.selectedCategoryIds.length === categories.length
          ? [categories[0].id] // Keep at least one
          : categories.map((cat) => cat.id),
    }));
  };

  const allLabsSelected = filter.selectedLabIds.length === livingLabs.length;
  const allYearsSelected =
    filter.selectedYears.length === availableYears.length;
  const allCategoriesSelected =
    filter.selectedCategoryIds.length === categories.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

        {/* Living Labs Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Living Labs
            </label>
            <button
              onClick={toggleAllLabs}
              className="text-sm text-primary hover:underline"
            >
              {allLabsSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {livingLabs.map((lab) => {
              const isSelected = filter.selectedLabIds.includes(lab.id);
              const labColor = colorMap.get(lab.id) || "#6b7280";

              return (
                <button
                  key={lab.id}
                  onClick={() => toggleLab(lab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? "text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={{
                    backgroundColor: isSelected ? labColor : undefined,
                  }}
                >
                  {/* Color indicator dot (always visible) */}
                  <span
                    className={`w-3 h-3 rounded-full border-2 ${
                      isSelected ? "border-white/50" : "border-transparent"
                    }`}
                    style={{ backgroundColor: labColor }}
                  />
                  {lab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Years Filter */}
        {availableYears.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Years</label>
              <button
                onClick={toggleAllYears}
                className="text-sm text-primary hover:underline"
              >
                {allYearsSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter.selectedYears.includes(year)
                      ? "bg-gray-800 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories Filter */}
        {categories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                KPI Categories
              </label>
              <button
                onClick={toggleAllCategories}
                className="text-sm text-primary hover:underline"
              >
                {allCategoriesSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter.selectedCategoryIds.includes(category.id)
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filter.selectedLabIds.length} of {livingLabs.length} living
          labs • {filter.selectedCategoryIds.length} of {categories.length}{" "}
          categories
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Colors are consistent across all charts</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KpiLivingLabsCards
        livingLabs={livingLabs}
        kpis={kpis}
        filter={filter}
        labColors={labColors}
        categories={categories}
      />
    </div>
  );
};
