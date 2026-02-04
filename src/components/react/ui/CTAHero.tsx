import React from "react";
import { RButton } from "./RButton";

export type ActionType = "link" | "primary" | "secondary";

export interface BaseAction {
  type?: ActionType;
  text?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export interface CTAHeroProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  primary?: BaseAction;
  secondary?: BaseAction;
  className?: string;
  image?: string | { src: string; alt?: string; position?: string };
  announcement?: BaseAction;
  titleTextColor?: string;
}

export function CTAHero({
  title = "Data to enrich your online business",
  subtitle = "Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat.",
  primary = {
    text: "Get started",
    href: "#",
  },
  secondary = {
    text: "Learn more",
    href: "#",
  },
  className = "",
  image,
  announcement,
  titleTextColor,
}: CTAHeroProps) {
  const imageSrc = typeof image === "string" ? image : image?.src;
  const imageAlt = typeof image === "string" ? "" : (image?.alt ?? ""); // background decorative by default
  const imagePosition = typeof image === "string" ? undefined : image?.position;

  return (
    <div className="bg-dark">
      <div className={` relative isolate overflow-hidden pt-14 ${className}`}>
        <img
          alt={imageAlt}
          src={imageSrc}
          loading="lazy"
          aria-hidden={imageAlt === "" ? "true" : undefined}
          className="absolute inset-0 -z-10 size-full object-cover blur-xs"
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full object-cover bg-dark opacity-30"
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl py-32 ">
            {announcement && (
              <div className="mb-8 sm:flex sm:justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                  {announcement?.text}
                  <RButton
                    variant="link"
                    text="Read more"
                    href={announcement?.href}
                    onClick={announcement?.onClick}
                    className="text-primary"
                    defaultArrow={true}
                  />
                </div>
              </div>
            )}

            <div className="text-center">
              <h1
                className="drop-shadow-[1px_1px_1px_white]"
                style={{ color: titleTextColor }}
              >
                {title}
              </h1>
              <h4 className="mt-8 text-light drop-shadow-[1px_1px_1px_gray]">
                {subtitle}
              </h4>

              <div className="mt-10 flex items-center justify-center gap-x-6">
                <RButton
                  variant="primary"
                  text={primary?.text}
                  href={primary?.href}
                  onClick={primary?.onClick}
                  className={primary?.className}
                />
                <RButton
                  variant="link"
                  text={secondary?.text}
                  href={secondary?.href}
                  onClick={secondary?.onClick}
                  className={secondary?.className ?? "text-light"}
                  defaultArrow={true}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-288.75"
          />
        </div>
      </div>
    </div>
  );
}
