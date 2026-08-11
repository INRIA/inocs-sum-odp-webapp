// T010 — kpiresults CSV route tests
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { GET } from "./kpiresults";

// Mock the controller so tests never hit the database
vi.mock("../../../../bff/controllers/csv-export.controller", () => ({
  CsvExportController: vi.fn(function () {
    return { getKpiResultsCsv: vi.fn(), getProjectsCsv: vi.fn() };
  }),
}));

import { CsvExportController } from "../../../../bff/controllers/csv-export.controller";

function makeUrl(params: Record<string, string> = {}): URL {
  const base = new URL("http://localhost/api/v1/csv/kpiresults");
  for (const [k, v] of Object.entries(params)) {
    base.searchParams.set(k, v);
  }
  return base;
}

describe("GET /api/v1/csv/kpiresults", () => {
  let mockGetKpiResultsCsv: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    // kpiresults.ts creates `controller` at module level (singleton).
    // Capture the reference once — before any clearAllMocks wipes mock.instances.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = vi.mocked(CsvExportController).mock.instances[0] as any;
    mockGetKpiResultsCsv = instance.getKpiResultsCsv as ReturnType<typeof vi.fn>;
  });

  beforeEach(() => {
    mockGetKpiResultsCsv.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with Content-Disposition: attachment and CSV header row when no filters supplied", async () => {
    const expectedCsv = '"KPI Group","KPI Number","KPI Name (parent)","KPI subtitle (child)","Transport Mode (modal split)","Metric(unit)","Lab","Value","Date"\n"Group","1.1","Parent KPI","KPI A","","count","Geneva","5","2024-01-01"';
    mockGetKpiResultsCsv.mockResolvedValueOnce(expectedCsv);

    const res = await GET({ url: makeUrl() } as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="kpi-results.csv"',
    );
    const body = await res.text();
    expect(body).toBe(expectedCsv);
  });

  it("passes living_lab_id filter to controller when provided", async () => {
    mockGetKpiResultsCsv.mockResolvedValueOnce('"Lab"\n"Geneva"');

    await GET({ url: makeUrl({ living_lab_id: "3" }) } as never);

    expect(mockGetKpiResultsCsv).toHaveBeenCalledWith(
      expect.objectContaining({ living_lab_id: 3 }),
    );
  });

  it("passes category_id filter to controller when provided", async () => {
    mockGetKpiResultsCsv.mockResolvedValueOnce('"Lab"\n"Geneva"');

    await GET({ url: makeUrl({ category_id: "7" }) } as never);

    expect(mockGetKpiResultsCsv).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: 7 }),
    );
  });

  it("passes combined living_lab_id + kpidefinition_id filters", async () => {
    mockGetKpiResultsCsv.mockResolvedValueOnce('"Lab"\n"X"');

    await GET({
      url: makeUrl({ living_lab_id: "3", kpidefinition_id: "12" }),
    } as never);

    expect(mockGetKpiResultsCsv).toHaveBeenCalledWith({
      living_lab_id: 3,
      kpidefinition_id: 12,
      category_id: undefined,
    });
  });

  it("returns 200 with header-only CSV when controller returns empty data", async () => {
    mockGetKpiResultsCsv.mockResolvedValueOnce(
      '"KPI Group","KPI Number","KPI Name (parent)","KPI subtitle (child)","Transport Mode (modal split)","Metric(unit)","Lab","Value","Date"',
    );

    const res = await GET({ url: makeUrl({ living_lab_id: "999" }) } as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
  });

  it("accepts kpidefinition_id without living_lab_id (regression: was 400 via ModalSplitCard)", async () => {
    mockGetKpiResultsCsv.mockResolvedValueOnce('"KPI Group","KPI Number"');
    const res = await GET({ url: makeUrl({ kpidefinition_id: "42" }) } as never);
    expect(res.status).toBe(200);
  });

  it("treats empty-string living_lab_id as absent (not 400)", async () => {
    mockGetKpiResultsCsv.mockResolvedValueOnce('"KPI Group"');
    const res = await GET({ url: makeUrl({ living_lab_id: "" }) } as never);
    expect(res.status).toBe(200);
    expect(mockGetKpiResultsCsv).toHaveBeenCalledWith(
      expect.objectContaining({ living_lab_id: undefined }),
    );
  });

  it("returns 400 when living_lab_id is not a positive integer", async () => {
    const res = await GET({ url: makeUrl({ living_lab_id: "abc" }) } as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("living_lab_id");
  });

  it("returns 400 when living_lab_id is zero", async () => {
    const res = await GET({ url: makeUrl({ living_lab_id: "0" }) } as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when living_lab_id is negative", async () => {
    const res = await GET({ url: makeUrl({ living_lab_id: "-5" }) } as never);
    expect(res.status).toBe(400);
  });

  it("returns 500 when controller throws unexpected error", async () => {
    mockGetKpiResultsCsv.mockRejectedValueOnce(new Error("DB connection lost"));

    const res = await GET({ url: makeUrl() } as never);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Internal Server Error");
  });
});
