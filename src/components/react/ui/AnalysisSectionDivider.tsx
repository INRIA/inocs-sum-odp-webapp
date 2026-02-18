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
    <div className="rounded-lg p-2 lg:p-4">
      <div className="flex items-start gap-2">
        <div className="mt-1 flex items-center justify-center w-6 h-6 bg-info text-white rounded-full font-bold text-xl flex-shrink-0">
          {step}
        </div>
        <div className="flex flex-col">
          <h4 className="text-2xl font-bold text-gray-900 content-center">
            {title}
          </h4>
          <p className="justify-center content-center">
            {subtitle && (
              <strong>
                {subtitle} <br />
              </strong>
            )}

            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
