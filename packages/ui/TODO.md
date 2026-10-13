# TODO

Comwit UI decisions, planned work, and ideas. Add new items as needed. Historical completion notes describe the state at the time of each change.

## Decisions

- **Keep the autocomplete name.** Our React Aria implementation is not renamed to shadcn's `combobox`.
- **Chip direction:** prioritize interactive/removable chips over static badges; consider consolidating badge into chip.
- **Separator and label:** independent templates without core primitives because they have no behavior. Avatar retains core loading behavior.
- **Layer contract:** core (`@comwit/ui`) is unstyled behavior/accessibility, with React Aria as an internal engine. Templates assemble parts and apply className tokens. Gestures, scrolling, and keyboard behavior belong in core options, not template useEffect implementations. Primitives expose state through `data-state`; templates style it.
- **Token v2:** L0 controls/palettes → L1 semantic aliases → L2 `@theme inline` utilities. Retheme by overriding L0. The original 12-step neutral ramp was later replaced with named palettes; see completion notes.
- **Dark mode:** one `.dark` class, without `light-dark()` diverging from `dark:` variants. Uses `@custom-variant dark (&:is(.dark *))`.
- **`rounded-full` versus `rounded-pill`:** full always stays circular (avatars, radio dots, ripples); pill may be squared by consumers (chips, calendar cells). Combining them would turn radios square at `--radius-scale: 0`.
- **One token source:** apps import `@comwit/ui-templates/styles.css`; no manual copies.
- **Named token utilities:** use `opacity-disabled`, `ring-focus`, `duration-base`, `shadow-card`, `min-w-menu`, etc., rather than arbitrary values such as `opacity-[var(--state-disabled)]`. Exceptions are expressions that cannot be represented as utilities, such as variant-specific border thickness.

## Missing components

Candidates, not yet prioritized:

- [ ] alert-dialog
- [ ] breadcrumb
- [ ] button-group
- [ ] command (⌘K palette)
- [ ] context-menu
- [ ] drawer (Vaul-style, distinct from our sheet)
- [ ] hover-card
- [ ] input-otp
- [ ] menubar
- [ ] navigation-menu
- [ ] progress
- [ ] scroll-area
- [ ] sidebar
- [ ] slider
- [ ] spinner
- [ ] toggle / toggle-group
- [ ] tooltip
- [ ] aspect-ratio, carousel, chart, resizable, empty, kbd, item, native-select

Skip overlapping concepts: combobox maps to autocomplete, field to text-field, and toast is already provided through Sonner.

## Comwit-specific components

- [x] AppBar: flow/pinned/reveal, glass back button, FloatingBackButton for heroes.
- [x] BottomNav: floating glass capsule, spring indicator, scroll compact mode.
- [ ] SmartSelect: selection UI presented as a bottom sheet on mobile.
- [x] Toast: Sonner with glass surfaces and responsive positioning.
- [x] PopupSheet: `popup.sheet()`, used by all three pickers on mobile.
- [x] Sheet: basic sheet component.
- [ ] InfiniteScroll: extract the Comwit feed's IntersectionObserver sentinel (rootMargin 600px) into a hook.
- [x] Port PullToRefresh, DragScroller, SegmentedControl, Pager, EmptyState, and refractive Glass from Comwit.
- [x] PageTransition, PageBoundary, RouteBoundary: neutral wrappers around ssgoi, with CLI router detection and route-boundary variants.
- [x] Use the same refractive `glass-dense` material for Dialog, Sheet, popup, and Toast as menus/app bars.
- [x] Chat: compound header/messages/composer, react-virtuoso virtualization, messenger bottom-following and assistant own-message anchoring/streaming modes.
- [x] Move behavior into primitives and leave templates with styling: app-bar, bottom-nav, drag-scroller, pull-to-refresh, chat, glass lenses, scroll-chrome, and use-mobile now expose core state through `data-*`. Apply this rule to new components too.

| Component    | Direction | Notes                                                               |
| ------------ | --------- | ------------------------------------------------------------------- |
| autocomplete | Keep      | Name finalized; equivalent role to shadcn combobox.                 |
| chip         | Primary   | Prioritize over badge.                                              |
| text-field   | Keep      | One fixed-label Comwit style; remove MUI floating/notched variants. |
| editor       | Keep      | tiptap rich text.                                                   |
| month-picker | Keep      |                                                                     |
| time-picker  | Keep      |                                                                     |

## Documentation: initial implementation complete

- [x] Next 16/Tailwind 4 app. `scripts/gen-ui.mjs` generates the catalog from gallery.mjs, specs, registry, and token CSS, extracting parts and tokens from source.
- [x] Scrolling `/ui/components` gallery: the initial 44 components in seven purpose-based groups, from mobile phone previews through glass, feedback, pickers, selection, forms/data, and basics. Code sheets include examples, copyable source, CLI commands, and source links. Individual component routes redirect to anchors.
- [x] Live token/theme editing and token-to-component dependency mapping.
- [x] OpenNext/Cloudflare setup with `open-next.config.ts`, `wrangler.jsonc`, and `pnpm --filter docs deploy`.
- [ ] Historical deployment follow-up: run `cd apps/docs && pnpm deploy` after Cloudflare authentication through `wrangler login`. Deployment was not run in the original unauthenticated environment.
- [x] Dark token values controlled by one `.dark` switch.
- [x] ⌘K search, scrollspy, mobile navigation sheet, docsOnly specs replacing fallback examples, and English examples.
- [x] Token v2 parser: 86 tokens at the initial implementation, light/dark values together, hidden primitive ramp, aliases resolved to hex. The old `css.split('@theme')[0]` parser returned zero tokens when a comment merely mentioned `@theme`.
- [x] `/ui/theming`: adjacent light/dark swatches, primitive → semantic → component dependencies, and a ThemeEditor with palettes, controls, dark toggle, and copyable CSS.

