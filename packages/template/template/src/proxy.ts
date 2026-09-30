import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_BASE_PATH,
  INTERNAL_ADMIN_BASE_PATH,
  getPathSuffix,
  isPathWithin,
} from "@/lib/admin-routes";

// This request proxy is routing-only. Authentication stays in server layouts.
export function proxy(request: NextRequest) {
  if (ADMIN_BASE_PATH === INTERNAL_ADMIN_BASE_PATH) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Block direct internal requests before rewriting the public prefix.
  if (isPathWithin(pathname, INTERNAL_ADMIN_BASE_PATH)) {
    // A missing-page rewrite can be swallowed by a parallel-route catch-all.
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Route HTML, RSC navigation/prefetch, and auth API requests identically.
  // Avoid afterFiles/wildcard rewrites being bypassed by hosted route matching.
  const suffix = getPathSuffix(pathname, ADMIN_BASE_PATH);
  if (suffix !== null) {
    const internalUrl = request.nextUrl.clone();
    internalUrl.pathname = `${INTERNAL_ADMIN_BASE_PATH}${suffix}`;
    return NextResponse.rewrite(internalUrl);
  }

  return NextResponse.next();
}

// Keep the public admin prefix and /admin/api/auth covered by this matcher.
export const config = {
  matcher: [
    "/((?!api/|api$|_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
