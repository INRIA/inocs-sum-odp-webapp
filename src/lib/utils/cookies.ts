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

// ---------------------------------------------------------------------------
// Admin mode cookie — remembers that an admin chose the editor space for the
// current browser session (no maxAge = clears on browser close).
// ---------------------------------------------------------------------------

const ADMIN_MODE_COOKIE = "admin_mode";

export function getAdminModeCookie(cookies: AstroCookies): string | undefined {
  return cookies.get(ADMIN_MODE_COOKIE)?.value;
}

export function setAdminModeCookie(
  cookies: AstroCookies,
  mode: "editor",
  options?: { secure?: boolean }
): void {
  cookies.set(ADMIN_MODE_COOKIE, mode, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: options?.secure ?? false,
    // No maxAge — session cookie, cleared when the browser tab/window closes
  });
}

export function clearAdminModeCookie(cookies: AstroCookies): void {
  cookies.delete(ADMIN_MODE_COOKIE, { path: "/" });
}
