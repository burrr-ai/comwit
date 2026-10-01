import type { MetadataRoute } from "next";
import { config } from "@/server/config";

/**
 * /sitemap.xml 자동 생성 (src/app/sitemap.ts).
 *
 * 공개 라우트가 늘어나면 routes 배열에 경로를 추가하세요.
 * 동적 경로(블로그 글 등)는 repository에서 목록을 읽어와 map으로 펼칩니다.
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
