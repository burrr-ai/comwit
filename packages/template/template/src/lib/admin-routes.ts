/**
 * Public admin routes.
 *
 * Generated projects replace ADMIN_BASE_PATH when admin is first built or
 * enabled. The filesystem route stays at /admin and src/proxy.ts rewrites
 * the public path to it, so app-router files never need to be renamed.
 */
export const ADMIN_BASE_PATH: string = "/관리자";

export const INTERNAL_ADMIN_BASE_PATH: string = "/admin";
export const ADMIN_AUTH_BASE_PATH = `${ADMIN_BASE_PATH}/api/auth`;
export const INTERNAL_ADMIN_AUTH_BASE_PATH = `${INTERNAL_ADMIN_BASE_PATH}/api/auth`;

export const adminRoutes = {
  dashboard: ADMIN_BASE_PATH,
  login: `${ADMIN_BASE_PATH}/login`,
  account: `${ADMIN_BASE_PATH}/account`,
} as const;

/** Match decoded prefix segments while preserving the original encoded suffix. */
export function getPathSuffix(pathname: string, basePath: string): string | null {
  const segments = pathname.split("/");
  const prefix = basePath.split("/");

  try {
    if (!prefix.every((segment, index) => decodeURIComponent(segments[index] ?? "") === segment)) {
      return null;
    }
  } catch {
    return null;
  }

  return pathname.slice(segments.slice(0, prefix.length).join("/").length);
}

export function isPathWithin(pathname: string, basePath: string) {
  return getPathSuffix(pathname, basePath) !== null;
}
