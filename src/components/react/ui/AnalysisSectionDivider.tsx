interface AnalysisSectionDividerProps {
  step: number;
  title: string;
  subtitle?: string;
  description?: string;
}
export function AnalysisSectionDivider({
  step,
  title,
  subtitle,
  description,
}: AnalysisSectionDividerProps) {
  return (
    <div className="bg-info/20 border border-info rounded-lg p-2 lg:p-4">
      <div className="flex items-start gap-2 lg:gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-info text-white rounded-full font-bold text-xl flex-shrink-0">
          {step}
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-900 content-center">{title}</h2>
          <p className="justify-center content-center">
            <strong>{subtitle}</strong>
            <br />
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
