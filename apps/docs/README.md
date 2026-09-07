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
