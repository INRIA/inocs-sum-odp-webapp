import React, { useState } from "react";
import { ArchiveBoxArrowDownIcon } from "@heroicons/react/24/outline";
import { RButton } from "../ui/RButton";
import ApiClient, { ApiDownloadError } from "../../../lib/api-client/ApiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DownloadType =
  | "kpi-results-all"
  | "kpi-results-lab"
  | "kpi-results-definition"
  | "kpi-results-category"
  | "projects-all"
  | "projects-lab";

export interface TriggerDownloadCsvProps {
  type: DownloadType;
  /** 'sm' maps to RButton 'xs' internally */
  size?: "sm" | "md" | "lg";
  living_lab_id?: number;
  category_id?: number | string;
  kpidefinition_id?: number;
  disabled?: boolean;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LABEL_MAP: Record<DownloadType, string> = {
  "kpi-results-all": "All KPIs CSV",
  "kpi-results-lab": "CSV",
  "kpi-results-definition": "CSV",
  "kpi-results-category": "Download KPI results CSV",
  "projects-all": "Download measures implemented CSV",
  "projects-lab": "Lab Measures CSV",
};

/** Maps TriggerDownloadCsvProps size → RButton size */
const SIZE_MAP = {
  sm: "xs",
  md: "md",
  lg: "lg",
} as const;

// ── Path builder ──────────────────────────────────────────────────────────────

function buildPath(props: TriggerDownloadCsvProps): string {
  const params = new URLSearchParams();

  if (props.living_lab_id !== undefined) {
    params.set("living_lab_id", String(props.living_lab_id));
  }
  if (props.category_id !== undefined) {
    params.set("category_id", String(props.category_id));
  }
  if (props.kpidefinition_id !== undefined) {
    params.set("kpidefinition_id", String(props.kpidefinition_id));
  }

  const base = props.type.startsWith("projects")
    ? "/csv/projects"
    : "/csv/kpiresults";

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Returns true when a required filter for the given type is missing */
function isDisabledByMissingFilter(props: TriggerDownloadCsvProps): boolean {
  if (
    (props.type === "kpi-results-lab" || props.type === "projects-lab") &&
    props.living_lab_id === undefined
  ) {
    return true;
  }
  return false;
}

// ── Filename builder ──────────────────────────────────────────────────────────

function todayDDMMYYYY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function buildFilename(props: TriggerDownloadCsvProps): string {
  const date = todayDDMMYYYY();

  if (props.type.startsWith("projects")) {
    const parts = ["projects"];
    if (props.living_lab_id !== undefined)
      parts.push(`lab${props.living_lab_id}`);
    parts.push(date);
    return `${parts.join("_")}.csv`;
  }

  const parts = ["kpi-results"];
  if (props.kpidefinition_id !== undefined)
    parts.push(`kpi${props.kpidefinition_id}`);
  if (props.living_lab_id !== undefined)
    parts.push(`lab${props.living_lab_id}`);
  if (props.category_id !== undefined)
    parts.push(`category${props.category_id}`);
  parts.push(date);
  return `${parts.join("_")}.csv`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TriggerDownloadCsv(props: TriggerDownloadCsvProps) {
  const { type, size = "md", disabled } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDisabled =
    disabled === true || isDisabledByMissingFilter(props) || isLoading;

  const handleClick = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const client = new ApiClient();
      const path = buildPath(props);
      const blob = await client.downloadCsvBlob(path);

      // Trigger browser file download
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = buildFilename(props);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      if (err instanceof ApiDownloadError) {
        setErrorMsg(`Download failed: status=${err.status}`);
      } else {
        setErrorMsg("Download failed: unexpected error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const rbuttonSize = SIZE_MAP[size];
  const iconSize = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };
  const label = LABEL_MAP[type];

  return (
    <div className="inline-flex flex-col items-center justify-center gap-1">
      <RButton
        variant="secondary"
        size={rbuttonSize}
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={label}
        className={props.className}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            {/* Inline spinner SVG */}
            <svg
              className={`animate-spin -ml-1 mr-1 ${iconSize[size]}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Downloading…
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <ArchiveBoxArrowDownIcon
              className={`${iconSize[size]} mr-1 inline`}
              aria-hidden="true"
            />
            {label}
          </div>
        )}
      </RButton>

      {errorMsg && (
        <p className="text-xs text-red-600" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
