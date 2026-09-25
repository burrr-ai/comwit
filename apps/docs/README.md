# Comwit documentation

One Next.js application for Comwit State and Comwit UI.

```bash
pnpm install
pnpm dev:docs
```

- `/` — expressive Comwit landing with direct documentation entry points.
- `/state/docs` — original animated panda landing alongside the documentation sidebar; `/state/docs/*` for guides and APIs. `/state` redirects here.
- `/ui` — UI overview, installation, components, examples and theming.
- `public/state/llms.txt`, `public/ui/llms.txt` — independent agent guides. The UI one is generated (install + component catalog) from `content/ui/llms-template.txt` and `gallery.mjs`.
- `content/state/` — State MDX.
- `content/ui/` — UI editorial docs and component metadata.
- `scripts/gen-ui.mjs` — UI examples, source and `public/ui/llms.txt` generated from Storybook specs, the CLI registry and the gallery.
- `public/icon.svg` — the Comwit mark; `scripts/gen-icons.mjs` regenerates the favicon, touch and manifest icons from it. See `design/brand.md`.

The development and production build scripts build the runtime packages and generate UI content first. Theme editing is isolated at `/preview/ui/theme` inside an iframe. Site CSS tokens use `--site-*` names.

Legacy State docs and agent links are redirected in `next.config.ts`. Keep these redirects when reorganizing content.

```bash
pnpm --filter docs lint
pnpm --filter docs typecheck
pnpm build
```
