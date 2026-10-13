# @comwit/ui

**Comwit's headless UI primitives** own behavior and accessibility without visual styles. The engine provides primitives whose structure and behavior we can maintain and extend directly. For styled, editable component source, use [`@comwit/ui-templates`](https://www.npmjs.com/package/@comwit/ui-templates).

```bash
npm i @comwit/ui
# Peer dependencies: react, react-dom
```

## Icons (`@comwit/ui/icons`)

Comwit's 143 original icons ship as subpaths of the same package. No separate installation is needed, and unused icons are tree-shaken out.

```tsx
import { SearchIcon, CheckIcon } from '@comwit/ui/icons' // Static SVG; works in Server Components.
import { AnimatedBellIcon } from '@comwit/ui/icons/animated' // Spring motion; preserves its 'use client' boundary.
import { iconCatalog } from '@comwit/ui/icons/catalog' // Gallery metadata and complete drawings.
```

Icons accept `size` (default 24), `color` (`currentColor`), `strokeWidth` (default 1.65), `title`, and SVG attributes. Motion props (`animateOn`, `replayKey`), design rules, and contribution instructions are in [src/icons/README.md](src/icons/README.md). Browse the [icon gallery](https://library.comwit.io/ui/icons).

## Design

- **The main barrel is the public entry point** (`@comwit/ui`). Primitives use namespace exports to avoid name collisions.
  ```tsx
  import { Dialog, Select, TextField, Button } from '@comwit/ui'
  // <Dialog.Root> · <Select.Trigger> · <TextField.Root> · <Button>
  ```
- **Engine selection:** overlay, disclosure, and form-control behavior uses in-house ports of Radix Primitives. Accessibility wiring uses React Aria; `text-field` and `autocomplete` use `react-aria`/`react-stately` rather than reinventing ARIA.
- **Custom headless primitives:** `Button` (press/ripple/asChild), `Input`/`Textarea` (IME-safe), `TextField` (compound field), and `Autocomplete` (combobox).
- **App shells, gestures, and chat:** behavior lives here and visuals in templates. `AppBar.Root` exposes flow/pinned/reveal through `data-state`; `BottomNav.Root/Item` handles selection, compact mode, and expansion; `DragScroller.Root/Track` handles dragging, inertia, wheel, and keyboard scrolling. `PullToRefresh.Root/Scroller/Indicator` exposes pull gestures through `--ptr-pull` and `data-state`. `AppShell.Root/Scroller/Indicator` combines one `<main>` scroller, scroll intent, and pull-to-refresh with required structural inline styles. `NavDepthProvider`/`useBackNavigation` goes back with in-app history or replaces with a parent route after direct entry. `Chat.Root/List/ScrollToBottom/Message/MessageContent/Bubble/Composer/ComposerInput/ComposerSubmit/ComposerStop` provides react-virtuoso virtualization, messenger/assistant scroll rules, Enter/IME handling, and automatic height.
- **Directly exported hooks:** `ScrollChromeProvider`/`useScrollChrome` shares scroll intent between app bars and bottom navigation; `useMobile`/`useMobileDevice` detects mobile presentation/devices; `useGlassLens` generates refractive-glass displacement maps; `usePresenceAnimation` animates overlay entry/exit with the Web Animations API, retains closing parts until completion, and preserves motion when reversing.
- **Radix-based primitives:** accordion, avatar, collapsible, dialog, dropdown-menu, popover, select, tabs, checkbox, radio-group, and switch.

## Styling boundaries

The core has no Tailwind or design-token contract. Interaction class constants (`focusRing`, `pressable`, `disabledStyle`) live in `@comwit/ui-templates/lib/interaction`. Ripple hooks own positioning, size, and cleanup timing; the consumer supplies color, shape, and animation through `itemClassName`. Structural inline styles needed for scrolling and positioning remain with the behavior they support.

The consumer owns colors and theme values. The standard token contract lives in `@comwit/ui-templates` at `styles/globals.css`.

## Roadmap

- [x] Replace external Radix re-exports with in-house primitive implementations.
- [ ] Add individual primitive subpath exports.
