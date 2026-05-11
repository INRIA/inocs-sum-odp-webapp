import { describe, it, expect } from "vitest";
import { isAdminUser, ADMIN_ROLE_ID } from "./roles";
import type { User } from "../../types";

const makeUser = (role_id: number): User =>
  ({
    id: "1",
    email: "test@example.com",
    name: "Test",
    role_id,
    status: "active",
    created_at: new Date(),
  }) as User;

describe("isAdminUser", () => {
  it("returns true for role_id === ADMIN_ROLE_ID (1)", () => {
    expect(isAdminUser(makeUser(ADMIN_ROLE_ID))).toBe(true);
  });

  it("returns false for Creator role (role_id === 2)", () => {
    expect(isAdminUser(makeUser(2))).toBe(false);
  });

  it("returns false for Member role (role_id === 3)", () => {
    expect(isAdminUser(makeUser(3))).toBe(false);
  });

  it("returns false when user is undefined", () => {
    expect(isAdminUser(undefined)).toBe(false);
  });

  it("returns false when user is null", () => {
    expect(isAdminUser(null)).toBe(false);
  });
});
