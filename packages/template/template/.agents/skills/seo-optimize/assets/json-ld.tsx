import { siteConfig } from "./site-config";

/**
 * JSON-LD 구조화 데이터 삽입 컴포넌트.
 *
 * layout/page에서:
 *   <JsonLd data={websiteJsonLd()} />
 *   <JsonLd data={organizationJsonLd({ url: "https://example.com" })} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** 사이트 전체를 설명하는 WebSite 스키마 (루트 레이아웃 권장) */
export function websiteJsonLd(overrides: Record<string, unknown> = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    ...overrides,
  };
}

/** 운영 주체(회사/팀) Organization 스키마 */
export function organizationJsonLd(overrides: Record<string, unknown> = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    ...overrides,
  };
}

/** 블로그/뉴스 글용 Article 스키마 */
export function articleJsonLd(article: {
  title: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image ?? siteConfig.ogImage,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    author: article.authorName
      ? { "@type": "Person", name: article.authorName }
      : { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
  };
}
