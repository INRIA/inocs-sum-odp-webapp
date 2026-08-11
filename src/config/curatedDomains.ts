// Placeholder IDs — to be confirmed by WP1 + WP5
// With placeholder -1, hasCuratedSet returns false and all domains show (graceful degradation)
export const CURATED_DOMAIN_IDS: Set<number | string> = new Set([-1]);

export function isCuratedDomain(groupId: number | string): boolean {
  return CURATED_DOMAIN_IDS.has(groupId);
}

export const hasCuratedSet: boolean = !CURATED_DOMAIN_IDS.has(-1);
