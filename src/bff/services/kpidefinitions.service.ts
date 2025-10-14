import type { IKpi } from "../../types/KPIs";
import { KpiDefinitionsRepository } from "../repositories/kpidefinitions.repository";

export class KpiDefinitionsService {
  constructor(private readonly repo = new KpiDefinitionsRepository()) {}

  async getAllKpiDefinitions(filter: { kpi_number?: string }): Promise<IKpi[]> {
    if (filter.kpi_number) {
      const kpiWithChildren = await this.repo.findByKpiNumberWithChildren(
        filter.kpi_number
      );
      return kpiWithChildren ?? [];
    }
    const defs = await this.repo.findAll();
    return defs;
  }
}
