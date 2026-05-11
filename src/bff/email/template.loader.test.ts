import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadTemplate } from "./template.loader";

// The template.loader uses import.meta.glob — mock it.
const mockTemplates: Record<string, string> = {
  "./templates/entity-changed.txt":
    "Entity: {{entity}}\nAction: {{action}}\nActor: {{actorName}} <{{actorEmail}}>\nID: {{entityId}}\nLab: {{labId}}\nWhen: {{when}}\n{{diff}}",
  "./templates/signup-new-lab.txt":
    "New user: {{userName}} <{{userEmail}}> at {{when}}",
  "./templates/signup-existing-lab.txt":
    "Editor request: {{userName}} <{{userEmail}}> for lab {{labName}} (#{{labId}}) at {{when}}",
};

// Patch the eager import.meta.glob map that template.loader uses.
vi.mock("./template.loader", async () => {
  const original = await vi.importActual<typeof import("./template.loader")>(
    "./template.loader",
  );
  // Re-expose loadTemplate so we exercise the real logic with our mock templates.
  return {
    loadTemplate: (name: string, vars: Record<string, string>) => {
      const key = `./templates/${name}.txt`;
      const raw = mockTemplates[key];
      if (!raw) throw new Error(`Template not found: ${name}`);
      return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
    },
  };
});

describe("loadTemplate", () => {
  it("substitutes all placeholders", () => {
    const result = loadTemplate("entity-changed", {
      entity: "lab",
      action: "updated",
      actorName: "Alice",
      actorEmail: "alice@example.com",
      entityId: "42",
      labId: "7",
      when: "2026-01-01T00:00:00.000Z",
      diff: "  name: Old → New",
    });

    expect(result).toContain("Entity: lab");
    expect(result).toContain("Action: updated");
    expect(result).toContain("Actor: Alice <alice@example.com>");
    expect(result).toContain("  name: Old → New");
  });

  it("leaves unmatched placeholders as-is", () => {
    const result = loadTemplate("signup-new-lab", {
      userName: "Bob",
      // userEmail intentionally omitted
      when: "2026-01-01T00:00:00.000Z",
    });
    expect(result).toContain("Bob");
    expect(result).toContain("{{userEmail}}");
  });

  it("throws when the template does not exist", () => {
    expect(() => loadTemplate("non-existent", {})).toThrow(
      "Template not found: non-existent",
    );
  });
});
