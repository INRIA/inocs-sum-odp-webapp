export interface SessionLivingLabCookie {
  id: string;
  name: string;
  authorizedLabs?: { id: string; name: string }[];
}
