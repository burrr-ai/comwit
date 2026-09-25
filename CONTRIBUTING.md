# Contributing

## Working on a library

Install with `pnpm install` at the repository root. State and UI have independent public APIs and versions. Keep the UI runtime independent of State.

- State source and tests: `packages/state/core`.
- UI behavior: `packages/ui/core`.
- Editable UI component source and shared tokens: `packages/ui/templates`.
- UI installer and bundled registry: `packages/ui/cli`.

Use the existing tests and add regression coverage when behavior changes. The workspace integration tests verify that moved CLI paths still produce usable component source without overwriting local consumer edits.

## Documentation

`apps/docs` is the only public documentation app. State MDX lives in `content/state`; UI guides and the gallery layout (`content/ui/gallery.mjs`: groups, order and one-line summaries) live in `content/ui`. The site has shared navigation and separate product routes.

State agent guidance lives in `public/state/llms.txt` and `public/state/llm/`; update it when State's public API changes. UI agent guidance is `public/ui/llms.txt`, kept to installation and a catalog of what each component is for: the generator fills `content/ui/llms-template.txt` (install steps and setup rules) with the groups and summaries from `gallery.mjs`. Edit the template or the gallery, not the output; usage details belong in the installation guide and the component source.

UI examples are generated from `apps/storybook/specs/*.mjs`; the story marked `gallery: true` is the one shown on the gallery card, and `docsOnly: true` specs produce docs examples without a Storybook story. The registry comes from the actual template files. Every template component must appear once in `gallery.mjs`; the generator warns about gaps. Run `pnpm --filter docs gen` after changing specs or template source. Do not hand-edit `app/ui/_generated`, `public/ui/llms.txt` or `packages/ui/cli/registry`.

The theme editor runs inside an iframe so CSS changes and portaled components cannot change the outer documentation shell. Site tokens use the `--site-` prefix to avoid colliding with library tokens.

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm --filter storybook build
pnpm --filter ui-dev build
pnpm --filter state-playground build
```

Use the browser to check the home page, product navigation, mobile menus, live UI examples, theme isolation, and legacy redirects. `pnpm --filter docs lint` checks the documentation source.

## Releases

The packages retain independent versions: State, the UI engine, template sources, and the CLI need not be released together. Use package-specific tags for future package releases. A repository/documentation milestone may use a `libraries-YYYY-MM-DD` tag; it does not imply a new npm version.

Before publishing a package, build/typecheck it and inspect its packed contents. For the CLI, `prepack` generates its bundled registry. This repository does not automatically publish npm packages when a GitHub release is created.

## Repository consolidation

State was imported from `burrr-ai/comwit` at `477113cc24db0e5b3222905177cdbef36ce63df7` (v2.4.0).
UI was imported from the local `comwit-ui` checkout based on `f34fff2`, including the existing uncommitted template/token refinements. The original UI checkout was left unchanged. Public package names and versions are retained.

Old `/docs/*`, `/llms.txt`, and `/llm/*` URLs redirect to their State equivalents. The `comwit` compatibility package is removed from this workspace; existing registry publications are not unpublished.
