import type {
  IProject,
  LivingLabProjectsImplementationInput,
} from "../../types";
import { LivingLabMeasureForm } from "./form/LivingLabMeasureForm";

type LivingLabMeasuresProps = {
  livingLabId: string;
  title: string;
  measures?: IProject[];
  implementedMeasures?: LivingLabProjectsImplementationInput[];
  className?: string;
  measuresGrids?: number;
  isEditable?: boolean;
};

export function LivingLabMeasures({
  livingLabId,
  measures = [],
  implementedMeasures = [],
  title = "Measures",
  className = "",
  measuresGrids = 2,
  isEditable = false,
}: LivingLabMeasuresProps) {
  return (
    <div
      className={`flex flex-col gap-4 items-start my-4 mx-auto ${className}`}
    >
      <div className="flex-1 grid grid-cols-1 gap-4">
        <h4 className="text-center">{title}</h4>
        <div className={`grid grid-cols-${measuresGrids} mx-1 lg:mx-4 gap-4`}>
          {measures.map((m) => (
            <LivingLabMeasureForm
              livingLabId={livingLabId}
              key={m.name}
              measure={m}
              isEditable={isEditable}
              value={implementedMeasures.find(
                (imp) =>
                  imp.project_id === m.id && imp.living_lab_id === livingLabId
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
