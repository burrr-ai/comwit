import "server-only";

/**
 * Server-side configuration
 *
 * Read ordinary server settings here (API keys, secrets, etc.).
 * Define every config entry as a getter; read env inside it so values are
 * resolved on access instead of being captured when this module is imported.
 * Database/storage server-only modules may read process.env directly.
 * Node configuration such as drizzle.config.ts must not import this module.
 * This file is protected by 'server-only' - it cannot be imported in client components.
 *
 * Usage:
 * import { config } from '@/server/config';
 * const apiKey = config.SOME_API_KEY;
 */

export const config = {
  get NODE_ENV() {
    return process.env.NODE_ENV ?? "production";
  },

  // Deployment URL: base for absolute URLs such as og:image and sitemap. Read SITE_URL
  // from deployment environment or local .env. When empty, SEO utilities retain relative paths.
  get SITE_URL() {
    return process.env.SITE_URL;
  },
} as const;

export type ServerConfigKey = keyof typeof config;

/** Read a required server value without ever including its value in errors. */
export function requireServerConfig(key: ServerConfigKey): string {
  const value = config[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Required server configuration is missing: ${key}`);
  }
  return value;
}
