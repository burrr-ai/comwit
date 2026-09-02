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

Queries use `.load()` for ordinary non-suspending, effect-driven fetching. Resolved data fetched by
a Server Component can initialize the provider-scoped query cache before the first passive read:

```tsx
const list = usePost((state) => state.posts.load(filter))

usePost.hydrate({ detail: { arg: slug, data: initialDetail } })
const detail = usePost((state) => state.detail.data)
```

Fetch and await `initialDetail` in a Server Component, then pass it only to a small client route
adapter that calls `hydrate()` before the normal domain hook. Actual UI reads the domain hook and
does not receive server data props. `hydrate()` is idempotent; it does not call `queryFn` or use a
mutating action. A brand-new entry initializes before its first snapshot, while an observed entry
is replaced only after the requesting render commits.

Selector `.suspend(arg)` remains experimental for isomorphic query functions. Next.js Server
Functions cannot be called from a Client Component's initial render, and server and browser caches
still require explicit hydration. The descriptor-level `suspense` option and render-time `silent()`
hydration are deprecated. No Provider change is required; models remain lazy until accessed.