## Follow-ups

- [ ] Overlay spring timings in `lib/overlay-motion.tsx` are separate from `--duration-*`; decide whether to expose a shared timing contract. This supersedes the older framer-motion timing note.
- [ ] Three decorative `opacity-50` uses (select/autocomplete chevrons and calendar navigation) are muted appearance rather than disabled state, so they do not use `--state-*`. Add `--state-muted` if needed.
- [ ] Historical shadcn `dark:` variants (four in tabs, three in badge) use alpha literals such as `dark:bg-input/30`; they now follow the correct `.dark` switch but could use tokens.
- [ ] The Comwit realignment is a breaking change: chip variant/tone names, TextField props, ramp removal, and 2px focus rings require a 0.x bump and migration notes.
- [ ] Autocomplete invalid state changes only the border, with no error-text slot; AutocompleteSection titles lack styling.
- [ ] Core rich-text still emits prose classes associated with the typography plugin; styles.css now handles the body styling.
- [ ] Decide whether to consolidate composable Pagination and page/totalPages-based Pager.
- [ ] Visually test dark `--glass-*` values over real photography.

## Completed work and historical notes

- **Comwit defaults:** rebuilt tokens from Comwit globals.css, replacing `--n-*` with named `--canvas*`, `--surface-subtle`, `--fill*`, `--ink*`, `--brand*`, and `--line*` palettes. Added semantic radii, `shadow-panel/message`, refractive `.glass*`/`--glass-*`, glass toasts, and menu motion. Re-ported all templates from Comwit `src/lib/components/ui`.
- **Focus-ring bug:** tailwind-merge treated `ring-focus` as a ring color and removed it next to `ring-ring`, making keyboard focus rings 0px everywhere. `text-label`/`text-caption` sizes also disappeared next to text colors. Registered token names with `extendTailwindMerge`.
- **Overlay layering:** `z-dropdown` 1000 was below `z-modal` 1200, hiding selects/menus/pickers behind their parent dialogs. Moved dropdown above modal.
- **ScrollChrome:** fixed passive-wheel handling that reread the baseline after scrolling and swallowed one-step wheel input.
- **Docs CSS:** moved unlayered button transition, focus outline, and heading font rules to base, and removed the Inter `--font-sans` override, so previews match library components.
- **Control fixes:** Label disabled propagation beside Checkbox/Radio (`peer-has-[:disabled]`), deletable-chip disabled/keyboard behavior, Pagination disabled state/labels, TextField double opacity, named Switch groups, Editor placeholders/accessibility, picker locale/labels, and the MonthPicker mobile sheet.
- **Data table:** ported from base-template with TanStack Table, server pagination, skeletons, empty-row padding, background-refetch spinner, and a ColumnDef re-export.
- **Token v2:** redesigned three layers and propagated through 35 components/104 locations, adding dark mode. Historical additions included `--n-1..12`, `--radius-scale`, `--pill-radius`, `--text-scale`, `--tracking-scale`, `--border-width(-strong)`, `--elevation-0..5,raised`, `--duration-*`, `--press-scale(-thumb)`, `--state-*`, `--z-*`, `--placeholder`, `--switch-thumb`, `--overlay`, `--surface-glass`, `--border-strong`, `--input-hover`, and `--display-font`. Restored/wired `--disabled-foreground`; the legacy radius contract was revised later.
- **CSS pitfalls:** colliding `@utility` names are silently discarded, so authored `@layer utilities` rules override bare border thickness. `@theme inline` freezes non-var values, so `--radius-pill` goes through `--pill-radius`.
- **UI catalog:** added Foundations and Override Lab, demonstrating full-section restyling through wrapper CSS variables alone.
- **Theme presets:** removed preset themes and `[data-theme]`; consumers express variation through controls.
- **Dark alias ordering:** moved `--input`/`--ring` overrides after aliases so they are not reset.
- **Astryx review:** examined `facebook/astryx` source, corrected four claims, and applied three gaps. Added `--selected` (historically n-5) because hover/selected had identical bg-accent pixels; restored dark `--muted`/`--secondary` to n-3 because they disappeared on n-2 cards at 1.00:1 contrast; added `--skeleton` (light n-3/dark n-4) to replace two inconsistent, invisible dark skeleton surfaces. Rejected property-first renaming (`--color-text-primary`), `light-dark()`, component-layer tokens requiring build-time compilation, and unused `--color-track`. Deferred `--size-element-*` control heights and a fourth `--surface-raised` surface.
- **Primitive review:** audited/refactored compound patterns in 20 core primitives.
- **Small fixes:** collapsible use-client RSC boundary, radio-group null typing, and select/collapsible internal displayName values.
- **Accessibility:** strengthened text-field aria-describedby through child scan plus mount registration; made autocomplete fully compound with React Aria internally.
- **Presentation-only components:** removed separator/label from core and made templates independent.
- **Storybook:** removed six token-only stories: separator, label, alert, badge, card, skeleton.
- **Scripts:** cleaned up root dev, storybook, and core-development commands.
