import type { IKpi } from "../../types/KPIs";
import { KpiDefinitionsService } from "../services/kpidefinitions.service";

export class KpiDefinitionsController {
  private readonly service = new KpiDefinitionsService();

  async getAll(): Promise<IKpi[]> {
    return this.service.getAllKpiDefinitions();
  }
}