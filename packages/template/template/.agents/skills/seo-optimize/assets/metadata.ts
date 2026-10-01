import type { Metadata } from "next";
import { siteConfig } from "./site-config";

export type MetadataOverrides = {
  /** 페이지 타이틀. 루트 template에 의해 "타이틀 | 사이트명"으로 합쳐집니다. */
  title?: string;
  /** 페이지 설명 */
  description?: string;
  /** 페이지 경로 (예: "/about") — canonical / og:url 용 */
  path?: string;
  /** OG 이미지 덮어쓰기 (절대 또는 상대 경로) */
  ogImage?: string;
  /** 검색엔진 노출 차단 (관리자/임시 페이지 등) */
  noIndex?: boolean;
  /** og:type — 글/포스트면 "article" */
  type?: "website" | "article";
};

/**
 * 공통 메타데이터 빌더.
 *
 * 기본값은 siteConfig에서 가져오고, 넘긴 값만 부분적으로 덮어씁니다.
 *
 * 정적 페이지:
 *   export const metadata = buildMetadata({ title: "소개", description: "..." });
 *
 * 동적 라우트:
 *   export function generateMetadata({ params }) {
 *     return buildMetadata({ title: post.title, description: post.excerpt, path: `/blog/${slug}`, type: "article" });
 *   }
 */
export function buildMetadata(overrides: MetadataOverrides = {}): Metadata {
  const title = overrides.title ?? siteConfig.title;
  const description = overrides.description ?? siteConfig.description;
  const ogImage = overrides.ogImage ?? siteConfig.ogImage;
  const url = overrides.path ?? "/";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: overrides.type ?? "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      ...(siteConfig.twitterHandle ? { site: siteConfig.twitterHandle } : {}),
    },
    robots: overrides.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/**
 * 루트 레이아웃 전용 메타데이터.
 * - title 템플릿 적용 ("페이지 | 사이트명")
 * - metadataBase = 배포 주소(config.SITE_URL) — og:image 같은 상대 경로를 절대 URL로 바꾼다
 * - canonical·og:url은 페이지가 buildMetadata({ path })로 직접 정한다
 * - 요청 데이터(headers)를 읽지 않는다 — Cache Components의 정적 셸에 그대로 실린다.
 *
 * src/app/layout.tsx 에서:
 *   export const metadata = rootMetadata(config.SITE_URL);
 */
export function rootMetadata(siteUrl?: string): Metadata {
  // 루트에는 canonical·og:url을 두지 않는다 — 하위 페이지가 물려받으면 모든 페이지가 "/"를 가리키게 된다.
  const { alternates: _alternates, openGraph, ...base } = buildMetadata();
  const { url: _url, ...rootOpenGraph } = openGraph ?? {};
  return {
    ...base,
    openGraph: rootOpenGraph,
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.name}`,
    },
    applicationName: siteConfig.name,
    manifest: "/manifest.webmanifest",
  };
}

