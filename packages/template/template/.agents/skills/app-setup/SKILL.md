---
name: app-setup
description: One-time mobile app setup with bottom tabs, fullscreen details, app bars with history-aware back/fallback, Ssgoi, viewport and PWA installation/banner. Leaves .ai.md guidance and removes itself. Use for "앱 만들어줘", "모바일 앱", "앱처럼", "바텀 네비", "탭 화면" before the first app screen; not ordinary websites or template maintenance.
---

# app-setup

Set up an app-like product once, before its first screen. The CLI installs the
repeatable shell; the AI implements the requested routes, screens and domain data.
After cleanup, `src/app/.ai.md`, `src/services/page.ai.md`, and
`src/services/state.ai.md` retain the app conventions. Do not install these
conventions for ordinary web pages or run setup in the source template checkout.

## Choose tabs

Use the user's product brief to choose 2–5 tabs (href, label, Lucide icon).
Ask only if missing product information prevents a reasonable choice.

Read `src/app/.ai.md`, `src/services/page.ai.md`, `src/services/state.ai.md`,
and the existing app layout/routes. All shell UI (AppShell/TabShell, AppScreen,
AppBar, BottomNav/TabBar, Glass, PageTransition/RouteBoundary, PullToRefresh,
BottomSheet) is comwit-ui source installed in `src/lib/components/ui` for the
detected router; the scroller, scroll chrome, refresh gesture and back depth are
`@comwit/ui` primitives. This skill only places them and lists the tabs.
Transition rules use the SSGOI config shape (https://ssgoi.dev/llms.txt) through
`appTransitions`. Older projects need `comwit.json`, `@comwit/ui@0.4.0`,
`comwit-ui@0.6.0` (dev), `@ssgoi/react@7.3.0` and `@comwit/state@2.4.0`;
install missing ones with `--save-exact` first.

## 1. CLI: install the mechanical shell

Write the chosen tabs to `.agents/state/app-setup-tabs.json`, for example:

```json
[
  { "href": "/", "label": "홈", "icon": "Home" },
  { "href": "/search", "label": "검색", "icon": "Search" }
]
```

Write `.agents/state/app-setup-pwa.json` from the product brief, for example:

```json
{ "name": "모아", "shortName": "모아", "description": "함께 모으는 기록", "backgroundColor": "#ffffff", "themeColor": "#ffffff" }
```

Optional `icon` is an existing local logo path (PNG/SVG/etc.); the CLI uses Next's
installed sharp to produce 192/512/maskable/Apple PNGs. Without it, neutral icons
are installed; replace them when branding is available without blocking setup.
`start_url` is the first tab's href. `--pwa` can be omitted for an initial App
placeholder. From the project root (Node; Windows/macOS/Linux):

```bash
node .agents/skills/app-setup/scripts/setup.mjs --tabs .agents/state/app-setup-tabs.json --pwa .agents/state/app-setup-pwa.json --dry-run
node .agents/skills/app-setup/scripts/setup.mjs --tabs .agents/state/app-setup-tabs.json --pwa .agents/state/app-setup-pwa.json
```

The CLI first runs the project's `comwit-ui add app-shell app-screen
bottom-sheet button` (router-detected variants; existing files are kept,
dependencies are not touched), then places them: `<AppShell tabs={APP_TABS}
top={<PwaInstallBanner />}>` around the routed UI in `layout/client.tsx`,
`<TabShell>` in the `(top-level)` layout, an empty `(detail)` layout, and PWA
setup. It writes `app-tabs.ts`, preserves auth hydration, moves an existing home
into `(top-level)` when `/` is a tab, and inserts the three guides below.
Boundary keys and transitions come from the tab list: tab paths keep the tab
bar and slide sideways, everything else drills in. Product pages and domain
queries are implemented in the next step. Page transitions lock wheel, touchmove
and page-scroll key input on the app's `<main>` scroller while they run. Keep
this unless the app manages transition input itself; then pass
`transitions={appTransitions(APP_TAB_PATHS, { scrollLock: false })}` to
`AppShell` and provide equivalent behavior.

`--dry-run` reports the plan without writes; reruns skip identical work.
Dependencies must already be installed. The known unchanged template manifest is
upgraded; custom files stay in the JSON `review` list. Resolve every review
item before completion, even when the command exits 0. The CLI does not remove
the skill or mark setup complete.

## 2. Implement the product using the installed guides

| Guide | Owns |
| --- | --- |
| `src/app/.ai.md` → Mobile App Route Groups | Route placement and the SEO-only interception decision |
| `src/services/page.ai.md` → Mobile App Detail UI | Shared screen UI and full/partial loading based on available data |
| `src/services/state.ai.md` → Mobile App Detail State | Global list lookup, a separate display seed, and detail query hydration |

Follow these guides to implement the requested tabs and detail flows with the
product's domain data (mock repositories are fine). Keep each decision in its
own guide; customize its example names to the app. Reuse the installed shell.
**Installing the shell or writing guides alone is not completion: the requested
routes, queries and shared detail UI must be connected.**

## 3. Validate, leave context, remove the skill

Resolve CLI review items and run `pnpm run validate`. After route moves, regenerate
stale types with `pnpm exec next typegen` if needed. Check the implemented flow:

- A matching list seed keeps existing content visible with partial loading;
  an empty cache shows full loading. A completed detail replaces the seed.
- Client-only details use one route. SEO details use the intended client/server
  entry points, share UI, and use a simple server Suspense skeleton.
- Tabs retain BottomNav; fullscreen details hide it. Back/forward and direct-entry
  parent fallback follow the installed navigation helper.

Run `pnpm run sw:build` and verify manifest/icons/metadata. Browser verification
belongs to the user under project rules: report untested route navigation,
scroll chrome, menu focus and PWA installation behavior. Do not deploy for testing.

Ensure the three inserted guides reflect the actual setup, record successful
validation, then run:

```bash
node .agents/scripts/cleanup-skill.mjs app-setup
```

Cleanup removes `.agents/skills/app-setup/` and its `.claude/skills/app-setup/` stub together; never delete only one of them. Leave installed files/guides and continue building the
remaining product features. Do not recreate the skill.
