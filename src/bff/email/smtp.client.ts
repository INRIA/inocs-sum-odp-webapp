import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

/**
 * Returns a singleton nodemailer Transporter configured from environment variables.
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 * Optional:
 *   SMTP_SECURE  (default: "false" — use STARTTLS; set "true" for implicit TLS on port 465)
 *
 * When SMTP_HOST is not set the function returns a no-op "null transport" that
 * only logs to the console. This keeps the dev environment functional without
 * an SMTP server.
 */
export function getSmtpTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;

  if (!host) {
    // No-op transporter: logs email to console instead of sending.
    console.warn(
      "[smtp] SMTP_HOST is not set — emails will be logged to console only.",
    );
    _transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return _transporter;
  }

  _transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });

  return _transporter;
}

/** The sender address used in the From header. */
export function getSmtpFrom(): string {
  return process.env.SMTP_FROM ?? "noreply@sum-odp.eu";
}

/** Parses ADMIN_EMAILS env var (comma-separated) into an array of trimmed addresses. */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}
