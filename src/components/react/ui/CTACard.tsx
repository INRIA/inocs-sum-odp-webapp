import {
  ArrowRightIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  ChartBarSquareIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ScaleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { RButton } from ".";

type Props = {
  id: string;
  title: string;
  description: string;
  completed?: boolean;
  inProgress?: boolean;
  locked?: boolean;
  cta: string;
  href?: string;
  onAction?: (id: string) => void;
  className?: string;
  iconVariant?: "chart" | "pie" | "checklist" | "trending" | "scale" | "tools";
};

export function CTACard({
  id,
  title,
  description,
  completed,
  inProgress,
  locked,
  cta,
  href,
  onAction,
  className,
  iconVariant,
}: Props) {
  const onClick = () => {
    if (!locked) {
      if (href) {
        window.location.href = href;
      }
      onAction?.(id);
    }
  };

  const icon = (() => {
    switch (iconVariant) {
      case "chart":
        return <PresentationChartLineIcon className="w-8 h-8 text-primary" />;
      case "pie":
        return <ChartPieIcon className="w-8 h-8 text-primary" />;
      case "checklist":
        return <ClipboardDocumentCheckIcon className="w-8 h-8 text-primary" />;
      case "trending":
        return <ArrowTrendingUpIcon className="w-8 h-8 text-primary" />;
      case "scale":
        return <ScaleIcon className="w-8 h-8 text-primary" />;
      case "tools":
        return <WrenchScrewdriverIcon className="w-8 h-8 text-primary" />;
      default:
        return null;
    }
  })();
  return (
    <div
      className={`scale-95 hover:scale-100 hover:shadow-lg text-start flex flex-col gap-4 rounded-lg border p-4 lg:p-6 relative transition-all duration-200 ${
        completed
          ? " border-success cursor-pointer"
          : locked
            ? "bg-light/30 border-dark cursor-not-allowed"
            : "border-warning cursor-pointer"
      } ${className}`}
      onClick={onClick}
    >
      <div className="bg-primary/10 rounded-xl p-2 w-12 h-12 flex items-center justify-center">
        {icon}
      </div>
      <h4 className="text-primary">{title}</h4>
      <p className="text-sm text-gray-600 whitespace-pre-line">
        {description.replace(/\\/g, "\n")}
      </p>

      <RButton
        href={href}
        variant="link"
        disabled={locked}
        onClick={() => !locked && onAction?.(id)}
        className="w-full text-start"
      >
        {cta} <ArrowRightIcon className="inline-block ml-1 h-4 w-4" />
      </RButton>

      {completed && (
        <span className="absolute top-1 lg:top-4 right-1 lg:right-4 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/30 text-success">
          ✅ Completed
        </span>
      )}
      {inProgress && (
        <span className="absolute  top-1 lg:top-4 right-1 lg:right-4 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/30 text-warning">
          ⏳ In Progress
        </span>
      )}
    </div>
  );
}

export default CTACard;
