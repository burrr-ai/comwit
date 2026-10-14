/**
 * Shared site SEO configuration (single source of truth).
 *
 * Changing these values updates global metadata, OG, Twitter, and JSON-LD.
 * Use buildMetadata({ ... }) for individual page overrides.
 */
export const siteConfig = {
  /** Site/service name used by the title template, siteName, and JSON-LD. */
  name: "My App",
  /** Default title. */
  title: "My App",
  /** Default description for search results and OG. */
  description:
    "A service built with Next.js 16. Customize this description for your project.",
  /** OG image path: public/og.png (recommended: 1200×630). */
  ogImage: "/og.png",
  /** Content language/region (e.g. ko_KR, en_US). */
  locale: "ko_KR",
  /** <html lang> value (e.g. ko, en). */
  lang: "ko",
  /** Twitter handle, including @. Leave empty when unavailable. */
  twitterHandle: "",
} as const;

export type SiteConfig = typeof siteConfig;
