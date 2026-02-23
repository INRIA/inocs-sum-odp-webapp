import { formatDateToMonthYear, getUrl } from "../../lib/helpers";
import type { IProject } from "../../types";
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  MapPinIcon,
} from "@heroicons/react/20/solid";
import type { ReactNode } from "react";
import { ExpansionPanel, Tooltip } from "./ui";
import { Badge } from "./ui/Badge";

type MobilityMeasuresProps = {
  pushMeasures?: IProject[];
  pullMeasures?: IProject[];
  className?: string;
  hideDescription?: boolean;
  cols?: 1 | 2 | 4;
  style?: "card" | "list";
};

type MeasuresSectionProps = {
  heading: string;
  headingIcon?: ReactNode;
  smallText?: string;
  paragraph?: string;
  measures: IProject[];
  hideDescription?: boolean;
  cols?: 1 | 2 | 4;
  style?: "card" | "list";
};

type LabInfo = {
  key: string;
  labName: string;
  startDate?: string;
  description?: string;
};

function getMeasureLabs(m: IProject): LabInfo[] {
  const rawLabs =
    m.living_lab_projects_implementation
      ?.map((impl) => ({
        key: `${m.id}-lab-${impl.lab?.name}`,
        labName: impl?.lab?.name,
        startDate: impl.start_at
          ? formatDateToMonthYear(impl.start_at)
          : undefined,
        description: impl.description,
      }))
      .filter((n) => n?.labName) ?? [];

  const uniqueByName = new Map<string, LabInfo>();
  for (const lab of rawLabs) {
    if (!lab.labName) continue;
    if (!uniqueByName.has(lab.labName)) {
      uniqueByName.set(lab.labName, {
        key: lab.key,
        labName: lab.labName,
        startDate: lab.startDate,
        description: lab.description ?? undefined,
      });
      continue;
    }

    const prev = uniqueByName.get(lab.labName)!;
    uniqueByName.set(lab.labName, {
      ...prev,
      startDate: prev.startDate ?? lab.startDate,
      description: prev.description ?? lab.description ?? undefined,
    });
  }

  return Array.from(uniqueByName.values());
}

function CityBadges({ labs }: { labs: LabInfo[] }) {
  if (labs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {labs.map((lab) => (
        <Badge
          key={lab.key}
          size="sm"
          color="light"
          className="border px-2!"
          inline={true}
          icon={<MapPinIcon className="h-3 w-3" />}
        >
          {lab.labName}
        </Badge>
      ))}
    </div>
  );
}

function MeasureItem({
  m,
  style,
  hideDescription,
}: {
  m: IProject;
  style: "card" | "list";
  hideDescription?: boolean;
}) {
  const labs = getMeasureLabs(m);
  const labsWithDetails = labs.filter((l) => l.startDate || l.description);
  const hasExpandableContent = labsWithDetails.length > 0;

  if (style === "list") {
    return (
      <div
        key={m.name}
        className="flex flex-col gap-2 border-b border-gray-200 py-2"
      >
        <div className="flex items-center">
          <div>
            {hideDescription && m.description ? (
              <Tooltip content={m.description} placement="top">
                <p className="font-bold text-primary">{m.name}</p>
              </Tooltip>
            ) : (
              <p className="font-bold text-primary">{m.name}</p>
            )}
            {!hideDescription && m.description ? (
              <p className="mt-0 block">{m.description}</p>
            ) : null}
          </div>
        </div>
        <CityBadges labs={labs} />
      </div>
    );
  } else {
    const header = (
      <div className="flex flex-row gap-2">
        {m.image_url ? (
          <img
            alt={m.name}
            src={getUrl(m.image_url)}
            className="h-10 w-10 flex-none rounded-full "
          />
        ) : null}
        <div className="flex flex-col gap-3 pr-2">
          <div>
            <p className="font-bold text-primary">{m.name}</p>
            {!hideDescription && m.description ? (
              <p className="mt-0.5 block">{m.description}</p>
            ) : null}
          </div>
          <CityBadges labs={labs} />
        </div>
      </div>
    );

    const content = hasExpandableContent ? (
      <div className="w-full py-2">
        {labsWithDetails.map((lab) => (
          <div
            key={`${lab.key}-details`}
            className="flex items-start justify-between gap-3 border-b border-gray-200 py-2 last:border-b-0"
          >
            <div className="w-5/6  flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-dark" />
              <div>
                <p className="font-bold">{lab.labName}</p>
                {lab.description ? <p>{lab.description}</p> : null}
              </div>
            </div>
            {lab.startDate ? (
              <p className="w-1/6 whitespace-nowrap text-gray-500 text-end">
                Since: {lab.startDate}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    ) : null;

    return (
      <div className="lg:w-5xl flex flex-col rounded-lg border border-gray-200 bg-light p-2 md:px-4">
        <ExpansionPanel
          header={header}
          content={content}
          arrow={hasExpandableContent}
          open={false}
        />
      </div>
    );
  }
}

export function MeasuresSection({
  heading,
  headingIcon,
  smallText,
  paragraph,
  measures = [],
  hideDescription = false,
  cols = 2,
  style = "card",
}: MeasuresSectionProps) {
  const GRID_CLASS = {
    1: "grid grid-cols-1 gap-1",
    2: "grid grid-cols-2 lg:grid-cols-2 gap-4",
    4: "grid grid-cols-2 lg:grid-cols-4 gap-4",
  };

  const measuresLayoutClass =
    style === "card" ? "grid grid-cols-1 gap-3" : GRID_CLASS[cols];

  return (
    <div className="flex-1 grid grid-cols-1 gap-4">
      {heading && (
        <div className="flex items-center gap-2">
          {headingIcon ? (
            <span className="h-8 w-8 shrink-0">{headingIcon}</span>
          ) : null}
          <h3>{heading}</h3>
        </div>
      )}
      {smallText && <p>{smallText}</p>}
      {paragraph && <p>{paragraph}</p>}
      <div className={measuresLayoutClass}>
        {measures.map((m) => (
          <MeasureItem
            key={m.name}
            m={m}
            style={style}
            hideDescription={hideDescription}
          />
        ))}
      </div>
    </div>
  );
}

export function MobilityMeasures({
  pushMeasures = [],
  pullMeasures = [],
  className = "",
  hideDescription = false,
  cols = 2,
  style = "card",
}: MobilityMeasuresProps) {
  const pushIcon = (
    <ArrowRightCircleIcon className="h-8 w-8 text-dark" aria-hidden="true" />
  );
  const pullIcon = (
    <ArrowLeftCircleIcon className="h-8 w-8 text-dark" aria-hidden="true" />
  );

  return (
    <div
      className={`w-full flex flex-col gap-4 items-center my-4 mx-auto ${className}`}
    >
      <MeasuresSection
        heading="Push measures"
        headingIcon={pushIcon}
        smallText={`Push measures are restrictions designed to discourage private car use and reduce car dominance in urban environments.`}
        paragraph={``}
        measures={pushMeasures}
        hideDescription={hideDescription}
        cols={cols}
        style={style}
      />

      <MeasuresSection
        heading="Pull measures"
        headingIcon={pullIcon}
        smallText={`Pull measures are incentives and improvements that make shared mobility and public transport more attractive and accessible.`}
        paragraph={``}
        measures={pullMeasures}
        hideDescription={hideDescription}
        cols={cols}
        style={style}
      />
    </div>
  );
}
