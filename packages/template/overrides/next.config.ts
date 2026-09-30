import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { withServerFn } from "./src/lib/server-action/next";

function resolveAppVersion(): string {
  const envVersion =
    process.env.NEXT_DEPLOYMENT_ID ||
    process.env.DEPLOYMENT_VERSION ||
    process.env.GIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;

  if (envVersion?.trim()) return envVersion.trim();

  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "local";
  }
}

const appVersion = resolveAppVersion();
const STATIC_SHELL_CACHE_SECONDS = 365 * 24 * 60 * 60;

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // One id per deployment: the service worker namespaces its caches with it and
  // AppVersionGuard reloads clients that are still on an older build.
  deploymentId: appVersion,
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  // Cache Components separates reusable static shells/RSC payloads from
  // request-time data. Partial Prefetching then fetches only the reusable shell.
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Reuse static RSC payloads for the lifetime of this deployment. Dynamic
    // payloads always revalidate, matching the service worker's cache boundary.
    staleTimes: {
      dynamic: 0,
      static: STATIC_SHELL_CACHE_SECONDS,
    },
    serverActions: {
      bodySizeLimit: "100mb", // 기본값 1mb에서 100mb로 증가 (대용량 이미지 업로드 등을 위해)
    },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/version.json",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default withServerFn(nextConfig);
