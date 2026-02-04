import { useState } from "react";
import type { ResourcesDashboardProps } from "./types";
import { ResourcesMetrics } from "./ResourcesMetrics";
import { ResourcesFilter } from "./ResourcesFilter";
import { ResourcesCategoryGroup } from "./ResourcesCategoryGroup";
import type { IResourceCategory } from "../../../types";

export function ResourcesDashboard({ categories }: ResourcesDashboardProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  if (categories.length === 0) {
    return <div>Coming soon</div>;
  }

  const filteredCategories: IResourceCategory[] =
    selectedCategoryId === null
      ? categories
      : categories.filter((cat) => cat.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <ResourcesMetrics categories={categories} />
      <ResourcesFilter
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
      />
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <ResourcesCategoryGroup
            key={category.id}
            categoryName={category.name}
            resources={category.resources}
          />
        ))}
      </div>
    </div>
  );
}
