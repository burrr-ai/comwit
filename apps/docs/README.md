# comwit documentation

The Next.js documentation site for `@comwit/state`, served at [library.comwit.io](https://library.comwit.io).

```sh
# From the repository root
yarn install --frozen-lockfile
yarn workspace docs dev
```

The dev and build lifecycle scripts compile the local library first so the landing page's counter runs the actual workspace implementation. If Turbopack encounters a local filesystem/watch error, use `yarn workspace docs dev --webpack`.

```sh
yarn workspace docs lint
yarn workspace docs exec tsc --noEmit
yarn workspace docs build
```

## Content

- `content/docs/`: MDX guides and API reference. Frontmatter controls the sidebar grouping and order.
- `content/blog/`: historical release notes and articles.
- `public/llms.txt`: the compact starting contract for coding agents. Keep the core interface and examples here; link to `public/llm/` for deeper reference.
- `lib/mdx.ts`: content discovery; headings receive stable IDs during MDX rendering for direct section links.

## Landing page

`app/garden-scene.tsx` renders independent forest, panda, and particle layers. Spring motion follows the pointer; the counter uses a real comwit model/action/hook and nudges the panda. The motion toggle and system reduced-motion preference disable ambient movement. Animation work pauses when the hero leaves the viewport.

The two 1536 × 1024 WebP illustrations in `public/` were generated with the built-in ImageGen tool. `panda-garden.webp` is the original scene; its panda is cropped at display time using the registered contour in `app/globals.css`. `panda-garden-background.webp` is the same scene with the panda and laptop removed. Keep their framing aligned when replacing assets.

Art direction: an original hand-drawn panda in an orange sweatshirt using a purple laptop on a branch, textured crayon/gouache, deep aubergine night garden, sage and lavender foliage, warm chalk stars, quiet space on the right. Inspired by the playful illustration and floating demo composition of the Zustand demo. No third-party illustration was copied.

Typography: Manrope for display headings, Inter for reading and UI, Geist Mono for code. Fonts are served through `next/font`.

## Brand and navigation

The header and footer use `app/brand.tsx` with `public/panda-mark.webp`. Matching PNG icons are provided at 32px and 192px, with a 180px Apple touch icon. These are resized derivatives of a new opaque ImageGen panda mark, designed for small sizes.

Logo prompt: a bold compact panda face on a deep aubergine square, warm cream face, asymmetric plum eye patches, a friendly wink, and a small apricot nose; simplified clean curves, no text or fine fur detail, inspired by the landing mascot. Generated with the built-in ImageGen tool.

The documentation sidebar uses Phosphor icons and filters page titles, groups, and paths locally. Escape clears the filter; Enter opens the page when there is exactly one result. Filtering never changes the current article until a result is selected. The navigation list scrolls independently, keeping the search and llms.txt link available.
