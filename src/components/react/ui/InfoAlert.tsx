import React from "react";
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
import { RButton } from "./RButton";
export type AlertVariant =
  | "question"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";
export type AlertIconVariant =
  | "info"
  | "question"
  | "success"
  | "warning"
  | "danger"
  | "neutral";
export type InfoAlertProps = {
  title?: React.ReactNode;
  children: React.ReactNode;
  variant?: AlertVariant;
  icon?: AlertIconVariant;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  hideIcon?: boolean;
};

const variantClasses: Record<
  AlertVariant,
  { bg: string; border: string; text: string; buttonBg: string }
> = {
  question: {
    bg: "bg-info/50",
    border: "border-sky-200",
    text: "text-primary",
    buttonBg: "border-primary hover:border-primary/90 text-primary",
  },
  success: {
    bg: "bg-success/50",
    border: "border-green-200",
    text: "text-primary",
    buttonBg: "border-success hover:border-success/90 text-primary",
  },
  warning: {
    bg: "bg-warning/50",
    border: "border-orange-200",
    text: "text-warning",
    buttonBg: "border-warning hover:border-warning/90 text-primary",
  },
  danger: {
    bg: "bg-danger/50",
    border: "border-red-200",
    text: "text-danger",
    buttonBg: "border-danger hover:border-danger/90 text-primary",
  },
  info: {
    bg: "bg-info/50",
    border: "border-sky-200",
    text: "text-primary",
    buttonBg: "border-primary hover:border-primary/90 text-primary",
  },
  neutral: {
    bg: "bg-dark/50",
    border: "border-gray-200",
    text: "text-dark",
    buttonBg: "border-dark hover:border-dark/90 text-primary",
  },
};

const heroIconsVariants = {
  info: <InformationCircleIcon className="h-8 w-8" />,
  question: <QuestionMarkCircleIcon className="h-8 w-8" />,
  success: <CheckCircleIcon className="h-8 w-8" />,
  warning: <ExclamationTriangleIcon className="h-8 w-8" />,
  danger: <ExclamationTriangleIcon className="h-8 w-8" />,
  neutral: <InformationCircleIcon className="h-8 w-8" />,
};

export function InfoAlert({
  title,
  icon,
  children,
  variant = "info",
  actionText,
  actionHref,
  onAction,
  className = "",
  hideIcon = false,
}: InfoAlertProps) {
  const v = variantClasses[variant];

  return (
    <div
      className={`${v.bg} border ${v.border} rounded-lg p-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        {!hideIcon && (
          <div className={`${v.text}`}>
            {heroIconsVariants[icon ?? variant]}
          </div>
        )}

        <div className="flex-1 gap-0">
          {title && <h6 className={`${v.text}`}>{title}</h6>}
          <p className={`${v.text}`}>{children}</p>
        </div>

        {actionText && (
          <div className="flex-shrink-0">
            <RButton
              variant="link"
              onClick={onAction}
              href={actionHref}
              className={`${v.buttonBg}`}
              text={actionText}
              defaultArrow
            ></RButton>
          </div>
        )}
      </div>
    </div>
  );
}
