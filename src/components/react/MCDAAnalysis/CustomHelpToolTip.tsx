import React, { useState } from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { InfoAlert, type AlertVariant } from "../ui";

type CustomHelpToolTipProps = {
  title: string;
  children: React.ReactNode;
  variant?: AlertVariant;
  trigger?: "icon" | "button";
  buttonLabel?: string;
  className?: string;
};

export const CustomHelpToolTip: React.FC<CustomHelpToolTipProps> = ({
  title,
  children,
  variant = "info",
  trigger = "icon",
  buttonLabel = "Help",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTooltip = () => {
    setIsOpen((previous) => !previous);
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={toggleTooltip}
        onMouseEnter={() => setIsOpen(true)}
        aria-label="Help"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1 rounded-3xl bg-info p-1 text-sm text-primary transition hover:bg-info/30"
      >
        {trigger === "button" ? (
          <span>{buttonLabel}</span>
        ) : (
          <QuestionMarkCircleIcon
            className="h-5 w-5 font-bold"
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 w-75 lg:w-125 bg-white">
          <InfoAlert title={title} variant={variant}>
            {children}
          </InfoAlert>
        </div>
      )}
    </div>
  );
};
