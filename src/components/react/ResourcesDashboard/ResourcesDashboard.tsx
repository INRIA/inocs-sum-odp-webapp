import { useState, useMemo, useCallback } from "react";
import type { ResourcesDashboardProps } from "./types";
import { ResourcesMetrics } from "./ResourcesMetrics";
import { ResourcesCategoryGroup } from "./ResourcesCategoryGroup";
import { DataDashboardFilter } from "../ui/DataDashboardFilter";
import type { IResourceCategory, IResource } from "../../../types";
import type { KpiLivingLabsCardsFilter } from "../KPIsDashboard/types";
import { PageNavigation } from "../ui/PageNavigation";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  FunnelIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

const filterResourcesByProjectAndTags = (
  resources: IResource[],
  selectedProjectIds: number[] | undefined,
  selectedTagIds: number[] | undefined,
): IResource[] => {
  return resources.filter((resource) => {
    const hasProjectFilter =
      selectedProjectIds && selectedProjectIds.length > 0;
    const resourceHasProject = resource.project?.id !== undefined;

    if (hasProjectFilter && resourceHasProject) {
      if (!selectedProjectIds.includes(resource.project!.id)) {
        return false;
      }
    }

    const hasTagFilter = selectedTagIds && selectedTagIds.length > 0;
    const resourceHasTags = resource.item_tag && resource.item_tag.length > 0;

    if (hasTagFilter && resourceHasTags) {
      const resourceTagIds = resource.item_tag!.map((t) => t.tag_id);
      const hasMatchingTag = resourceTagIds.some((tagId) =>
        selectedTagIds.includes(tagId),
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });
};

const filterCategoriesByFilter = (
  categories: IResourceCategory[],
  filter: KpiLivingLabsCardsFilter,
): IResourceCategory[] => {
  return categories
    .map((category) => ({
      ...category,
      resources: filterResourcesByProjectAndTags(
        category.resources,
        filter.selectedProjectIds,
        filter.selectedTagIds,
      ),
    }))
    .filter((category) => {
      if (filter.selectedCategoryIds && filter.selectedCategoryIds.length > 0) {
        return filter.selectedCategoryIds.includes(category.id);
      }
      return true;
    });
};

export function ResourcesDashboard({
  categories = [],
  projects = [],
  tags = [],
}: ResourcesDashboardProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const initialFilter = useMemo(
    () => ({
      selectedCategoryIds: categories.map((c) => c.id),
      selectedProjectIds: projects.map((p) => p.id),
      selectedTagIds: tags.map((t) => t.id),
    }),
    [categories, projects, tags],
  );

  const [filter, setFilter] = useState<KpiLivingLabsCardsFilter>(initialFilter);

  const handleNavigationToggle = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
  }, []);

  const navigationSections = useMemo(
    () => [
      {
        id: "resources-dashboard-filters",
        label: "Filters",
        icon: <FunnelIcon className="w-5 h-5 md:w-8 md:h-8" />,
        onClick: handleNavigationToggle,
      },
      {
        id: "resources-dashboard-top",
        label: "Top of page",
        icon: <ArrowUpCircleIcon className="w-5 h-5 md:w-8 md:h-8" />,
      },
      {
        id: "resources-dashboard-data-start",
        label: "Data section",
        icon: <PresentationChartLineIcon className="w-5 h-5 md:w-8 md:h-8" />,
      },
      {
        id: "resources-dashboard-end",
        label: "Bottom of page",
        icon: <ArrowDownCircleIcon className="w-5 h-5 md:w-8 md:h-8" />,
      },
    ],
    [handleNavigationToggle],
  );

  const filteredCategories = useMemo(
    () => filterCategoriesByFilter(categories, filter),
    [categories, filter],
  );

  if (categories.length === 0) {
    return <div>Coming soon</div>;
  }

  return (
    <>
      <section className="space-y-6" id="resources-dashboard-top">
        <div className="flex flex-row justify-between">
          <ResourcesMetrics categories={categories} />
          <DataDashboardFilter
            categories={categories}
            projects={projects}
            tags={tags}
            filter={filter}
            onFilterChange={setFilter}
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
          />
        </div>
        <div className="space-y-8" id="resources-dashboard-data-start">
          {filteredCategories.map((category) => (
            <ResourcesCategoryGroup
              key={category.id}
              categoryName={category.name}
              resources={category.resources}
            />
          ))}
        </div>

        <PageNavigation
          sections={navigationSections}
          disclaimer="The information presented is based on data provided directly by the participating living labs. While the platform makes this data accessible and comparable, each living lab remains responsible for the accuracy, completeness, and interpretation of the data it reports."
        />
      </section>
      <section id="resources-dashboard-end" />
    </>
  );
}
