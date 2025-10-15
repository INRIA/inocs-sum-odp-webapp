import type { AstroCookies } from "astro";

export type LivingLabCookie = {
  id: string;
  name: string;
};

const COOKIE_NAME = "livingLab";

export function getLivingLabCookie(
  cookies: AstroCookies
): LivingLabCookie | undefined {
  const raw = cookies.get(COOKIE_NAME)?.value;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.id !== "undefined" &&
      typeof parsed.name === "string"
    ) {
      return {
        id: String(parsed.id),
        name: parsed.name,
        authorizedLabs: parsed.authorizedLabs ?? [],
      } as LivingLabCookie;
    }
  } catch {}
  return undefined;
}

export function setLivingLabCookie(
  cookies: AstroCookies,
  value?: LivingLabCookie,
  options?: { secure?: boolean }
): void {
  if (!value) {
    cookies.delete(COOKIE_NAME, { path: "/" });
    return;
  }
  const secure = options?.secure ?? false;
  cookies.set(COOKIE_NAME, JSON.stringify(value), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
  });
}

export function clearLivingLabCookie(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: "/" });
}
