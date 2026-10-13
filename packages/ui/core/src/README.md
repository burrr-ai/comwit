# Comwit UI primitive source

Comwit's **headless UI primitive layer** owns behavior and accessibility. Keep it self-contained and independent of app tokens, configuration, and services.

## Location and imports

- Source: `packages/ui/core/src/`.
- Public package: `@comwit/ui`, exported through `index.ts`.
- Internal implementation utilities: `internal/`; consumers must not import these directly.

## Rules

1. **Use the `index.ts` barrel as the public primitive entry point.** Expose a new primitive by adding its re-export there.
2. **Overlay, disclosure, and form-control primitives are in-house ports of Radix Primitives**, with no external `@radix-ui/*` dependency. Shared engine utilities live in `internal/`. Behavior changes stay inside individual implementations without changing the barrel or consumers unnecessarily.
3. Export compound primitives as **namespaces** (`Dialog.Root`, etc.) to prevent name collisions. Export standalone hooks directly.
4. `utils/` contains internal behavior utilities. Ripple hooks own only positioning, timing, and cleanup; consumers provide visual classes through `itemClassName`. Core has no CSS-framework dependency. Tailwind interaction constants belong in `@comwit/ui-templates/lib/interaction`.
5. **No app imports (`@/…`).** Depend on React, internal engines, React Aria, and appropriate behavior utilities. Overlay/disclosure/form-control behavior uses the internal Radix-based engine, with focus-scope, dismissable-layer, popper, collection, roving-focus, and menu utilities. Accessibility wiring uses established React Aria APIs such as `@react-aria/label`'s `useField`; IME composition and focus state are layered on top.

## Primitives

- **Overlay/disclosure:** accordion, avatar, collapsible, dialog, dropdown-menu, popover, select, and tabs.
- **Bottom sheet:** dialog behavior plus drag-to-dismiss distance/velocity thresholds and nested-scroll handoff. Exposes `--sheet-drag`, `--sheet-drag-progress`, and `data-dragging` for visuals.
- **Form controls:** checkbox, radio-group, and switch.
- **Custom headless controls:** button (press/ripple), input (bare and IME-safe), textarea (IME-safe).
- **Compound fields with React Aria accessibility:** text-field (`Root/Label/Control/Description/Error`) and autocomplete.
- **App shells, gestures, and chat:** app-bar, bottom-nav, drag-scroller, pull-to-refresh, chat (react-virtuoso virtualization, scroll rules, composer), scroll-chrome, use-mobile, and glass-lens. Primitives expose attributes such as `data-state` and `data-tone`; templates style those states.
- **Utilities:** ripple positioning/timing without visuals; consumers provide `itemClassName`.

The template layer reuses these primitives and adds **tokens and cva variants**. Accessibility and behavior stay in the primitives. Presentation-only label and separator components live in templates.

## Roadmap

- [x] Extract checkbox/radio/switch and button/input/textarea/text-field primitives and connect the template layer.
- [x] Replace Radix re-exports with in-house ports; remove all external `@radix-ui/*` dependencies. Organize shared compose-refs, context, primitive, presence, portal, focus-scope, dismissable-layer, collection, roving-focus-group, popper, arrow, and menu utilities under `internal/`.
- [x] Move Tailwind interaction constants to `@comwit/ui-templates/lib/interaction`; let consumers supply ripple visuals through `itemClassName`.
- [ ] Enforce the public import boundary with ESLint so apps cannot import `internal/*`.
- [x] Extract and publish the independent `@comwit/ui` package.
