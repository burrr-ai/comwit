# comwit

Next.js state management for vibe coding. Published on npm as [`@comwit/state`](https://www.npmjs.com/package/@comwit/state).

Battle-tested across 1,000+ projects on [comwit.io](https://comwit.io) — a Claude Code-powered vibe coding platform from Korea. Sponsored by [burrr.ai](https://burrr.ai).

> **Renamed:** the npm package `comwit` is now `@comwit/state` (v2.0.0+). The API is
> identical — only the package name changed. The old `comwit` package is deprecated
> and re-exports `@comwit/state`, so existing installs keep working.
> See the [v2.0.0 release notes](https://library.comwit.io/blog/v2.0.0-release).

## Install

```bash
npm i @comwit/state
```

## Setup

```
https://library.comwit.io/llms.txt
```

Pass the URL to Claude Code. It handles the rest.

The `2.2` beta adds normalized IndexedDB-backed standalone resources through `local()`, plus
query-backed revalidation through [`local.query()` and `local.infinite()`](https://library.comwit.io/docs/api/local).

Queries now choose loading behavior at the selector call site. `.load()` keeps the ordinary
non-suspending, effect-driven flow; `.suspend()` starts during render and waits for the keyed query
before the tree commits:

```tsx
const list = usePost((state) => state.posts.load(filter))
const detail = usePost((state) => state.detail.suspend(slug))
```

Wrap the SSR path in `<Suspense>` to stream a fallback. Without an explicit boundary, React 19's
streaming server renderer waits at the root for the result. The descriptor-level `suspense` option
and render-time `silent()` hydration are deprecated. No Provider change is required; models remain
lazy until their domain hook is rendered.

For browser mounting and hydration, keep the `<Suspense>` boundary below `ComwitProvider`. A client
root that suspends before the Provider commits can discard its provider-scoped cache and restart the
query.
