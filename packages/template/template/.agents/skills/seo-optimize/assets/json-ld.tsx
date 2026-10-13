import { siteConfig } from "./site-config";

/**
 * Insert JSON-LD structured data.
 *
 * In a layout/page:
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

/** WebSite schema describing the site (recommended in the root layout). */
export function websiteJsonLd(overrides: Record<string, unknown> = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    ...overrides,
  };
}

/** Organization schema for the operating company or team. */
export function organizationJsonLd(overrides: Record<string, unknown> = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    ...overrides,
  };
}

/** Article schema for blog posts and news. */
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
