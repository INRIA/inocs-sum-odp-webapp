import type { User } from "../../types";

/** The role_id assigned to administrators in the roles table (seed: id=1, name="Admin"). */
export const ADMIN_ROLE_ID = 1;

/** Returns true if the given user holds the Admin role. */
export function isAdminUser(user: User | undefined | null): boolean {
  return user?.role_id === ADMIN_ROLE_ID;
}
