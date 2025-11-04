import React from "react";

export type ButtonVariant = "link" | "primary" | "secondary";

export interface RButtonProps {
  variant?: ButtonVariant;
  text?: string;
  children?: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  defaultArrow?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function RButton({
  variant = "link",
  text,
  children,
  href,
  onClick,
  className = "",
  defaultArrow = false,
  type,
  ...props
}: RButtonProps) {
  const classNamePrimary =
    " rounded-md bg-secondary px-3.5 py-2.5 text-sm font-semibold text-primary shadow-xs hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ";
  const classNameLink = " underline text-sm/6 text-blue-900 ";
  const classNameSecondary =
    " rounded-md border border-secondary px-3.5 py-2.5 text-sm font-semibold shadow-xs hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ";

  const actionClassName =
    "cursor-pointer" +
    (variant === "primary"
      ? classNamePrimary
      : variant === "link"
      ? classNameLink
      : classNameSecondary) +
    className;

  if (type || onClick) {
    return (
      <button
        type={type ?? "button"}
        onClick={onClick}
        className={actionClassName}
        {...props}
      >
        {text}
        {children}
        {defaultArrow && <span aria-hidden="true">→</span>}
      </button>
    );
  }

  if (href) {
    return (
      <a href={href} className={actionClassName} {...props}>
        {text}
        {children}
        {defaultArrow && <span aria-hidden="true">→</span>}
      </a>
    );
  }

  return (
    <button type="button" className={actionClassName} {...props}>
      {text}
      {children}
      {defaultArrow && <span aria-hidden="true">→</span>}
    </button>
  );
}
