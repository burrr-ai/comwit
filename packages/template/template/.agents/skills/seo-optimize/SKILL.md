---
name: seo-optimize
description: Set up shared SEO metadata, OG images, favicon, JSON-LD, sitemap, and robots together. Use for SEO/search optimization, meta tags, OG setup, sharing images, favicons, structured data, or JSON-LD.
---

# SEO Optimization

For an SEO request, complete **every step below** consistently across Claude Code, Codex, and Antigravity.

Install the **shared `src/lib/seo` utilities once**, then let each page override only its differing values with `buildMetadata({ ... })`. Keep site-wide defaults consistent.

## 0. Collect inputs in chat

The user cannot see the project folders/files; collect these through chat:

- **OG sharing image:** request a landscape thumbnail for shared links (recommended: 1200×630), then save it as `public/og.png`.
- **Favicon:** request a square logo for browser tabs, then save it as `src/app/icon.png` and `src/app/apple-icon.png`.
- **Site information:** service name, one-line description, and domain if available. Fill unknowns from the current brief and explain they can be changed later.

If images are not ready, preserve existing `public/og.png` and `src/app/favicon.ico` and continue with the remaining work.

## 1. Install shared utilities if missing

If `src/lib/seo/` does not exist, copy the assets:

```bash
mkdir -p src/lib/seo
cp .agents/skills/seo-optimize/assets/site-config.ts src/lib/seo/site-config.ts
cp .agents/skills/seo-optimize/assets/metadata.ts    src/lib/seo/metadata.ts
cp .agents/skills/seo-optimize/assets/json-ld.tsx    src/lib/seo/json-ld.tsx
cp .agents/skills/seo-optimize/assets/index.ts       src/lib/seo/index.ts
```

**Customize `src/lib/seo/site-config.ts`: name, title, description, locale, lang, and twitterHandle.** These are the global defaults.

## 2. Connect the root layout (`src/app/layout.tsx`)

Replace inline metadata with the shared utilities.

- Add imports:
  ```ts
  import { JsonLd, rootMetadata, websiteJsonLd } from "@/lib/seo";
  import { config } from "@/server/config";
  ```
- Replace the entire existing `metadata`/`generateMetadata` block:
  ```ts
  export const metadata: Metadata = rootMetadata(config.SITE_URL);
  ```
- `config.SITE_URL` is the deployment URL, read from the deployment environment (or local `.env`) `SITE_URL` value. Change that value when the domain changes.
  It supplies `metadataBase`, resolving paths such as `/og.png` to absolute URLs required by KakaoTalk/Facebook previews.
- **Never read the host with `headers()` in metadata, sitemap, or robots.** With Cache Components (`cacheComponents: true`), request-dependent metadata blocks static builds. Workarounds can stream OG tags outside `<head>` for `kakaotalk-scrap`, which is absent from Next's default bot list.
- `rootMetadata` omits canonical and og:url so child pages do not all inherit "/". Each page sets these with `buildMetadata({ path })`.
- Set `<html lang>` to `siteConfig.lang`, matching the locale (for example `ko` or `en`).
- Insert JSON-LD at the start of `<body>`:
  ```tsx
  <JsonLd data={websiteJsonLd()} />
  ```

## 3. Install sitemap and robots if missing

```bash
cp .agents/skills/seo-optimize/assets/sitemap.ts src/app/sitemap.ts
cp .agents/skills/seo-optimize/assets/robots.ts  src/app/robots.ts
```

- Both use `config.SITE_URL` and build statically without request host reads.
- Check that `robots.ts` `disallow` includes `ADMIN_BASE_PATH` and other private routes.
- Add public paths to `sitemap.ts` `routes`. Read dynamic lists such as posts from the repository and expand them with `map`.

## 4. Place favicon and OG images

- Save the favicon as `src/app/icon.png` (square, preferably 512×512), plus `src/app/apple-icon.png` for Apple devices. App Router generates the links automatically.
- Existing `src/app/favicon.ico` may remain as a fallback alongside `icon.png`.
- Save the sharing image as `public/og.png` (1200×630).

## 5. Override individual page values

Pages inherit global defaults and pass **only differing values**.

```ts
// Static page: src/services/app/page/about/...
import { buildMetadata } from "@/lib/seo";
export const metadata = buildMetadata({
  title: "About",
  description: "Learn about our service",
  path: "/about",
});
```

```ts
// Dynamic route, such as a post detail.
import { buildMetadata } from "@/lib/seo";
export function generateMetadata({ params }) {
  const post = /* fetch from the repository */;
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    ogImage: post.coverImage, // A sharing image specific to this post.
    path: `/blog/${post.slug}`,
    type: "article",
  });
}
```

```tsx
// Add Article structured data to a post detail.
import { JsonLd, articleJsonLd } from "@/lib/seo";
<JsonLd data={articleJsonLd({ title: post.title, image: post.coverImage, datePublished: post.createdAt })} />
```

- Block indexing for admin/temporary pages with `buildMetadata({ noIndex: true })`.
- To omit the "Title | Site name" template, such as on the home page, use `{ ...buildMetadata({ path: "/" }), title: { absolute: siteConfig.title } }`.

## 6. Validate

```bash
pnpm run validate # Fix every typecheck and lint error.
```

- [ ] Correct page-specific `<title>` and `<meta name="description">`.
- [ ] Complete OG (`og:title`, `og:description`, `og:image`) and Twitter Card values.
- [ ] Absolute `og:image`, such as `https://<app-domain>/og.png`, inside `<head>`.
      Check with `curl -A "kakaotalk-scrap/1.0" <url>`; localhost means `config.SITE_URL` is empty.
- [ ] Favicon and apple-icon applied.
- [ ] `/sitemap.xml` and `/robots.txt` respond.
- [ ] JSON-LD (`<script type="application/ld+json">`) inserted.
- [ ] `<html lang>` matches the locale.

## Handoff

- If images are still missing, tell the user they can attach them in chat for replacement.
- The user can verify sharing previews by pasting the link into KakaoTalk, Slack, or another sharing app.
