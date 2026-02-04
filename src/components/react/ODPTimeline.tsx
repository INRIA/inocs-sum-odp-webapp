import { Timeline, type TimelineProps } from "./ui";

type ODPTimelineProps = {
  steps?: TimelineProps["steps"];
  className?: string;
};

const defaultSteps = [
  {
    stepLabel: "Before",
    title: "Baseline Survey",
    description:
      "We start by collecting baseline mobility KPIs in each Living Lab before any interventions are applied. This includes modal share, user preferences, and transport accessibility data.",
    footnote: "Output: Initial KPI dataset",
  },
  {
    stepLabel: "During",
    title: "Measures Implementation",
    description:
      "Each Living Lab implements push and pull measures. During this period, the ODP continuously gathers data on shared mobility usage and mobility infrastructure.",
    footnote: "Output: Intervention logs, updated KPIs",
  },
  {
    stepLabel: "After",
    title: "Follow-up Survey",
    description:
      "A second round of data collection measures changes in KPIs after interventions, assessing shifts in mobility behaviors and user feedback.",
    footnote: "Output: Post-intervention KPI dataset",
  },
  {
    stepLabel: "Reporting",
    title: "Insights and impact",
    description:
      "The ODP compares results across cities and KPIs, visualizes outcomes, and offers impact models and decision tools for planners and stakeholders.",
    footnote: "Output: Dashboards, Decision Tools",
  },
];

export function ODPTimeline({
  steps = defaultSteps,
  className = "",
}: ODPTimelineProps) {
  return (
    <section className={`bg-white py-16 px-1  ${className}`}>
      <div className="mx-auto flex flex-col gap-4">
        <ol className="items-start sm:flex text-left">
          <Timeline steps={steps}></Timeline>
        </ol>
      </div>
    </section>
  );
}

export default Timeline;
