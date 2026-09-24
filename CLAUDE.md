# Repository guide

Comwit is a pnpm workspace containing independent State and UI libraries used in comwit.io templates.

## Commands

- `pnpm install` — install the pinned workspace dependencies.
- `pnpm build` — build the two runtime packages, generate UI docs, and build the docs site.
- `pnpm test` — State tests and workspace/CLI integration tests.
- `pnpm typecheck` — generate required artifacts and typecheck workspaces.
- `pnpm dev:docs` — start the shared documentation app.
- `pnpm dev:state` / `pnpm dev:ui` — watch-build a runtime.
- `pnpm dev:playground`, `pnpm dev:ui-catalog`, `pnpm storybook` — development apps.

## Boundaries

- `packages/state/core` (`@comwit/state`) owns state, query/local descriptors, actions and interceptors. `es-toolkit` is its sole runtime dependency. Its Vitest configuration is in `vite.config.ts`; React integration tests use happy-dom.
- `packages/ui/core` (`@comwit/ui`) owns headless behavior and accessibility.
- `packages/ui/templates` (`@comwit/ui-templates`) owns editable component source and the shared CSS token contract.
- `packages/ui/cli` (`comwit-ui`) installs component source into consumer projects. Generate its registry from templates; do not edit generated JSON.
- `apps/docs` owns the shared site, product-specific human docs and separate llms.txt files. Generate UI previews from Storybook specs and registry source.

Keep public package names, independent versions, and runtime exports stable during repository maintenance. Site branding must not change the UI library's token defaults. Never couple the UI engine to State just to support a docs example.

See CONTRIBUTING.md for generation, verification and release details.
