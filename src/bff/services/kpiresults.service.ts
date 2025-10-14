import type { IKpiResult, IKpiResultInput } from "../../types/KPIs";
import { KpiResultsRepository } from "../repositories/kpiresults.repository";

export class KpiResultsService {
  constructor(private readonly repo = new KpiResultsRepository()) {}

  async upsertKpiResult(input: IKpiResultInput): Promise<IKpiResult> {
    this.validateCreatePayload(input);
    return this.repo.upsert(input);
  }

  async deleteKpiResult(
    id?: string
    //     criteria: {
    //     id?: string;
    //     kpidefinition_id?: string;
    //     living_lab_id?: string;
    //   }
  ): Promise<boolean> {
    return this.repo.delete(id);
  }

  validateCreatePayload(p: Partial<IKpiResultInput>) {
    const missing: string[] = [];
    if (!p.kpidefinition_id) missing.push("kpidefinition_id");
    if (!p.living_lab_id) missing.push("living_lab_id");
    if (p.value == null) missing.push("value");
    if (!p.date) missing.push("date");
    if (missing.length) {
      throw new Error("Missing required fields: " + missing.join(", "));
    }
  }
}
