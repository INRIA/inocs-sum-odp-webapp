import { getUrl } from "../../lib/helpers";
import type { IMeasure } from "../../types";
import { Tooltip } from "./ui";
import { InfoCard } from "./ui/InfoCard";

type MobilityMeasuresProps = {
  pushMeasures?: IMeasure[];
  pullMeasures?: IMeasure[];
  className?: string;
  hideDescription?: boolean;
  cols?: 1 | 2 | 4;
  style?: "card" | "list";
};

type MeasuresSectionProps = {
  heading: string;
  smallText?: string;
  paragraph?: string;
  measures: IMeasure[];
  hideDescription?: boolean;
  cols?: 1 | 2 | 4;
  style?: "card" | "list";
};

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

  const getRenderItem = (m: IMeasure) => {
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
        <InfoCard
          key={m.name}
          title={m.name}
          description={hideDescription ? undefined : m.description}
          tooltip={hideDescription ? m.description : undefined}
          imageUrl={getUrl(m.image_url)}
          href="#"
        />
      );
    }
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
        {measures.map((m) => getRenderItem(m))}
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
