# @comwit/ui-templates

**Comwit UI's visual layer:** components that apply Tailwind tokens and `cva` variants to the [`@comwit/ui`](https://www.npmjs.com/package/@comwit/ui) headless engine.

The distribution approach is inspired by shadcn: bring component source into your project to **own and customize it**. Installation uses Comwit's own [`comwit-ui`](../cli) CLI, with no dependency on shadcn tooling.

This is a curated kit. Each role uses a suitable library: ssgoi for page transitions, sonner for toasts, overlay-kit for popups, tiptap for editing, TanStack Table for tables, react-day-picker for calendars, react-hook-form for forms, and react-virtuoso for chat virtualization. Neutral component names and shared tokens wrap these engines. Engines install as npm dependencies; wrappers become your code. Documentation cards link to each underlying library with “Built on …”.

## Installation

```bash
npx comwit-ui@latest init          # comwit.json, token wiring, and base dependencies.
npx comwit-ui@latest add button    # Component, registry dependencies, and npm dependencies.
```

- **Visual components (.tsx):** copied to your `components/ui/` with imports rewritten to your aliases. Edit them freely.
- **`@comwit/ui`:** installed from npm for behavior, accessibility, IME, focus, calendar/time, and editor logic.
- **Token contract:** `init` writes `comwit-tokens.css` and imports it into global CSS. Defaults to Comwit blue and Pretendard. Rebrand through `--brand` values; adjust corners, borders, shadows, and motion through L0 controls such as `--radius-scale`, `--border-width`, `--elevation-*`, and `--duration-*`. Dark mode uses one `.dark` class. No preset themes: consumers override tokens without editing components. See the [UI token contract](../README.md#token-contract-theming-and-customization).

See the [CLI README](../cli/README.md) for commands, flags, `comwit.json`, and installation behavior.

## Providers

`popup.confirm/alert/sheet` uses [overlay-kit](https://overlay-kit.slash.page/). Toasts use [sonner](https://sonner.emilkowal.ski/) with our glass `<Toast>`. Call `toast()` from the installed `toast.tsx`; importing Sonner's toast directly displays its default skin. Mount these once at the app root:

```tsx
'use client'
import { OverlayProvider } from 'overlay-kit'
import { Toaster } from '@/components/ui/toast' // Install the toast component too.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OverlayProvider>
      {children}
      <Toaster />
    </OverlayProvider>
  )
}
```

## Page transitions

`page-transition` adds native app-style drill, sheet, and slide motion without replacing the router. The engine is [`@ssgoi/react`](https://ssgoi.dev), wrapped in neutral names: `PageTransition` (provider), `PageBoundary` (route-owned DOM boundary), and `RouteBoundary` (reads the router pathname).

`comwit-ui add page-transition` detects the router in `package.json` and installs a `route-boundary.tsx` variant: Next.js App Router, React Router, TanStack Router, or generic with a `path` prop. Use `--router <name>` to override. Variant source lives in `src/routers/route-boundary.<variant>.tsx`.

```tsx
// app/layout.tsx: wrap the routed area once.
<PageTransition
  config={{ transitions: [{ on: '/posts/**', except: '/posts', transition: drill() }] }}
>
  <RouteBoundary>{children}</RouteBoundary>
</PageTransition>
```

A boundary is one DOM element whose key changes (`PageBoundary path=…`). When React unmounts the old page, the engine retains that node, places it absolutely above the new page, and animates both. This also works with `useState` and no router, as in the documentation phone demos.

Keep the app bar inside the page boundary so it moves with the page. For a persistent tab bar, fix the outer `RouteBoundary`'s `routeKey` and change pages in an inner boundary, leaving the tab bar in the outer shell. If other chrome appears above the inner boundary, wrap it in a `relative` parent: exiting pages align to the nearest positioned ancestor's top edge. For `hero()`, add matching `data-hero-exit-key` / `data-hero-enter-key` and `data-hero-radius` to shared elements.

Rules (`on/except`, `from/to`, `ordered`), preset options, scroll restoration, and troubleshooting follow the [engine documentation](https://ssgoi.dev/docs). Configuration is the same; wrapper component names differ.

## Bottom sheets

`bottom-sheet` rises from the bottom. Drag or tap its top handle to close. Dragging the body also moves the sheet when the body scroller is at the top. The `@comwit/ui` `BottomSheet` primitive owns dragging, distance/velocity thresholds, and nested-scroll handoff. The template maps `--sheet-drag` to translation and `--sheet-drag-progress` to scrim opacity. `popup.sheet()` opens the same sheet.

## Chat

`chat` provides compound header, message, and composer sections. `Chat` fills its parent, which needs a height such as `h-dvh` or `flex-1 min-h-0`. `ChatMessages` is virtualized by [react-virtuoso](https://virtuoso.dev).

The `@comwit/ui` Chat primitive owns virtualization, scroll rules, unread counts, Enter/IME handling, and automatic height. Templates assemble parts and apply tokens using `data-tone` and `data-align`. Data shape is unrestricted: `items` accepts your model, and `isOwn` identifies your messages, defaulting to `role === 'user'`.

`mode` controls scrolling:

- **messenger:** own messages always scroll to the bottom; incoming messages follow only when already at the bottom. While reading earlier messages, a glass `ChatScrollToBottom` pill displays the unread count.
- **assistant:** the sent message anchors at the top and the answer grows beneath it. Bottom space shrinks as the answer fills it, preventing jumps. Answers longer than the viewport follow only when already at the bottom. Responses default to the surface-free `plain` tone.

```tsx
<div className="h-dvh">
  <Chat mode="messenger">
    <ChatHeader>
      <ChatTitle>Ava Chen</ChatTitle>
    </ChatHeader>
    <ChatMessages
      items={messages}
      isOwn={(m) => m.mine}
      footer={
        typing ? (
          <ChatMessage>
            <ChatTyping />
          </ChatMessage>
        ) : null
      }
    >
      {(m) => (
        <ChatMessage align={m.mine ? 'end' : 'start'}>
          <ChatBubble>{m.text}</ChatBubble>
          <ChatMessageMeta>{m.time}</ChatMessageMeta>
        </ChatMessage>
      )}
    </ChatMessages>
    <ChatComposer onSend={send} pending={streaming} onStop={stop} />
  </Chat>
</div>
```

`ChatComposer` sends with Enter and inserts a newline with Shift+Enter, ignoring Enter during IME composition. With no children it renders an input and send button; compose your own layout with `ChatComposerInput`, `ChatComposerActions`, and `ChatComposerSubmit`. Visuals use tokens: own bubbles `bg-primary`, others `bg-muted`, and composer `rounded-sheet` + `shadow-message`.

## Usage

```tsx
import { Button } from '@/components/ui/button' // Path copied by the CLI.

;<Button variant="secondary" size="lg">
  Save
</Button>
```

Behavior, accessibility, IME, focus, and calendar/time logic live in `@comwit/ui`. The installed file adds visual variants with cva, so changing Tailwind classes does not replace behavior.

## Components

The same groups as the documentation gallery, with specialized Comwit experiences first:

- **Mobile apps:** app-shell (`AppShell`, `TabShell`, tab-bar, and route-boundary with router variants), app-screen, app-bar, bottom-nav, page-transition, pull-to-refresh, drag-scroller.
- **Chat:** `Chat`, `ChatHeader`, virtualized `ChatMessages`, `ChatMessage`, `ChatBubble`, `ChatTyping`, `ChatComposer`, and related parts.
- **Glass:** `Glass`, `GlassSurface`, `GlassButton`, dropdown-menu, popover. Dialogs, sheets, popups, and toasts use the same refractive glass with dense tint above scrims.
- **Feedback:** toast (`Toaster`, `toast()`, `Toast`), `lib/popup` (confirm, alert, sheet), alert, empty-state.
- **Pickers:** date-picker, time-picker, month-picker (desktop popovers/mobile sheets), calendar.
- **Selection:** segmented-control, chip, checkbox, radio-group, pager.
- **Forms and data:** text-field, autocomplete, select, form, data-table, editor.
- **Basics:** button, badge, input, input-group, textarea, label, switch, tabs, accordion, collapsible, dialog, sheet, card, table, avatar, separator, skeleton, pagination.

Shared helpers: `lib/utils` (token-aware `cn`), `lib/interaction` (focusRing and related classes), and `lib/popup` (overlay-kit wrapper).

Behavior hooks come from the engine: `import { ScrollChromeProvider, useScrollChrome, useMobile } from '@comwit/ui'`. They provide shared app-bar/bottom-nav scroll intent and mobile detection. There are no hook files to copy.

**Primitives own behavior; templates own styling.** App bars, bottom navigation, drag scrollers, pull-to-refresh, app shells, navigation depth, chat, and glass lenses all keep JavaScript behavior in `@comwit/ui`. Templates apply tokens to state attributes. Follow the same rule for new components: gestures, scrolling, and keyboard behavior become core options; templates contain classes and slot composition.

Picker, pager, and table labels default to English. Override `locale` and `labels` for other languages, or install Korean defaults with `comwit-ui init --locale ko`. The installed `lib/ui-text.ts` owns default text; app-level localization can pass translated props.

Preview variants in the UI catalog (`apps/ui-dev`, http://localhost:3007) and Storybook (`apps/storybook`, http://localhost:6008).
