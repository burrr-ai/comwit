import type { Metadata } from "next";
import { siteConfig } from "./site-config";

export type MetadataOverrides = {
  /** Page title. The root template combines it as "Title | Site name". */
  title?: string;
  /** Page description. */
  description?: string;
  /** Page path (e.g. "/about") for canonical and og:url. */
  path?: string;
  /** Override the OG image with an absolute or relative path. */
  ogImage?: string;
  /** Prevent search indexing (e.g. admin or temporary pages). */
  noIndex?: boolean;
  /** og:type; use "article" for posts. */
  type?: "website" | "article";
};

/**
 * Shared metadata builder.
 *
 * Read defaults from siteConfig and override only supplied values.
 *
 * Static page:
 *   export const metadata = buildMetadata({ title: "About", description: "..." });
 *
 * Dynamic route:
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
 * Metadata for the root layout.
 * - Apply the title template ("Page | Site name").
 * - metadataBase is config.SITE_URL, resolving relative paths such as og:image.
 * - Pages set canonical and og:url themselves with buildMetadata({ path }).
 * - Do not read request headers; keep metadata in the static Cache Components shell.
 *
 * In src/app/layout.tsx:
 *   export const metadata = rootMetadata(config.SITE_URL);
 */
export function rootMetadata(siteUrl?: string): Metadata {
  // Omit root canonical/og:url; otherwise every child page inherits "/".
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

