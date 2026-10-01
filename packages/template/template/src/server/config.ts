import "server-only";

/**
 * Server-side configuration
 *
 * Read ordinary server settings here (API keys, secrets, etc.).
 * Database/storage server-only modules may read process.env directly.
 * Node configuration such as drizzle.config.ts must not import this module.
 * This file is protected by 'server-only' - it cannot be imported in client components.
 *
 * Usage:
 * import { config } from '@/server/config';
 * const apiKey = config.SOME_API_KEY;
 */

export const config = {
  NODE_ENV: process.env.NODE_ENV ?? "production",

  // 배포 주소 — og:image·sitemap 같은 절대 URL의 기준. 배포 환경(필요하면 로컬 .env)의
  // SITE_URL 로 정한다. 비어 있으면 seo-optimize 가 상대 경로로 둔다.
  SITE_URL: process.env.SITE_URL,
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
