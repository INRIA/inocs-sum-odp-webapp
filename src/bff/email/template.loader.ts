/**
 * Loads plain-text email templates bundled with the Vite/Astro SSR build
 * and interpolates {{variable}} placeholders.
 *
 * Templates live in src/bff/email/templates/*.txt.
 * They are imported eagerly via import.meta.glob so they are included in the
 * server bundle without requiring runtime fs access.
 */

// Eagerly import all .txt templates at build time so they bundle with the SSR output.
const templates = import.meta.glob("./templates/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Returns an interpolated template string for the given template name.
 *
 * @param name  Filename without path or extension, e.g. "entity-changed"
 * @param vars  Key/value pairs to substitute for {{key}} placeholders
 */
export function loadTemplate(
  name: string,
  vars: Record<string, string>,
): string {
  const key = `./templates/${name}.txt`;
  const raw = templates[key];

  if (!raw) {
    throw new Error(`[template-loader] Template not found: ${name}`);
  }

  return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
