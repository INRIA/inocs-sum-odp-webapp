import type { User } from "../../types";

/** The role_id assigned to administrators in the roles table (seed: id=1, name="Admin"). */
export const ADMIN_ROLE_ID = 1;

/** Returns true if the given user holds the Admin role. */
export function isAdminUser(user: User | undefined | null): boolean {
  if (!user) return false;
  const roleId: number | string | "bigint" | undefined = user.role_id;
  if (roleId === undefined) {
    console.warn("User object does not have a role_id field:", user);
    return false;
  }
  // Handle both number and string representations of the role ID
  return (
    roleId === ADMIN_ROLE_ID ||
    (typeof roleId === "string" && roleId === ADMIN_ROLE_ID.toString()) ||
    (typeof roleId === "bigint" && roleId === BigInt(ADMIN_ROLE_ID))
  );
}
