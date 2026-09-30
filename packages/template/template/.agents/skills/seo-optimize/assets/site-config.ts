/**
 * 사이트 공통 SEO 설정값 (Single Source of Truth)
 *
 * 이 값만 서비스에 맞게 바꾸면 전역 메타데이터 / OG / 트위터 / JSON-LD에 모두 반영됩니다.
 * 페이지별로 다르게 하고 싶으면 buildMetadata({ ... })로 부분만 덮어쓰세요.
 */
export const siteConfig = {
  /** 사이트/서비스 이름 (title 템플릿, siteName, JSON-LD에 사용) */
  name: "My App",
  /** 기본 타이틀 */
  title: "My App",
  /** 기본 설명 (검색결과 / OG description) */
  description:
    "Next.js 16 으로 만든 서비스입니다. 서비스에 맞게 이 설명을 바꾸세요.",
  /** OG 이미지 경로 — public/og.png (권장 1200x630) */
  ogImage: "/og.png",
  /** 콘텐츠 언어/지역 (예: ko_KR, en_US) */
  locale: "ko_KR",
  /** <html lang> 값 (예: ko, en) */
  lang: "ko",
  /** 트위터 핸들(@포함). 없으면 빈 문자열로 둡니다. */
  twitterHandle: "",
} as const;

export type SiteConfig = typeof siteConfig;
