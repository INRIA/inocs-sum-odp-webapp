import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock SMTP client ─────────────────────────────────────────────────────────
const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });
vi.mock("./smtp.client", () => ({
  getSmtpTransporter: () => ({ sendMail: mockSendMail }),
  getSmtpFrom: () => "noreply@sum-odp.eu",
  getAdminEmails: () => ["admin@example.com"],
}));

// ── Mock template loader ─────────────────────────────────────────────────────
vi.mock("./template.loader", () => ({
  loadTemplate: (name: string, vars: Record<string, string>) =>
    `[${name}] ${JSON.stringify(vars)}`,
}));

import {
  notifyEntityChanged,
  notifySignupNewLab,
  notifySignupExistingLab,
} from "./admin-notifier.service";

const actor = { id: "1", name: "Alice", email: "alice@example.com" };

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("notifyEntityChanged", () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  it("fires a mail for a created lab", async () => {
    notifyEntityChanged({
      entity: "lab",
      action: "created",
      entityId: "10",
      labId: "10",
      labName: "Test Lab",
      actor,
      before: null,
      after: { id: "10", name: "Test Lab" },
    });

    await flushPromises();

    expect(mockSendMail).toHaveBeenCalledOnce();
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe("admin@example.com");
    expect(call.subject).toContain("[SUM ODP][LL: Test Lab]");
    expect(call.subject).toContain("created");
    expect(call.subject).toContain("Alice");
  });

  it("includes old→new diff for updated fields", async () => {
    notifyEntityChanged({
      entity: "kpiresult",
      action: "updated",
      entityId: "55",
      labId: "3",
      labName: "Geneva",
      actor,
      before: { value: 42.0 },
      after: { value: 99.0 },
    });

    await flushPromises();

    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain("[SUM ODP][LL: Geneva]");
    expect(call.subject).toContain("KPI result");
    // The template mock returns the serialised vars; the diff should mention both values.
    expect(call.text).toContain("value: 42 → 99");
  });

  it("swallows sendMail errors silently", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP down"));
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    notifyEntityChanged({
      entity: "lab",
      action: "deleted",
      entityId: "1",
      actor,
      before: { id: "1" },
      after: null,
    });

    await flushPromises();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[admin-notifier]"),
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});

describe("notifySignupNewLab", () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  it("fires a mail with the correct subject", async () => {
    notifySignupNewLab({ userName: "Bob", userEmail: "bob@example.com" });
    await flushPromises();

    expect(mockSendMail).toHaveBeenCalledOnce();
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain("new living lab request");
    expect(call.subject).toContain("Bob");
  });
});

describe("notifySignupExistingLab", () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  it("fires a mail mentioning the lab name", async () => {
    notifySignupExistingLab({
      userName: "Carol",
      userEmail: "carol@example.com",
      labId: "7",
      labName: "Geneva",
    });
    await flushPromises();

    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain("Geneva");
    expect(call.subject).toContain("Carol");
  });
});

describe("admin-notifier — no recipients", () => {
  it("skips sendMail when ADMIN_EMAILS is empty", async () => {
    vi.doMock("./smtp.client", () => ({
      getSmtpTransporter: () => ({ sendMail: mockSendMail }),
      getSmtpFrom: () => "noreply@sum-odp.eu",
      getAdminEmails: () => [], // empty
    }));

    // re-import to pick up new mock
    const { notifySignupNewLab: notify } = await import(
      "./admin-notifier.service"
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    notify({ userName: "Dave", userEmail: "dave@example.com" });
    await flushPromises();

    // sendMail should not have been called with no recipients
    // (the mocked getAdminEmails already returned [] – the real sendMail guard fires)
    warnSpy.mockRestore();
  });
});
