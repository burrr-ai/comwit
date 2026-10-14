# Design Guide

> **Read this first before working on screens. When design direction is chosen or changes, update this document before the code.**
> These defaults apply until the project has its own design language. Adapt them to the brand and product, recording the reason and replacement principle for any exception so later screens follow the same decisions.
> Review the design system and page states in `pnpm storybook`, under the top-level **Design system** and user-type pages. Do not use a `/design` app route. Follow [`.storybook/stories/.ai.md`](../../.storybook/stories/.ai.md).
> Refer to the [comwit-ui gallery](https://library.comwit.io/ui/components) and [theming documentation](https://library.comwit.io/ui/theming) for component usage.

## Project concept

_The base template has no product-specific voice or mood yet. Fill in these two lines when the project is defined._

- **Voice**: _For example: courteous and direct / friendly and casual / expert._
- **Mood**: _For example: minimal and spacious / colorful and playful / dense data dashboard._

Even before the concept is defined:

- Keep only content people need to read, using short, clear sentences.
- Prioritize generous spacing and clear typography hierarchy. Decoration cannot replace information structure.
- Reserve brand color for primary actions and meaningful emphasis.
- Separate content with spacing, background tones, and typography instead of repeated cards, shadows, and borders.

## Screen editing principles

### Every design choice needs a purpose

- Each element must contribute to **information hierarchy, comprehension, action, state/feedback, or brand impression**.
- Before adding an element, explain why it is needed and what removing it would lose. If neither has an answer, omit or remove it.
- Beauty can serve an intentional brand impression, but does not justify harming readability, usability, or speed.
- Use icons only when they communicate faster than text or save space. Remove decorative icons that still require text to understand.
- Use borders, shadows, and gradients to communicate boundaries, depth, state, or visual flow. Do not add them just because a screen looks empty.
- Use motion to clarify state changes, spatial relationships, direction, and interaction results. Avoid endless decoration and unrelated scroll effects.

After implementation, **review by removing elements one at a time** before considering additions. Choose the simpler version when meaning and usability remain intact.

### Do not add copy that narrates the UI

- **No small text above headings.** Do not introduce headings with eyebrows, English subtitles, introductory labels, or decorative numbers.
- **No supporting copy explaining sections, buttons, or visual effects.** Avoid phrases such as "See the features below," "Click to navigate," or "Appears on scroll."
- **Do not solve weak comprehension or emphasis solely by adding explanations.** First use size and weight hierarchy, alignment, grouping, spacing, contrast, familiar icons, real previews, selection/progress states, and interaction feedback.
- Make primary actions clear through button placement, size, and contrast; show selection through checks and selected styles; show progress through step placement and current position. Never rely on color or one unfamiliar icon alone.
- Provide essential text clearly: button names, field labels, accessible names, error causes and remedies, and conditions needed for decisions. Do not remove actual content or essential guidance, or replace it with ambiguous icons.

**Excess explanation reduces readability.** Review hierarchy, actions, and state with ancillary copy removed. If unclear, improve structure and visual cues before restoring explanations.

### One section, one story

- The default unit for public landing and introduction pages is **one large statement plus one visual that demonstrates it**.
- If the heading conveys the meaning, omit subtitles and descriptions. Put essential information absent from the heading into one short body-size paragraph.
- Do not stack heading, subtitle, body, and caption in one section. Usually introduce one new reading task at a time.
- Split independent claims, audiences, or steps into another scene or clear rows.
- Do not repeat the same message in the heading, description, and cards. A visual should demonstrate a real screen, result, or process.

The goal is not mechanical word reduction. Organize necessarily detailed terms, help, and specifications into readable lines and paragraphs. Keep landing-page persuasion separate from product task instructions.

### Do not hide information in small type

- Use large typography for public landing headings, benefits, and explanations. Start narrative body copy around 18–24px on desktop and at least 16px on mobile.
- Reserve `text-body-sm`, `text-caption`, and `text-micro` for genuinely secondary information such as dense product UI, metadata, and field help, never to fit more landing copy.
- Promote necessary supporting explanations to their own scene or a body-size sentence instead of stacking small gray text.
- Re-edit the order, scale, and spacing of mobile content so one message reads within roughly one screen; do not simply stack the desktop layout.

### Separate content with spacing first

- Keep ordinary information sections inside containers. Use full bleed only for heroes or necessary extended narrative scenes.
- Separate sections with generous spacing and background tones before adding hairlines for actual boundaries.
- Use cards for independent objects such as projects, payment methods, or posts. Avoid repeating white cards and shadows on white backgrounds or nesting cards.
- Place labels and section headings outside containers when possible so the information structure is visible first.

## Text color: choose by role, not size

Do not automatically use `text-muted-foreground` for non-heading text.

| Level | Utility | Use |
|---|---|---|
| 1. Headings/emphasis | `text-foreground` | Page, section, and card headings; selected values; key user-entered values |
| 2. Main reading | `text-soft-foreground` | **Default for non-heading text:** body copy, descriptions, card summaries, empty-state guidance, conversations, comments |
| 3. Supporting information | `text-muted-foreground` | Dates, times, counts, authors, field help, inactive tabs/icons |
| 4. Hints | `text-subtle-foreground` | Placeholders and low-priority hints unnecessary for understanding the task |
| 5. Disabled | `text-disabled-foreground` | Actual disabled states only; never body copy, descriptions, or metadata |

Use `foreground` for headings and start other text at `soft-foreground`. Reduce to `muted-foreground` only when readers can understand the screen and complete the task without it. Small text does not automatically need a lighter color.

## Type scale

A purpose-specific token combines size, line height, and tracking. Heading tokens have a default weight; body tokens do not.

| Token | Default size | Use |
|---|---:|---|
| `text-display-xl` … `text-display-sm` | 40 / 32 / 28 / 22px | Hero, page, and large section headings |
| `text-title-lg` … `text-title-sm` | 18 / 16 / 14px | Section, card, and list headings |
| `text-body` / `text-body-sm` | 15 / 13px | Product body copy / dense body copy |
| `text-label` | 14px | Button, tab, and form labels |
| `text-caption` | 12px | Field help and metadata |
| `text-micro` | 11px | Badges and very short metadata |

- For larger editorial typography, use responsive `clamp()` or project-specific purpose tokens. Promote repeated values into tokens.
- `body`, `label`, `caption`, and `micro` have no built-in weight. Add `font-medium` or `font-semibold` only for emphasis.
- Consider `text-balance` for headings and short sentences. For awkward Korean line breaks, adjust `break-keep` and width together.

## Current design system

- **Named palettes:** surfaces (`--canvas*`, `--surface-subtle`, `--fill*`), ink (`--ink*`), brand (`--brand*`), and lines (`--line*`) provide light/dark levels. Components consume semantic tokens such as `background`, `muted`, and `selected`.
- **Starter brand:** the generic blue (`#3182f6`) is a starting point. Replace `--brand`, `--brand-strong`, `--brand-ink`, `--brand-surface`, and `--brand-foreground` together when the brand is defined.
- **Typography:** Pretendard, tight headings, and a purpose-specific scale. Adjust `--display-font`, `--text-scale`, `--tracking-scale`, and weight controls for the project.
- **State colors:** success/warning/destructive/info each have five tokens: solid, on-solid text, tinted surface, on-tint text, and border. Keep them independent of brand colors so their meaning survives rebranding.
- **Three-layer token contract:** L0 controls palette, radius, border, elevation, motion, state, and z-index; L1 defines semantic roles; L2 provides Tailwind utilities. Express project identity by overriding L0/semantic values and minimize shared component JSX edits.

## Where to make changes

| Desired change | Location |
|---|---|
| Brand, neutral, or state colors | Override L0 palette values in the project theme block of `src/app/globals.css` |
| Type scale and fonts | `--text-scale`, `--tracking-scale`, `--display-font`, and weight controls in the same block |
| Radii, borders, shadows, motion, density | L0 controls in the same block |
| Full token definitions (read-only) | `src/app/comwit-tokens.css`, installed by comwit-ui; override in `globals.css` |
| Component variants | cva variants in `src/lib/components/ui/*`; edit installed components only when tokens cannot express the change |
| Default labels and date locale | `src/lib/ui-text.ts` |
| Ripple, focus, and transitions | `src/lib/interaction.ts`, shared Tailwind interaction classes |
| Primitive engine | `@comwit/ui`; application code imports only `src/lib/components/ui/*` |

- Components use semantic token utilities, never L0 palette values such as `--ink*` or `--canvas*` directly.
- Establish the concept, `--brand` family, `--radius-scale`, `--display-font`, `--text-scale`, elevation, and duration early.
- Promote repeated visual values to tokens. One-off decoration, third-party brand colors, and runtime layout values may remain local.

## Avoid

- **Purposeless elements:** omit text, shapes, images, icons, colors, lines, and motion whose purpose and removal cost cannot be explained.
- **Small text above headings:** no eyebrows, introductory labels, decorative numbers (`01 —`), meaningless English labels, or unnecessary chips/badges.
- **UI narration and accumulated tiny explanations:** improve hierarchy, layout, icons, and state before adding supporting section/button/effect descriptions, subtitles, or captions.
- **Faint body copy:** do not use muted/subtle/disabled text for body copy, card summaries, or empty-state guidance.
- **Excess decoration:** no meaningless icons, emoji, fake terminals, unnecessary borders, shadows, gradients, or scroll motion.
- **Card-only layouts:** do not trap labels/headings inside cards or build hierarchy by repeating white cards and shadows.
- **Token bypasses:** do not recreate existing token colors, typography, radii, or shadows with raw hex/arbitrary values. Name repeated project-specific values.
- **Native interactive elements:** use `src/lib/components/ui/*` instead of `<button>`, `<input>`, `<select>`, or `<textarea>`.

Gallery/theming token names and metadata are documentation, not a reason to add decorative labels or small explanations to user-facing screens.
