import { EnumKpiMetricType } from "../../types";

/**
 * Recursively converts any BigInt values in an object to Number.
 * Useful when Prisma returns @db.UnsignedBigInt columns that need to be
 * JSON-serialisable (JWT, API responses, etc.).
 */
export function parseBigIntFields<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(parseBigIntFields) as unknown as T;
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, parseBigIntFields(v)]),
    ) as T;
  }
  return obj;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateHtml(html: string, maxLength: number): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}…`;
}

export function formatDateToMonthYear(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short" });
}

export function formatDateOToMonthYear(d: Date): string {
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short" });
}

export function formatDate(date?: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateWithTime(date?: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getKpiValueByMetricType(value?: number, kpiMetric?: string) {
  if (value === undefined || value === null) return "";
  if (value >= 0 && kpiMetric && kpiMetric === EnumKpiMetricType.PERCENTAGE) {
    return `${Math.round(value * 100)}%`;
  }
  return `${value}`;
}

export function parseDateToInputHtml(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toISOString().slice(0, 10);
}

export function getYearFromDate(date?: string): number | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.getFullYear();
}

export function toSafeJsonString(obj: any): string {
  return JSON.stringify(obj, (key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}

export function notNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function formatPopulation(value: number): string {
  if (value >= 1_000_000) {
    const s = (value / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${s}M`;
  }
  if (value >= 1_000) {
    const s = (value / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${s}K`;
  }
  return String(value);
}
