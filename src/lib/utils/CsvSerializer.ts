import type { CsvHeaderDef } from "../../types/CsvExport";

export class EmptyCsvError extends Error {
  constructor(message = "No data rows to serialize into CSV") {
    super(message);
    this.name = "EmptyCsvError";
  }
}

export class CsvSerializer {
  /**
   * Serialize an array of row objects to a CSV string.
   * - Header row is built from `headers[].label`
   * - Each value is double-quoted; internal `"` are escaped as `""`
   * - Throws EmptyCsvError when `rows` is empty
   */
  static serialize(rows: Record<string, unknown>[], headers: CsvHeaderDef[]): string {
    if (rows.length === 0) {
      throw new EmptyCsvError();
    }

    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerRow = headers.map((h) => `"${h.label}"`).join(",");
    const dataRows = rows.map((row) =>
      headers.map((h) => escape(row[h.key])).join(","),
    );

    return [headerRow, ...dataRows].join("\n");
  }
}
