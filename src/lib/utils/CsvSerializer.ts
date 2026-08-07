import type { CsvHeaderDef } from "../../types/CsvExport";

export class CsvSerializer {
  static serialize(rows: Record<string, unknown>[], headers: CsvHeaderDef[]): string {
    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerRow = headers.map((h) => `"${h.label}"`).join(",");

    if (rows.length === 0) return headerRow;   // header-only, no error

    const dataRows = rows.map((row) =>
      headers.map((h) => escape(row[h.key])).join(","),
    );
    return [headerRow, ...dataRows].join("\n");
  }
}
