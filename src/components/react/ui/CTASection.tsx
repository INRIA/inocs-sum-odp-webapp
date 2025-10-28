import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { RButton } from "./RButton";

interface CTASectionProps {
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  benefits?: string[];
  linkHref?: string;
  linkText?: string;
  className?: string;
  order?: "left" | "right" | "center";
  children?: React.ReactNode;
}

export function CTASection({
  imageSrc,
  imageAlt = "",
  title = "",
  description = "",
  benefits = [],
  linkHref,
  linkText,
  className = "",
  order = "left",
  children,
}: CTASectionProps) {
  return (
    <div className={`overflow-hidden mt-20 mx-2 ${className}`}>
      <div className="relative isolate">
        <div className="mx-auto max-w-7xl sm:px-6 md:px-6  lg:px-8 xl:px-20 flex flex-col">
          <div
            className={`mx-auto flex flex-col gap-16 bg-white/75 shadow-lg ring-1 ring-gray-900/5 sm:rounded-3xl lg:mx-0 lg:max-w-none ${
              order === "right"
                ? "flex-col-reverse lg:flex-row-reverse lg:items-center"
                : order === "center"
                ? "lg:flex-row lg:items-center lg:justify-center"
                : "flex-col-reverse lg:flex-row lg:items-center"
            } xl:gap-x-20  bg-white/3 shadow-none ring-white/10`}
          >
            {imageSrc && (
              <img
                alt={imageAlt}
                src={imageSrc}
                className="h-96 w-full flex-none rounded-2xl object-cover shadow-none lg:aspect-square lg:h-auto lg:max-w-sm"
              />
            )}
            <div className="w-full flex-auto">
              <h2
                className={`mb-4 ${
                  order === "center" ? "text-center lg:px-20" : "text-left"
                }`}
              >
                {title}
              </h2>
              <p
                className={`${
                  order === "center" ? "text-center lg:px-20" : "text-left"
                }`}
              >
                {description}
              </p>
              {benefits.length > 0 && (
                <ul
                  role="list"
                  className="my-10 grid grid-cols-1 gap-x-8 gap-y-3 "
                >
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-x-3">
                      <CheckCircleIcon
                        aria-hidden="true"
                        className="h-10 w-10 flex-none text-secondary"
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}

              {children}
            </div>
          </div>
          {linkHref && (
            <div
              className={`flex  ${
                order === "left"
                  ? "flex justify-end"
                  : order === "center"
                  ? "flex justify-center"
                  : "flex justify-start"
              }`}
            >
              <RButton variant="primary" text={linkText} href={linkHref} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
