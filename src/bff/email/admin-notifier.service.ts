import { getSmtpTransporter, getSmtpFrom, getAdminEmails } from "./smtp.client";
import { loadTemplate } from "./template.loader";

/** Fields never included in email diffs for privacy / security. */
const REDACTED_FIELDS = new Set(["password", "remember_token"]);

export type EntityName = "lab" | "kpiresult" | "lab_project";
export type ActionType = "created" | "updated" | "deleted";

export interface ActingUser {
  id: string | number | bigint;
  name: string;
  email: string;
}

export interface EntityChangedParams {
  entity: EntityName;
  action: ActionType;
  entityId: string | number | bigint;
  labId?: string | number | bigint;
  labName?: string;
  actor: ActingUser;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Builds a human-readable field-by-field diff between `before` and `after`.
 * Only includes fields that changed. Redacts sensitive fields.
 */
function buildDiff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  action: ActionType,
): string {
  if (action === "created" && after) {
    const lines = Object.entries(after)
      .filter(([k]) => !REDACTED_FIELDS.has(k))
      .map(([k, v]) => `  + ${k}: ${safeSerialize(v)}`);
    return lines.length ? lines.join("\n") : "(no fields)";
  }

  if (action === "deleted" && before) {
    const lines = Object.entries(before)
      .filter(([k]) => !REDACTED_FIELDS.has(k))
      .map(([k, v]) => `  - ${k}: ${safeSerialize(v)}`);
    return lines.length ? lines.join("\n") : "(no fields)";
  }

  // updated: show only changed fields
  if (before && after) {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const lines: string[] = [];

    allKeys.forEach((k) => {
      if (REDACTED_FIELDS.has(k)) return;
      const prev = safeSerialize(before[k]);
      const next = safeSerialize(after[k]);
      if (prev !== next) {
        lines.push(`  ${k}: ${prev} → ${next}`);
      }
    });

    return lines.length ? lines.join("\n") : "(no fields changed)";
  }

  return "(no diff available)";
}

function safeSerialize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v,
      );
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

async function sendMail(
  subject: string,
  text: string,
): Promise<void> {
  const recipients = getAdminEmails();
  if (!recipients.length) {
    console.warn("[admin-notifier] ADMIN_EMAILS is not set — skipping email.");
    return;
  }

  const transporter = getSmtpTransporter();
  const from = getSmtpFrom();

  // no-op / jsonTransport path — log to console
  if ((transporter as any).transporter?.name === "JSONTransport" ||
      (transporter as any).options?.jsonTransport) {
    console.log("[admin-notifier] DEV email (no SMTP configured):", {
      from,
      to: recipients.join(", "),
      subject,
      text,
    });
    return;
  }

  await transporter.sendMail({
    from,
    to: recipients.join(", "),
    subject,
    text,
  });
}

/**
 * Fire-and-forget: notifies admins that an entity was created, updated, or deleted.
 */
export function notifyEntityChanged(params: EntityChangedParams): void {
  const { entity, action, entityId, labId, labName, actor, before, after } = params;

  Promise.resolve()
    .then(() => {
      const diff = buildDiff(before, after, action);
      const text = loadTemplate("entity-changed", {
        entity,
        action,
        entityId: String(entityId),
        labId: labId != null ? String(labId) : "N/A",
        actorName: actor.name,
        actorEmail: actor.email,
        when: new Date().toISOString(),
        diff,
      });

      const entityLabel =
        entity === "lab"
          ? "Lab info"
          : entity === "kpiresult"
            ? "KPI result"
            : "Policy measure implementation";

      const llLabel = labName ?? (labId != null ? String(labId) : "?");

      return sendMail(
        `[SUM ODP][LL: ${llLabel}] ${entityLabel} ${action} by ${actor.name}`,
        text,
      );
    })
    .catch((err) => {
      console.error("[admin-notifier] Failed to send entity-changed email:", err);
    });
}

/**
 * Fire-and-forget: notifies admins of a new user signup requesting to create a new lab.
 */
export function notifySignupNewLab(params: {
  userName: string;
  userEmail: string;
}): void {
  const { userName, userEmail } = params;

  Promise.resolve()
    .then(() => {
      const text = loadTemplate("signup-new-lab", {
        userName,
        userEmail,
        when: new Date().toISOString(),
      });
      return sendMail(
        `[SUM ODP] New user signup — new living lab request: ${userName}`,
        text,
      );
    })
    .catch((err) => {
      console.error("[admin-notifier] Failed to send signup-new-lab email:", err);
    });
}

/**
 * Fire-and-forget: notifies admins of a new user signup requesting editor access to an existing lab.
 */
export function notifySignupExistingLab(params: {
  userName: string;
  userEmail: string;
  labId: string;
  labName: string;
}): void {
  const { userName, userEmail, labId, labName } = params;

  Promise.resolve()
    .then(() => {
      const text = loadTemplate("signup-existing-lab", {
        userName,
        userEmail,
        labId,
        labName,
        when: new Date().toISOString(),
      });
      return sendMail(
        `[SUM ODP] New user signup — editor request for "${labName}": ${userName}`,
        text,
      );
    })
    .catch((err) => {
      console.error(
        "[admin-notifier] Failed to send signup-existing-lab email:",
        err,
      );
    });
}
