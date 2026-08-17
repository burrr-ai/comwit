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
