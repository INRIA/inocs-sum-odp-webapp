import type { ResourcesMetricsProps } from "./types";

export function ResourcesMetrics({
  categories,
}: ResourcesMetricsProps) {
  if (categories.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
      {categories.map((category, index) => {
        const count = category.resources.length;
        const label = count === 1 ? "resource" : "resources";
        return (
          <span key={category.id}>
            {count} {category.name} {label}
            {index < categories.length - 1 && " - "}
          </span>
        );
      })}
    </div>
  );
}
