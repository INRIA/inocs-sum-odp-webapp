// T004 — CsvSerializer tests (write FIRST, must fail before T006/T007)
import { describe, it, expect } from "vitest";
import { CsvSerializer } from "./csv-export.service";
import type { CsvHeaderDef } from "./csv-export.service";

const headers: CsvHeaderDef[] = [
  { key: "name", label: "Name" },
  { key: "value", label: "Value" },
  { key: "note", label: "Note" },
];

describe("CsvSerializer.serialize", () => {
  it("produces a header row from the headers array", () => {
    const rows = [{ name: "Lab A", value: 42, note: "" }];
    const csv = CsvSerializer.serialize(rows, headers);
    const lines = csv.split("\n");
    expect(lines[0]).toBe('"Name","Value","Note"');
  });

  it("double-quotes all values", () => {
    const rows = [{ name: "Geneva", value: 100, note: "ok" }];
    const csv = CsvSerializer.serialize(rows, headers);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"Geneva","100","ok"');
  });

  it("escapes internal double-quotes as double double-quotes", () => {
    const rows = [{ name: 'Say "hello"', value: 0, note: "" }];
    const csv = CsvSerializer.serialize(rows, headers);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Say ""hello"""');
  });

  it("renders empty string for missing/null/undefined fields", () => {
    const rows = [{ name: "Lab B", value: null, note: undefined }];
    const csv = CsvSerializer.serialize(rows as never, headers);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"Lab B","",""');
  });

  it("serializes number 0 as '0' not empty", () => {
    const rows = [{ name: "X", value: 0, note: "" }];
    const csv = CsvSerializer.serialize(rows, headers);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"X","0",""');
  });

  it("handles multiple rows", () => {
    const rows = [
      { name: "A", value: 1, note: "" },
      { name: "B", value: 2, note: "y" },
    ];
    const csv = CsvSerializer.serialize(rows, headers);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[1]).toBe('"A","1",""');
    expect(lines[2]).toBe('"B","2","y"');
  });

  it("returns header-only CSV when rows array is empty", () => {
    const csv = CsvSerializer.serialize([], headers);
    expect(csv).toBe('"Name","Value","Note"');
  });

  it("uses keys from headers to pick row fields", () => {
    const wideHeaders: CsvHeaderDef[] = [{ key: "name", label: "Name" }];
    const rows = [{ name: "Test", extra: "ignored", value: 99, note: "" }];
    const csv = CsvSerializer.serialize(rows, wideHeaders);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"Test"');
  });
});
