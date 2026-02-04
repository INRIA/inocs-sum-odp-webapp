import type { ResourcesCategoryGroupProps } from "./types";
import { ResourceCard } from "./ResourceCard";

export function ResourcesCategoryGroup({
  categoryName,
  resources,
}: ResourcesCategoryGroupProps) {
  if (resources.length === 0) {
    return <></>;
  }

  return (
    <section aria-label={categoryName} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{categoryName}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}
