import { describe, expect, it } from "vitest";
import { getModalSplitDataForDashboard } from "./living-lab";
import type { IKpi, IKpiResultGroup, ITransportMode } from "../../types";

describe("living-lab modal split helpers", () => {
  const modalSplitKpi: IKpi = {
    id: 15,
    kpi_number: "15.a",
    name: "Modal Split",
    type: "GLOBAL" as never,
    progression_target: 0,
    metric: "percentage" as never,
  };

  const transportModes: ITransportMode[] = [
    { id: 1, name: "Car", color: "#ff0000" } as ITransportMode,
    { id: 2, name: "Bike", color: "#00ff00" } as ITransportMode,
  ];

  it("builds sorted entries[] for each living lab and KPI", () => {
    const livingLabs = [
      {
        id: "1",
        name: "Geneva",
        kpiResults: [
          {
            living_lab_id: 1,
            kpidefinition_id: 15,
            transport_mode_id: 1,
            results: [
              { id: 4, kpidefinition_id: 15, living_lab_id: 1, transport_mode_id: 1, value: 41, date: "2024-01-01" },
              { id: 2, kpidefinition_id: 15, living_lab_id: 1, transport_mode_id: 1, value: 31, date: "2023-01-01" },
              { id: 1, kpidefinition_id: 15, living_lab_id: 1, transport_mode_id: 1, value: 21, date: "2022-01-01" },
              { id: 3, kpidefinition_id: 15, living_lab_id: 1, transport_mode_id: 1, value: 51, date: "2025-01-01" },
            ],
          },
          {
            living_lab_id: 1,
            kpidefinition_id: 15,
            transport_mode_id: 2,
            results: [
              { id: 8, kpidefinition_id: 15, living_lab_id: 1, transport_mode_id: 2, value: 59, date: "2024-01-01" },
              { id: 6, kpidefinition_id: 15, living_lab_id: 1, transport_mode_id: 2, value: 69, date: "2023-01-01" },
              { id: 5, kpidefinition_id: 15, living_lab_id: 1, transport_mode_id: 2, value: 79, date: "2022-01-01" },
              { id: 7, kpidefinition_id: 15, living_lab_id: 1, transport_mode_id: 2, value: 49, date: "2025-01-01" },
            ],
          },
        ] as IKpiResultGroup[],
      },
    ];

    const result = getModalSplitDataForDashboard(
      [modalSplitKpi],
      transportModes,
      livingLabs,
    );

    expect(result).toHaveLength(1);
    expect(result[0].labs).toHaveLength(1);
    const lab = result[0].labs[0];

    expect(lab.entries).toHaveLength(4);
    expect(lab.entries.map((entry) => entry.year)).toEqual([2022, 2023, 2024, 2025]);
    lab.entries.forEach((entry) => {
      expect(entry.data).toHaveLength(2);
    });
  });

  it("returns empty entries for labs with no modal split results", () => {
    const result = getModalSplitDataForDashboard(
      [modalSplitKpi],
      transportModes,
      [
        {
          id: "1",
          name: "Geneva",
          kpiResults: [],
        },
      ],
    );

    expect(result).toHaveLength(1);
    expect(result[0].labs).toHaveLength(0);
  });

  it("skips entries where transport mode is missing", () => {
    const result = getModalSplitDataForDashboard(
      [modalSplitKpi],
      transportModes,
      [
        {
          id: "1",
          name: "Geneva",
          kpiResults: [
            {
              living_lab_id: 1,
              kpidefinition_id: 15,
              transport_mode_id: 999,
              results: [
                {
                  id: 1,
                  kpidefinition_id: 15,
                  living_lab_id: 1,
                  transport_mode_id: 999,
                  value: 42,
                  date: "2024-01-01",
                },
              ],
            },
          ] as IKpiResultGroup[],
        },
      ],
    );

    expect(result).toHaveLength(1);
    expect(result[0].labs).toHaveLength(0);
  });

  it("orders duplicate-date entries deterministically by result id", () => {
    const result = getModalSplitDataForDashboard(
      [modalSplitKpi],
      transportModes,
      [
        {
          id: "1",
          name: "Geneva",
          kpiResults: [
            {
              living_lab_id: 1,
              kpidefinition_id: 15,
              transport_mode_id: 1,
              results: [
                {
                  id: 20,
                  kpidefinition_id: 15,
                  living_lab_id: 1,
                  transport_mode_id: 1,
                  value: 40,
                  date: "2024-01-01",
                },
              ],
            },
            {
              living_lab_id: 1,
              kpidefinition_id: 15,
              transport_mode_id: 2,
              results: [
                {
                  id: 10,
                  kpidefinition_id: 15,
                  living_lab_id: 1,
                  transport_mode_id: 2,
                  value: 60,
                  date: "2024-01-01",
                },
              ],
            },
          ] as IKpiResultGroup[],
        },
      ],
    );

    expect(result[0].labs[0].entries).toHaveLength(1);
    expect(result[0].labs[0].entries[0].data.map((item) => item.label)).toEqual([
      "Bike",
      "Car",
    ]);
  });
});
