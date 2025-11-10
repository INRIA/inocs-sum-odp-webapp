import React from "react";
import { RButton } from "./RButton";

type Detail = {
  label: string;
  value: string;
};

type TaskCardProps = {
  title: string;
  value: string;
  ctaLabel?: string;
  ctaLink: string;
  progress?: number;
  details?: Detail[];
};

export const TaskCard: React.FC<TaskCardProps> = ({
  title,
  value,
  ctaLabel = "Complete data",
  ctaLink,
  progress = 0,
  details = [],
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between h-full">
      {/* Top part: Title & value */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-1 xl:min-h-20">
          {title}
        </h4>
        <div className="flex flex-row justify-between items-center  mb-4">
          <h3 className=" text-secondary text-left">{value}</h3>
          <div
            className={`text-sm font-medium text-gray-700 ${
              progress > 50 ? "text-success" : "text-warning"
            }`}
          >
            {progress}%
          </div>
        </div>
      </div>

      {/* Details list */}
      {details.length > 0 && (
        <div className="mb-4">
          <ul>
            {details.map((d, idx) => (
              <li
                key={idx}
                className="flex justify-between text-sm text-gray-600 gap-2"
              >
                <span>{d.label}</span>
                <span className="font-medium text-gray-900">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RButton
        href={ctaLink}
        className="mx-auto text-center w-fit"
        variant={progress > 90 ? "secondary" : "warning"}
      >
        {ctaLabel}
      </RButton>
    </div>
  );
};

export default TaskCard;
