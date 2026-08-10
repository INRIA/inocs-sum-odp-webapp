import { describe, it, expect } from "vitest";
import { resolveExperience } from "./registry";

// Helper to build URLSearchParams quickly
function sp(params: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams(params);
}

describe("resolveExperience", () => {
  it("resolves /data/kpis to data experience", () => {
    const state = resolveExperience("/data/kpis", sp());
    expect(state.active).toBe("data");
    expect(state.isShared).toBe(false);
    expect(state.switchSegments[0].active).toBe(true); // Data segment
    expect(state.switchSegments[1].active).toBe(false); // Insights segment
  });

  it("resolves /data/measures to data experience", () => {
    const state = resolveExperience("/data/measures", sp());
    expect(state.active).toBe("data");
  });

  it("resolves /data/modal-split to data experience", () => {
    const state = resolveExperience("/data/modal-split", sp());
    expect(state.active).toBe("data");
  });

  it("resolves /data/collection-plan to data experience", () => {
    const state = resolveExperience("/data/collection-plan", sp());
    expect(state.active).toBe("data");
  });

  it("resolves /tools/impact_analysis to data experience", () => {
    const state = resolveExperience("/tools/impact_analysis", sp());
    expect(state.active).toBe("data");
  });

  it("resolves /tools/mcda_analysis prefix routes to data experience", () => {
    const state = resolveExperience("/tools/mcda_analysis/step-1", sp());
    expect(state.active).toBe("data");
  });

  it("resolves /faq to shared, defaults to data without ?view=", () => {
    const state = resolveExperience("/faq", sp());
    expect(state.active).toBe("data");
    expect(state.isShared).toBe(true);
    expect(state.viewParam).toBeNull();
  });

  it("resolves /faq?view=insights to insights experience", () => {
    const state = resolveExperience("/faq", sp({ view: "insights" }));
    expect(state.active).toBe("insights");
    expect(state.isShared).toBe(true);
    expect(state.viewParam).toBe("insights");
  });

  it("resolves /faq?view=data to data experience explicitly", () => {
    const state = resolveExperience("/faq", sp({ view: "data" }));
    expect(state.active).toBe("data");
    expect(state.isShared).toBe(true);
    expect(state.viewParam).toBe("data");
  });

  it("resolves /legal-notice to shared", () => {
    const state = resolveExperience("/legal-notice", sp());
    expect(state.isShared).toBe(true);
  });

  it("resolves /privacy-policy to shared", () => {
    const state = resolveExperience("/privacy-policy", sp());
    expect(state.isShared).toBe(true);
  });

  it("resolves / to landing (active = null)", () => {
    const state = resolveExperience("/", sp());
    expect(state.active).toBeNull();
    expect(state.isShared).toBe(false);
    expect(state.switchSegments[0].active).toBe(false);
    expect(state.switchSegments[1].active).toBe(false);
  });

  it("resolves /living-lab-city/5 with counterpart /insights/city/5", () => {
    const state = resolveExperience("/living-lab-city/5", sp());
    expect(state.active).toBe("data");
    // The Insights segment should point to the counterpart
    const insightsSeg = state.switchSegments.find((s) => s.label === "Insights");
    expect(insightsSeg?.href).toBe("/insights/city/5");
  });

  it("resolves /living-lab-city/amsterdam with counterpart /insights/city/amsterdam", () => {
    const state = resolveExperience("/living-lab-city/amsterdam", sp());
    const insightsSeg = state.switchSegments.find((s) => s.label === "Insights");
    expect(insightsSeg?.href).toBe("/insights/city/amsterdam");
  });

  it("resolves /insights/city/5 to insights experience with counterpart /living-lab-city/5", () => {
    const state = resolveExperience("/insights/city/5", sp());
    expect(state.active).toBe("insights");
    const dataSeg = state.switchSegments.find((s) => s.label === "Data & tools");
    expect(dataSeg?.href).toBe("/living-lab-city/5");
  });

  it("resolves unknown route to landing by default", () => {
    const state = resolveExperience("/some/unknown/route", sp());
    expect(state.active).toBeNull();
  });

  it("returns Insights menu on an Insights route", () => {
    const state = resolveExperience("/insights/city/1", sp());
    const labels = state.menu.map((m) => m.label);
    expect(labels).toContain("What works");
    expect(labels).toContain("Cities");
  });

  it("returns Data menu on a Data route", () => {
    const state = resolveExperience("/data/kpis", sp());
    const labels = state.menu.map((m) => m.label);
    expect(labels).toContain("Data");
    expect(labels).toContain("Tools");
  });

  it("injects living lab items into Data menu", () => {
    const labs = [
      { href: "/living-lab-city/1", label: "City A" },
      { href: "/living-lab-city/2", label: "City B" },
    ];
    const state = resolveExperience("/data/kpis", sp(), labs);
    const llItem = state.menu.find((m) => m.label === "Living Labs");
    expect(llItem?.subItems).toHaveLength(2);
    expect(llItem?.subItems?.[0].label).toBe("City A");
  });

  it("data switch segment href falls back to /data/kpis when no counterpart", () => {
    const state = resolveExperience("/data/measures", sp());
    const dataSeg = state.switchSegments.find((s) => s.label === "Data & tools");
    expect(dataSeg?.href).toBe("/data/kpis");
  });

  it("insights switch segment href falls back to /insights when no counterpart", () => {
    const state = resolveExperience("/data/measures", sp());
    const insightsSeg = state.switchSegments.find((s) => s.label === "Insights");
    expect(insightsSeg?.href).toBe("/insights");
  });

  it("resolves /join to shared experience", () => {
    const state = resolveExperience("/join", sp());
    expect(state.isShared).toBe(true);
  });
});
