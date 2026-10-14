import type { MetadataRoute } from "next";
import { config } from "@/server/config";
import { ADMIN_BASE_PATH } from "@/lib/admin-routes";

/**
 * Generate /robots.txt (src/app/robots.ts).
 * Tell crawlers where to find the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = config.SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Block private paths such as admin here.
      disallow: [ADMIN_BASE_PATH],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
