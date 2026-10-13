# Comwit UI

Headless behavior and editable UI components used in Comwit templates — a curated kit that wraps the best library for each job (page transitions, toasts, overlays, rich text, tables, dates, forms, chat lists) under neutral names and one design system, installed as source you own.

Original icons ship inside `@comwit/ui` as subpaths: `@comwit/ui/icons` (static SVG, works in Server Components), `@comwit/ui/icons/animated` (spring motion, own `use client` boundary) and `@comwit/ui/icons/catalog` (gallery metadata). Unused icons tree-shake away. Browse them in the [searchable gallery](https://library.comwit.io/ui/icons); design and contribution notes are in [core/src/icons/README.md](core/src/icons/README.md).

[Documentation](https://library.comwit.io/ui) · [Components](https://library.comwit.io/ui/components) · [Agent guide](https://library.comwit.io/ui/llms.txt)

```bash
npx comwit-ui@latest init
npx comwit-ui@latest add button dialog input
```

The CLI installs component source into your project. You own and customize those files. `@comwit/ui` remains the behavior engine; the CLI workflow does not require importing `@comwit/ui-templates` in your app.

| Directory              | Package                | Responsibility                              |
| ---------------------- | ---------------------- | ------------------------------------------- |
| [core](core)           | `@comwit/ui`           | Headless behavior and accessibility         |
| [templates](templates) | `@comwit/ui-templates` | Styled source and shared CSS tokens         |
| [cli](cli)             | `comwit-ui`            | Component installation and bundled registry |

Run commands from the repository root: `pnpm build:packages`, `pnpm dev:ui`, `pnpm dev:ui-catalog`, `pnpm storybook`, and `pnpm registry`. Storybook specs in `apps/storybook/specs` supply both stories and documentation examples; the component source is never duplicated for previews.

See the [CLI guide](cli/README.md) and [template guide](templates/README.md) for details.

## Token contract: theming and customization

**Defaults follow the Comwit design system:** warm white, deep ink, Toss-inspired blue (`#3182f6`), Pretendard, and refractive glass. Components consume token utilities such as `bg-primary`, `rounded-control`, and `duration-base` instead of literal values, so changing tokens rethemes them without JSX edits. The single source is `packages/ui/templates/src/styles/globals.css`, published as `@comwit/ui-templates/styles.css` and installed by the CLI as `comwit-tokens.css`.

`apps/ui-dev`, `apps/docs`, and `apps/storybook` import that source. Do not copy it by hand.

### Three layers

| Layer             | Location                     | Contents                                                                                                                                                                                     | When retheming     |
| ----------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **L0 primitives** | `:root` / `.dark`            | Named palettes (`--canvas*`, `--surface-subtle`, `--fill*`, `--ink*`, `--brand*`, `--line*`, status, `--glass-*`) and controls (`--radius`, `--radius-scale`, `--duration-*`, `--z-*`, etc.) | Override these.    |
| **L1 semantics**  | `:root, .dark`               | Role aliases such as `--background`, `--primary`, `--muted-foreground`, and `--border`                                                                                                       | Usually unchanged. |
| **L2 utilities**  | `@theme inline` / `@utility` | `--color-*` → `bg-*`, `--radius-*` → `rounded-*`, `--shadow-*` → `shadow-*`, `--text-*` → type scales                                                                                        | Unchanged.         |

L0 has no utility-generating `--color-` prefix. Components address colors only through semantic roles.

### Controls

| Control                                                            | Affects                                                                                       |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `--brand`, `--brand-strong`, `--brand-ink`, `--brand-surface`      | Buttons, links, focus rings, and selection marks; the main rebranding values.                 |
| `--canvas*`, `--surface-subtle`, `--fill*`, `--ink*`, `--line*`    | Surface depth, text hierarchy, and lines.                                                     |
| `--radius`, `--card-radius`, `--sheet-radius`                      | `rounded-control`, `rounded-card`, `rounded-sheet`.                                           |
| `--pill-radius`                                                    | Button, chip, and tab-bar pills through `rounded-pill`.                                       |
| `--radius-scale`                                                   | Multiplier for all the above and `rounded-sm/md/lg…`.                                         |
| `--text-scale`, `--tracking-scale`, `--weight-*`, `--display-font` | Type size, tracking, weight, and heading font.                                                |
| `--border-width(-strong)`                                          | Bare and directional border thickness.                                                        |
| `--focus-ring-width/-offset`, `--field-ring-width`                 | Control `ring-focus` and input `ring-field`.                                                  |
| `--duration-*`, `--press-scale(-thumb)`, `--ripple-opacity`        | Transition speed, pressed states, and ripples.                                                |
| `--state-*`                                                        | Hover/selection halos and disabled opacity.                                                   |
| `--elevation-*`                                                    | `shadow-xs…xl`, `shadow-card(-hover)`, `shadow-panel`, `shadow-message`, `shadow-raised`.     |
| `--glass-*`                                                        | Refractive-glass tint, gloss, and shadows consumed by `.glass*`.                              |
| `--z-*`                                                            | `z-appbar` < `z-overlay` < `z-modal` < `z-dropdown` < `z-toast`.                              |
| `--page-gutter`                                                    | Horizontal `px-gutter` spacing, including safe areas; aligns page content with mobile toasts. |

`z-dropdown` intentionally sits above `z-modal`: selectors, menus, and pickers inside dialogs/sheets portal to body and would otherwise hide behind their parent dialog.

### Consumer setup

```css
/* app/globals.css */
@import '@comwit/ui-templates/styles.css'; /* Tokens, theme mappings, utilities, glass, and toast CSS. */

/* Tailwind v4 excludes node_modules and ignored paths from automatic detection; include when needed. */
@source "../node_modules/@comwit/ui-templates/src";
```

For the CLI workflow, `comwit-ui init` writes the local `comwit-tokens.css` and wires its import. Set `--font-pretendard` on `<html>` through next/font or another loader; without it, fonts fall back to the system stack.

**Put site CSS in the base layer.** Unlayered element rules such as `button { transition }`, `:focus-visible { outline }`, and `h1 { font-family }` beat layered Tailwind utilities and silently change component motion, focus rings, or typography. Wrap those rules in `@layer base { … }`.

### Customization

No preset themes or `[data-theme]` convention are shipped. Consumers override tokens:

```css
@import './comwit-tokens.css';

/* Later declarations win with equal specificity. */
:root {
  --brand: #0b68ba; /* Buttons, links, focus, and selection marks. */
  --brand-strong: #08528f;
  --radius-scale: 0.6; /* Scale all radii together. */
  --pill-radius: 12px; /* Make button/chip corners less rounded. */
  --duration-base: 0ms; /* Remove base-duration motion. */
}
```

Scoped L1 overrides such as `--primary` work directly. Scoped L0 overrides such as `--ink` also require redeclaring the L1 aliases in that selector, because CSS resolves `var()` on the element where the property is declared. The [Tokens and theming](https://library.comwit.io/ui/theming) editor produces copyable CSS as you adjust controls.

### Dark mode

One `.dark` class controls tokens, dark variants, and color-scheme together. `light-dark()` alone covers colors but can diverge from `dark:` variants. Dark mode overrides L0 surfaces, ink, brand/status tints, lines, glass, and elevation; aliases propagate the changes.

Dark surfaces use progressively lighter tones and white inset highlights to establish depth:

```text
canvas #161618 → card #1e1f22 → muted/popover #26272b → accent/hover #2f3035 → selected #3a3b41
```

The alias selector includes both `:root` and `.dark`: an alias resolved to white at `:root` would not follow a child's L0 override. Dark-specific adjustments such as `--skeleton` must follow the alias rule because `html.dark` matches both selectors at equal specificity.

### Token reference

**Colors pair surface `X` with text `X-foreground`.**

| Token                                                          | Role                                                         | Typical utilities                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `--background` / `--foreground`                                | Page background and heading/emphasis text                    | `bg-background`, `text-foreground`                                             |
| `--card`, `--popover`                                          | Card and overlay surfaces                                    | `bg-card`, `bg-popover`                                                        |
| `--primary` (+ `-foreground`, `-strong`, `-ink`, `-surface`)   | Primary actions, hover, tinted text/surface                  | `bg-primary`, `hover:bg-primary-strong`, `bg-primary-surface text-primary-ink` |
| `--soft-foreground`                                            | Default body text, excluding headings                        | `text-soft-foreground`                                                         |
| `--muted-foreground`                                           | Metadata/help; do not choose it solely because text is small | `text-muted-foreground`                                                        |
| `--subtle-foreground`, `--disabled-foreground`                 | Tertiary information/placeholders and disabled text          | `placeholder:text-subtle-foreground`                                           |
| `--secondary`, `--muted`                                       | Subtle surfaces for secondary buttons/groups                 | `bg-secondary`, `bg-muted`                                                     |
| `--accent`, `--selected`                                       | Neutral hover surface and stronger selected surface          | `hover:bg-accent`, `bg-selected`                                               |
| `--skeleton`, `--switch-thumb`, `--overlay`, `--surface-glass` | Loading surface, switch thumb, modal scrim, opaque blur chip | `bg-skeleton`, `bg-overlay`                                                    |
| `--border`, `--border-strong`, `--input`, `--ring`             | Hairline, emphasis border, input outline, brand focus ring   | `border-border`, `border-input`, `ring-ring`                                   |

**Status:** each family (`success`, `warning`, `destructive`, `info`) has five tokens independent of branding: `bg-{s}`, `text-{s}-foreground`, `bg-{s}-surface`, `text-{s}-surface-foreground`, `border-{s}-border`. `destructive-strong` is dangerous-action hover. Solid colors and their foregrounds match across light/dark; dark mode reauthors tints and borders.

**Radii:** prefer semantic names: `rounded-control` (10, inputs/selects), `rounded-card` (16), `rounded-sheet` (20, bottom sheets/toasts), and `rounded-pill` (buttons/chips/tab bars). `rounded-full` always stays circular for avatars, radio dots, and ripples and ignores radius controls.

**Type scale:** `text-display-xl/lg/md/sm` (40/32/28/22, weight 700), `text-title-lg/md/sm` (18/16/14, weight 600), `text-body` (15), `text-body-sm` (13), `text-label` (14), `text-caption` (12), `text-micro` (11). Each combines size, line height, and tracking; only headings include weight. Set color separately.

**Named utilities:** `ring-focus`, `ring-field`, `ring-offset-focus`, `opacity-disabled(-content)`, `scale-press(-thumb)`, `duration-instant/fast/base/slow/slower`, `z-raised/sticky/appbar/overlay/modal/dropdown/toast`, `state-hover-layer`, `state-selected-layer`, `min-w-menu`, `w-picker`, `h-appbar`, and `h-bottom-nav`.

**Component CSS:** rules unsuitable for utilities live in `.glass`, `.glass-morphing/blur/frosted/fade`, `.glass-lens`, `[data-glass-item]` (glass menu rows), `.floating-tab-indicator`, `.comwit-toaster`, and `[data-slot=editor] .tiptap`.

### Rules and pitfalls

- **`cn()` must recognize token utilities.** `lib/utils.ts` registers names such as `text-label`, `rounded-control`, and `ring-focus` with tailwind-merge. Otherwise `text-label text-foreground` loses its size and `ring-focus ring-ring` loses ring thickness, removing keyboard focus indicators. Update registration when adding `@theme`/`@utility` names.
- **`@utility` names colliding with built-ins are silently discarded.** Override bare `border` thickness with later authored rules in `@layer utilities`.
- **`@theme inline` freezes values without `var()` as literals.** Route customizable values through controls, such as `--radius-pill: var(--pill-radius)`. `--radius-full: 9999px` is intentionally fixed.
- **Overlay spring settings** live in `lib/overlay-motion.tsx` and are separate from CSS `--duration-*` values.
- **Add tokens in both places:** L0/L1 values and `@theme inline` mappings, plus `lib/utils.ts` for named utilities.

## Publishing

```bash
pnpm release:core        # Build and publish @comwit/ui.
pnpm release:templates   # Publish @comwit/ui-templates; workspace:* resolves to real versions.
```
