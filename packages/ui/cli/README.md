# comwit-ui

**The Comwit UI component installer.** Inspired by shadcn's source-ownership approach, this is Comwit's own tool with no dependency on the shadcn CLI, registry schema, or `components.json`. The registry is bundled in the package, so component source is available without a registry network request. Installing missing npm dependencies still requires access to the package registry.

```bash
npx comwit-ui@latest init          # Set up comwit.json and the token contract.
npx comwit-ui@latest add button    # Install components and dependencies.
```

## Commands

| Command                   | Purpose                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `comwit-ui init`          | Create `comwit.json`, wire `comwit-tokens.css`, and install base npm dependencies. |
| `comwit-ui add <name...>` | Install components, recursive `registryDependencies`, and npm `dependencies`.      |
| `comwit-ui list`          | List available components.                                                         |

**Flags:** `--cwd <dir>` chooses the target project; `--overwrite` replaces existing files; `--dry` previews without writing; `--no-install` skips npm installation; `--css <path>` selects global CSS; `--router <nextjs|react-router|tanstack-router|generic>` chooses a router-specific implementation; `--locale <en|ko>` selects default component text in `lib/ui-text`. `init` records the locale in `comwit.json`, and `add` reads it.

## How it works

1. **Copy component files** into your project's `components/ui/`. You own and can edit them.
2. **Resolve registry dependencies recursively.** For example, `add date-picker` includes its popover, popup, interaction, utility, and related component dependencies.
3. **Rewrite imports** from template-relative paths to the `importAlias` and `aliases` in your `comwit.json`, such as `@/lib/utils` and `@/components/ui/popover`. Behavior hooks such as `useMobile` and `ScrollChromeProvider` remain npm imports from `@comwit/ui` rather than copied files.
4. **Install npm dependencies:** `@comwit/ui` (including its `@comwit/ui/icons` subpaths), `class-variance-authority`, and applicable packages such as `react-hook-form`, `@tiptap/*`, `sonner`, `@ssgoi/react`, and `react-virtuoso`. Detects pnpm, yarn, bun, or npm automatically.
5. **Preserve installed package versions.** Dependencies already declared in `package.json` are not added again.
6. **Choose component text.** Default visible/screen-reader strings and date locale live in `lib/ui-text.ts`. Select `en` (default) or `ko` with `--locale` or `comwit.json`, then edit the installed file directly.
7. **Detect router variants.** Items with variants use the appropriate implementation for `next`, `react-router(-dom)`, or `@tanstack/react-router`, falling back to generic. Existing framework packages are not added as dependencies. Override detection with `--router`; `comwit-ui list` shows available variants.

## `comwit.json`

```json
{
  "aliases": { "ui": "components/ui", "lib": "lib", "hooks": "hooks" },
  "css": "app/globals.css",
  "importAlias": "@/"
}
```

- `aliases`: paths after `importAlias`. `add` copies to `srcDir/<alias>` and writes imports as `@/<alias>/…`. Optional `aliases.utils` locates `cn()` without an extension, defaulting to `<lib>/utils`. If `lib/utils/` already contains helpers, use a path such as `lib/utils/cn`.
- `css`: global stylesheet. `init` adds `@import "./comwit-tokens.css"` after the Tailwind import.
- `importAlias`: rewritten import prefix (`@/`), matching the project's tsconfig paths.
- `srcDir`: directory addressed by `importAlias`. `init` reads tsconfig/jsconfig paths such as `"@/*": ["./src/*"]` and records `src`, or `""` for the root. Older configs missing this field use the same detection at runtime.
- `locale` (optional): `lib/ui-text.ts` language, `en` or `ko`. `init --locale ko` records it. To replace installed text after changing it, run `comwit-ui add ui-text --overwrite`.

## Token contract

`init` writes `comwit-tokens.css` next to your stylesheet and imports it. Generated from `@comwit/ui-templates/styles.css`, it includes named palettes, semantic colors, type scales, radius/border/elevation/motion/state/z controls, `.dark` values, `@theme inline` mappings, and named utilities such as `ring-focus`. It also installs `tw-animate-css`.

**No preset themes are shipped.** Customize by overriding values after the token import:

```css
@import 'tailwindcss';
@import './comwit-tokens.css';

:root {
  --brand: #0b68ba; /* Replace the default Comwit blue. */
  --brand-strong: #095a9d;
  --brand-ink: #073b67;
  --brand-surface: #e6f4fe;
  --radius-scale: 0; /* Square corners through an L0 control. */
  --border-width: 2px; /* Stronger borders. */
  --duration-base: 0ms; /* Remove base-duration motion. */
}
```

Enable dark mode with `<html class="dark">`; component code stays unchanged. See the [UI token contract](../README.md#token-contract-theming-and-customization) for the full token tables and scope of each control.

## Regenerating the registry

After editing components or variants, regenerate the bundled registry from the monorepo root:

```bash
pnpm registry # Template source → packages/ui/cli/registry/*.json
```
