import React, { useState } from "react";

interface ExpansionPanelProps {
  header: React.ReactNode;
  content: React.ReactNode;
  arrow?: boolean;
  open?: boolean;
}

export const ExpansionPanel: React.FC<ExpansionPanelProps> = ({
  header,
  content,
  arrow = false,
  open = false,
}) => {
  const [isOpen, setIsOpen] = useState(open);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="mb-2 w-full flex flex-col min-w-0">
      <div
        className="flex items-center cursor-pointer py-3 select-none w-full"
        onClick={handleToggle}
      >
        <div className="flex-1">{header}</div>
        {arrow && (
          <span className="ml-0 transition-transform duration-200">
            {isOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polyline
                  points="6 15 12 9 18 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polyline
                  points="6 9 12 15 18 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            )}
          </span>
        )}
      </div>
      {isOpen && (
        <div className="border-t border-gray-200 w-full">{content}</div>
      )}
    </div>
  );
};
