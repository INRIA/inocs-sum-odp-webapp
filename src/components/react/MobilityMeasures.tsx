import { formatDateToMonthYear, getUrl } from "../../lib/helpers";
import type { IProject } from "../../types";
import { Tooltip } from "./ui";
import { InfoCard } from "./ui/InfoCard";
import { Badge } from "./ui/Badge";
import { useState } from "react";

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
  smallText?: string;
  paragraph?: string;
  measures: IProject[];
  hideDescription?: boolean;
  cols?: 1 | 2 | 4;
  style?: "card" | "list";
};

function MeasureItem({
  m,
  style,
  hideDescription,
}: {
  m: IProject;
  style: "card" | "list";
  hideDescription?: boolean;
}) {
  const [labDetails, setLabDetails] = useState<{
    key: string;
    startDate?: string;
    description?: string;
  }>();
  const labs =
    m.living_lab_projects_implementation
      ?.map((impl) => ({
        key: `${m.id}-lab-${impl.lab?.name}`,
        labName: impl?.lab?.name,
        startDate: impl.start_at
          ? `Started by ${formatDateToMonthYear(impl.start_at)}`
          : undefined,
        description: impl.description,
      }))
      .filter((n) => n?.labName) ?? [];

  if (style === "list") {
    return (
      <div key={m.name} className="flex items-center space-x-2">
        {m.image_url ? (
          <img
            alt={m.name}
            src={getUrl(m.image_url)}
            className="h-6 w-6 flex-none rounded-full "
          />
        ) : null}

        <div>
          <div className="flex items-center ">
            {hideDescription && m.description ? (
              <Tooltip content={m.description} placement="top">
                <p>{m.name}</p>
              </Tooltip>
            ) : (
              <p>{m.name}</p>
            )}
          </div>
          {!hideDescription && m.description ? (
            <small className="mt-0 leading-0">{m.description}</small>
          ) : null}
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col">
        <InfoCard
          key={m.name}
          title={m.name}
          description={m.description ?? undefined}
          hideDescription={hideDescription}
          imageUrl={getUrl(m.image_url)}
        ></InfoCard>
        {labs.length > 0 && (
          <div
            className={`flex flex-col py-2 items-center space-x-2 rounded-lg border border-gray-300 bg-light shadow-xs cursor-pointer`}
          >
            <small className="text-center">Living Labs implementing</small>
            <div className={`flex flex-wrap gap-1 m-auto justify-center`}>
              {labs.map(({ key, labName, description, startDate }, idx) => (
                <Badge
                  key={key}
                  size="sm"
                  color={
                    !hideDescription && labDetails?.key === key
                      ? "secondary"
                      : "primary"
                  }
                  className="border !px-2"
                  inline={true}
                  onClick={() => {
                    !hideDescription &&
                      (description || startDate) &&
                      setLabDetails((prev) => {
                        const isOpen = prev?.key === key;
                        if (isOpen) {
                          return {};
                        } else {
                          return {
                            key,
                            startDate,
                            description,
                          };
                        }
                      });
                  }}
                >
                  {labName}{" "}
                  {!hideDescription && (description || startDate) ? "ⓘ" : null}
                </Badge>
              ))}
            </div>
            <div>
              {labDetails?.key &&
                (labDetails?.startDate || labDetails?.description) && (
                  <p className="m-2">
                    {labDetails?.startDate}
                    <br></br>
                    {labDetails?.description}
                  </p>
                )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export function MeasuresSection({
  heading,
  smallText,
  paragraph,
  measures = [],
  hideDescription = false,
  cols = 2,
  style = "card",
}: MeasuresSectionProps) {
  const GRID_CLASS = {
    1: "grid grid-cols-1 mx-1 lg:mx-4 gap-1",
    2: "grid grid-cols-2 lg:grid-cols-2 mx-1 lg:mx-4 gap-4",
    4: "grid grid-cols-2 lg:grid-cols-4 mx-1 lg:mx-4 gap-4",
  };

  return (
    <div className="flex-1 grid grid-cols-1 gap-4">
      {heading && <h3 className="text-center">{heading}</h3>}
      {smallText && (
        <small className="text-center italic min-h-10 lg:min-h-0">
          {smallText}
        </small>
      )}
      {paragraph && <p className="text-center">{paragraph}</p>}
      <div className={GRID_CLASS[cols]}>
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
  return (
    <div
      className={`flex flex-col gap-4 items-start my-4 mx-auto ${className}`}
    >
      <MeasuresSection
        heading="🔴 Push measures"
        smallText={`Push measures are restrictions designed to discourage private car use and reduce car dominance in urban environments.`}
        paragraph={``}
        measures={pushMeasures}
        hideDescription={hideDescription}
        cols={cols}
        style={style}
      />

      <MeasuresSection
        heading="🟢 Pull measures"
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
