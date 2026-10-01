import type { MetadataRoute } from "next";
import { config } from "@/server/config";
import { ADMIN_BASE_PATH } from "@/lib/admin-routes";

/**
 * /robots.txt 자동 생성 (src/app/robots.ts).
 * sitemap 위치를 크롤러에게 알려줍니다.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = config.SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 관리자 등 비공개 경로는 여기서 차단
      disallow: [ADMIN_BASE_PATH],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
