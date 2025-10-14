import type { IProject } from "../../types";
import { LivingLabMeasureForm } from "./form/LivingLabMeasureForm";

type LivingLabMeasuresProps = {
  livingLabId: string;
  title: string;
  measures?: IProject[];
  selectedMeasureIds?: string[];
  className?: string;
};

export function LivingLabMeasures({
  livingLabId,
  measures = [],
  selectedMeasureIds = [],
  title = "Measures",
  className = "",
}: LivingLabMeasuresProps) {
  return (
    <div
      className={`flex flex-col gap-4 items-start my-4 mx-auto ${className}`}
    >
      <div className="flex-1 grid grid-cols-1 gap-4">
        <h4 className="text-center">{title}</h4>
        <div className="grid grid-cols-2 lg:grid-cols-2 mx-1 lg:mx-4 gap-4">
          {measures.map((m) => (
            <LivingLabMeasureForm
              livingLabId={livingLabId}
              key={m.name}
              measure={m}
              disabled={true}
              initialChecked={selectedMeasureIds.includes(m.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
