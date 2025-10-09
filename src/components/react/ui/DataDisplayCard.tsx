import React from "react";

interface DataItem {
  label: string;
  value?: string;
}

interface DataDisplayCardProps {
  data: DataItem[];
  className?: string;
}

export const DataDisplayCard: React.FC<DataDisplayCardProps> = ({
  data,
  className = "",
}) => {
  return (
    <div className={`bg-light rounded-lg p-4 gap-2 flex flex-col ${className}`}>
      {data
        .filter((item) => item.value !== undefined && item.value !== null)
        .map((item, index) => (
          <div key={index}>
            <h6>{item.label}</h6>
            <p className="text-dark">{item.value}</p>
          </div>
        ))}
    </div>
  );
};

export default DataDisplayCard;
