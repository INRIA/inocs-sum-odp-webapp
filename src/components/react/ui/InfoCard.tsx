import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { Tooltip } from "./Tooltip";
import { useState } from "react";

type InfoCardProps = {
  title: string;
  description?: string;
  tooltip?: string;
  imageUrl?: string;
  href?: string;
  className?: string;
  iconRound?: boolean;
  hideDescription?: boolean;
  children?: React.ReactNode;
};

export function InfoCard({
  title,
  description,
  imageUrl,
  href = "#",
  className = "",
  iconRound = false,
  tooltip,
  hideDescription = false,
  children,
}: InfoCardProps) {
  const [openDescription, setOpenDescription] = useState(!hideDescription);
  const getCardContent = () => {
    return (
      <div
        className={`relative flex flex-col items-center space-x-2 rounded-lg border border-gray-300 bg-light px-2 py-2 shadow-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 hover:border-gray-400 ${className} ${
          hideDescription ? "cursor-pointer" : ""
        }`}
        aria-label={title}
        onClick={() => hideDescription && setOpenDescription(!openDescription)}
      >
        <div className="shrink-0">
          {imageUrl ? (
            <img
              alt={title}
              src={imageUrl}
              className={`h-10 w-10  ${
                iconRound
                  ? "rounded-full bg-gray-300 outline -outline-offset-1 outline-black/5"
                  : ""
              }`}
            />
          ) : (
            <div className="flex h-6 w-6 md:h-10 md:w-10 items-center justify-center rounded-full bg-light text-indigo-600">
              <InformationCircleIcon
                aria-hidden="true"
                className="h-10 w-10 flex-none text-secondary"
              />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 gap-y-1 text-center">
          <span aria-hidden="true" className="absolute inset-0" />
          <span className="font-semibold text-sm">{title}</span>
          <br></br>
          {openDescription && description ? (
            <small className="mt-0 leading-0">{description}</small>
          ) : null}
        </div>
        <div>{children}</div>
      </div>
    );
  };
  return tooltip ? (
    <Tooltip content={tooltip} placement="bottom">
      {getCardContent()}
    </Tooltip>
  ) : (
    getCardContent()
  );
}
