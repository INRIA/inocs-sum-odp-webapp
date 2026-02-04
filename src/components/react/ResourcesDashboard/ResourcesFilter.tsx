import type { ResourcesFilterProps } from "./types";

export function ResourcesFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
}: ResourcesFilterProps) {
  if (categories.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={selectedCategoryId === null}
        onClick={() => onCategoryChange(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          selectedCategoryId === null
            ? "bg-primary text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-pressed={selectedCategoryId === category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategoryId === category.id
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
