import { Badge } from "../../react-catalyst-ui-kit";

type TimelineStep = {
  stepLabel: string;
  title: string;
  description?: string;
  footnote?: string;
};

export type TimelineProps = {
  steps: TimelineStep[];
  className?: string;
};

export function Timeline({ steps = [], className = "" }: TimelineProps) {
  return (
    <ol className="items-start sm:flex text-left">
      {steps.map(({ stepLabel, title, description, footnote }, index) => (
        <li key={`${title}`} className="relative mb-6 sm:mb-0 pl-4">
          <div className="flex items-center">
            <Badge color="orange">{stepLabel}</Badge>
            <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700" />
          </div>

          <div className="mt-3">
            <h5>{title}</h5>
            <small>{description}</small>
            <br></br>
            {footnote && <small className="font-bold italic">{footnote}</small>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default Timeline;
