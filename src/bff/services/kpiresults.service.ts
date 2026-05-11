import type { IKpiResult, IKpiResultInput } from "../../types/KPIs";
import { KpiResultsRepository } from "../repositories/kpiresults.repository";
import { LabRepository } from "../repositories/labs.repository";
import {
  notifyEntityChanged,
  type ActingUser,
} from "../email/admin-notifier.service";

export class KpiResultsService {
  constructor(
    private readonly repo = new KpiResultsRepository(),
    private readonly labRepo = new LabRepository(),
  ) {}

  async upsertKpiResult(
    input: IKpiResultInput,
    actor?: ActingUser,
  ): Promise<IKpiResult> {
    this.validateCreatePayload(input);

    const lastUpdatedByUserId = actor
      ? BigInt(String(actor.id))
      : undefined;

    const { result, wasCreated, before } = await this.repo.upsert(
      input,
      lastUpdatedByUserId,
    );

    if (actor) {
      const lab = await this.labRepo.findById(String(input.living_lab_id));
      notifyEntityChanged({
        entity: "kpiresult",
        action: wasCreated ? "created" : "updated",
        entityId: (result as any).id ?? 0,
        labId: input.living_lab_id,
        labName: lab?.name,
        actor,
        before: wasCreated ? null : (before as Record<string, unknown>),
        after: result as unknown as Record<string, unknown>,
      });
    }

    return result;
  }

  async deleteKpiResult(id?: string, actor?: ActingUser): Promise<boolean> {
    const { deleted, before } = await this.repo.delete(id);

    if (deleted && actor && before) {
      const lab = before.living_lab_id != null
        ? await this.labRepo.findById(String(before.living_lab_id))
        : null;
      notifyEntityChanged({
        entity: "kpiresult",
        action: "deleted",
        entityId: id ?? 0,
        labId: before.living_lab_id,
        labName: lab?.name,
        actor,
        before: before as Record<string, unknown>,
        after: null,
      });
    }

    return deleted;
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
