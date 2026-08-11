import React from "react";
import { ExpansionPanel } from "../ui/ExpansionPanel";
import { Badge } from "../ui/Badge";
import { RButton } from "../ui/RButton";
import type { BadgeColor } from "../ui/Badge";

interface Cta {
  label: string;
  href: string;
}

interface MethodologySectionProps {
  title: string;
  subtitle: string;
  badges: { label: string; color: BadgeColor }[];
  open?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  ctas?: Cta[];
  children?: React.ReactNode;
}

export function MethodologySection({
  title,
  subtitle,
  badges,
  open = true,
  ctaLabel,
  ctaHref,
  ctas,
  children,
}: MethodologySectionProps) {
  const allCtas: Cta[] = [
    ...(ctaLabel && ctaHref ? [{ label: ctaLabel, href: ctaHref }] : []),
    ...(ctas ?? []),
  ];

  return (
    <ExpansionPanel
      arrow
      open={open}
      header={
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
          <div>
            <h2>{title}</h2>
            <p className="text-dark mt-1">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {badges.map((b) => (
                <Badge key={b.label} color={b.color} size="sm">
                  {b.label}
                </Badge>
              ))}
            </div>
          </div>
          {allCtas.length > 0 && (
            <div className="shrink-0 mt-4 flex flex-row lg:flex-col gap-3">
              {allCtas.map((cta) => (
                <RButton
                  key={cta.label}
                  variant="secondary"
                  size="lg"
                  text={cta.label}
                  href={cta.href}
                  defaultArrow
                />
              ))}
            </div>
          )}
        </div>
      }
      content={<div className="py-6">{children}</div>}
    />
  );
}
