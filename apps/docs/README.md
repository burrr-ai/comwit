# Comwit documentation

One Next.js application for Comwit State and Comwit UI.

```bash
pnpm install
pnpm dev:docs
```

- `/` — expressive Comwit landing with direct documentation entry points.
- `/state/docs` — original animated panda landing alongside the documentation sidebar; `/state/docs/*` for guides and APIs. `/state` redirects here.
- `/ui` — UI overview, installation, components, examples and theming.
- `public/state/llms.txt`, `public/ui/llms.txt` — independent agent guides.
- `content/state/` — State MDX.
- `content/ui/` — UI editorial docs and component metadata.
- `scripts/gen-ui.mjs` — UI examples and source generated from Storybook specs and the CLI registry.

The development and production build scripts build the runtime packages and generate UI content first. Theme editing is isolated at `/preview/ui/theme` inside an iframe. Site CSS tokens use `--site-*` names.

Legacy State docs and agent links are redirected in `next.config.ts`. Keep these redirects when reorganizing content.

```bash
pnpm --filter docs lint
pnpm --filter docs typecheck
pnpm build
```
