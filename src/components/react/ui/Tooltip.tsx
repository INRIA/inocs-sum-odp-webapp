import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export function Tooltip({
  content,
  placement = "right",
  open = false,
  className = "relative inline-block cursor-pointer",
  iconClassName = "h-4 w-4 text-warning",
  children,
}: {
  content: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  open?: boolean;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}) {
  const [displayTooltip, setDisplayTooltip] = useState(false);
  useEffect(() => {
    setDisplayTooltip(open);
  }, [open]);

  const handleMouseEnter = () => {
    setDisplayTooltip(true);
  };
  const handleMouseLeave = () => {
    setDisplayTooltip(false);
  };

  return (
    <div className={className}>
      {children ? (
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {children}
        </div>
      ) : (
        <QuestionMarkCircleIcon
          className={` ${iconClassName}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
      <div
        role="tooltip"
        className={`w-52 absolute z-50 inline-block p-2 text-xs text-primary transition-opacity duration-300 bg-light rounded-lg shadow-xs tooltip ${
          displayTooltip ? "visible opacity-100" : "invisible opacity-0"
        } ${
          placement === "top"
            ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
            : placement === "bottom"
            ? "top-full left-1/2 -translate-x-1/2 mt-2"
            : placement === "left"
            ? "right-full top-1/2 -translate-y-1/2 mr-2"
            : "left-full top-1/2 -translate-y-1/2 ml-2"
        }`}
      >
        <small className="whitespace-pre-wrap">{content}</small>
      </div>
    </div>
  );
}
