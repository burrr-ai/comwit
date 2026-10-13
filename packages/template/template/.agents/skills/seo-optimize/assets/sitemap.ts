import type { MetadataRoute } from "next";
import { config } from "@/server/config";

/**
 * Generate /sitemap.xml (src/app/sitemap.ts).
 *
 * Add new public paths to routes.
 * Read dynamic routes, such as blog posts, from the repository and map them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = config.SITE_URL ?? "http://localhost:3000";

  const routes = ["/"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
