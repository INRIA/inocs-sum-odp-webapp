// T018 — projects CSV route tests
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { GET } from "./projects";
import { EmptyCsvError } from "../../../../bff/services/csv-export.service";

// Mock the controller so tests never hit the database
vi.mock("../../../../bff/controllers/csv-export.controller", () => ({
  CsvExportController: vi.fn(function () {
    return { getKpiResultsCsv: vi.fn(), getProjectsCsv: vi.fn() };
  }),
}));

import { CsvExportController } from "../../../../bff/controllers/csv-export.controller";

function makeUrl(params: Record<string, string> = {}): URL {
  const base = new URL("http://localhost/api/v1/csv/projects");
  for (const [k, v] of Object.entries(params)) {
    base.searchParams.set(k, v);
  }
  return base;
}

describe("GET /api/v1/csv/projects", () => {
  let mockGetProjectsCsv: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    // projects.ts creates `controller` at module level (singleton).
    // Capture the reference once — before any clearAllMocks wipes mock.instances.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = vi.mocked(CsvExportController).mock.instances[0] as any;
    mockGetProjectsCsv = instance.getProjectsCsv as ReturnType<typeof vi.fn>;
  });

  beforeEach(() => {
    mockGetProjectsCsv.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with Content-Disposition: attachment and CSV header row when no filters supplied", async () => {
    const csvData =
      '"Lab","Project Name","Project Type","Start Date","Description"\n"CityLab","Bike lane","Infrastructure","2023-01-01","A new lane"';
    mockGetProjectsCsv.mockResolvedValueOnce(csvData);

    const res = await GET({ url: makeUrl() } as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("projects.csv");
    const body = await res.text();
    expect(body).toBe(csvData);
  });

  it("passes living_lab_id filter to controller when provided", async () => {
    mockGetProjectsCsv.mockResolvedValueOnce('"Lab","Project Name","Project Type","Start Date","Description"\n"CityLab","Bike lane","Infrastructure","2023-01-01",""');

    await GET({ url: makeUrl({ living_lab_id: "3" }) } as never);

    expect(mockGetProjectsCsv).toHaveBeenCalledWith(
      expect.objectContaining({ living_lab_id: 3 }),
    );
  });

  it("returns 404 when controller throws EmptyCsvError", async () => {
    mockGetProjectsCsv.mockRejectedValueOnce(
      new EmptyCsvError("No projects found"),
    );

    const res = await GET({ url: makeUrl({ living_lab_id: "999" }) } as never);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
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
    mockGetProjectsCsv.mockRejectedValueOnce(new Error("DB connection lost"));

    const res = await GET({ url: makeUrl() } as never);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Internal Server Error");
  });
});
