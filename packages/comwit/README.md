# @comwit/state

**React state for you and your agent.**

State management for React and Next.js, published as **`@comwit/state`**. Keep client state,
server queries, and actions in one domain, then use them through one typed hook.

[Website](https://library.comwit.io) · [Documentation](https://library.comwit.io/docs) · [Quickstart](https://library.comwit.io/docs/guide/quickstart) · [npm](https://www.npmjs.com/package/@comwit/state)

Used in 1,000+ projects on [comwit.io](https://comwit.io), a Claude Code-powered vibe coding platform
from Korea. Sponsored by [burrr.ai](https://burrr.ai).

## Why comwit?

- **One domain, one hook.** Define a model, add actions, and combine them with `create()`.
- **Client state and server data together.** Reactive values, cached queries, and server hydration
  share the same domain.
- **Direct mutations inside actions.** Update state with ordinary JavaScript; components subscribe
  through selectors.
- **Built for coding agents.** A compact [`llms.txt`](https://library.comwit.io/llms.txt) covers setup,
  domain structure, and the core APIs.

## Installation

```bash
npm install @comwit/state
```

Supports **React 18 and 19**. For Next.js, follow the
[App Router setup](https://library.comwit.io/docs/guide/quickstart).

### Working with an AI agent

Give Claude Code or your coding agent this prompt:

```text
Set up @comwit/state in this project using https://library.comwit.io/llms.txt.
Follow its domain structure and state management patterns.
```

## Quick start

A complete counter in one file:

```tsx
'use client'

import { action, ComwitProvider, create, model } from '@comwit/state'

type CounterState = { count: number }
type CounterActions = { increment(): void; reset(): void }

const counter = model<CounterState>({ count: 0 })

const counterActions = action<CounterActions>(({ state }) => {
  const m = state(counter)

  return {
    increment() {
      m.count += 1
    },
    reset() {
      m.count = 0
    },
  }
})

const useCounter = create<CounterState, CounterActions>(counter, {
  actions: [counterActions],
})

function Counter() {
  const { count, actions } = useCounter((s) => ({ count: s.count, actions: s.actions }))

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={actions.increment}>Add one</button>
      <button onClick={actions.reset}>Reset</button>
    </div>
  )
}

export default function App() {
  return (
    <ComwitProvider>
      <Counter />
    </ComwitProvider>
  )
}
```

Each `ComwitProvider` owns its state, and models initialize only when accessed. As the app grows,
split models, actions, and hooks into [domain folders](https://library.comwit.io/docs/guide/structure).

## Beyond client state

| What you need                                              | API / guide                                                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Fetch and cache server data                                | [`query()` + `.load(arg)`](https://library.comwit.io/docs/api/query)             |
| Initialize queries from Server Component data              | [`useDomain.hydrate(...)`](https://library.comwit.io/docs/guide/nextjs)          |
| Restore an exact IndexedDB view without an API request     | [`local()` + `.restore(arg)`](https://library.comwit.io/docs/api/local)          |
| Keep IndexedDB views and revalidate from the server        | [`local.query()` / `local.infinite()`](https://library.comwit.io/docs/api/local) |
| Persist browser-owned preferences                          | [`persist()`](https://library.comwit.io/docs/api/persist)                        |
| Derive values from state                                   | [`computed()`](https://library.comwit.io/docs/api/computed)                      |
| Undo and redo state changes                                | [`$history`](https://library.comwit.io/docs/api/history)                         |
| Add retries, debounce, or shared error handling to actions | [Action decorators](https://library.comwit.io/docs/decorators)                   |

### Queries and Next.js

Use `.load(arg)` in a selector for ordinary client fetching. It reports loading state during render
and starts the request after commit. Reading query state without `.load()` does not start a request.

For server-owned data, await it in a Server Component and pass the resolved value to a small client
route adapter. Call `useDomain.hydrate(...)` there before the normal domain hook reads the data.
Hydration is idempotent, never calls `queryFn`, and applies changes to already observed entries only
after the requesting render commits. See the [Next.js guide](https://library.comwit.io/docs/guide/nextjs).

Selector `.suspend(arg)` is experimental and requires query functions that can run during render
on both server and client. Next.js Server Functions must use the server-fetch-and-hydrate flow above.
The descriptor-level `suspense` option and `silent()` are deprecated; do not hydrate through a
mutating action during render.

### Slow initial loading

Set `slowLoadingMs: 500` on `query()` or `local.query()` and read `isSlowLoading` through the usual
query state. Existing loading flags, requests, cache freshness, and data delivery keep their timing.
The new flag stays false for fast completion and usable cached data, becomes true for a continuing
initial load, and clears immediately on success/error. No component, effect, or request key is needed.
See the [query guide](https://library.comwit.io/docs/api/query#slow-initial-loading) for rendering,
SSR, retries, cleanup, and the supported query variants. This is a query declaration option, not a
model/provider default or a standalone `local()` option.

### URL state

`searchParam()` declares typed URL-backed fields directly in a model. Read them through the same
domain hook and update them through actions.

```bash
npm install @comwit/state@2.4.0
```

See the [URL state reference](https://library.comwit.io/docs/api/router) for parsing, defaults,
browser history, and server rendering.

## Documentation

Start at **[library.comwit.io](https://library.comwit.io)**.

- [Quickstart](https://library.comwit.io/docs/guide/quickstart) — installation, provider, and your first domain.
- [Project structure](https://library.comwit.io/docs/guide/structure) — organize a growing app by domain.
- [AI agent setup](https://library.comwit.io/docs/llm-setup) — use the compact guide and detailed references.
- [Release notes](https://library.comwit.io/blog) — changes and migration guides.

## Migrating from `comwit`

Since v2.0.0, the package is named `@comwit/state`. Replace the dependency and update imports:

```diff
- import { model, action } from 'comwit'
+ import { model, action } from '@comwit/state'
```

The rename did not change the API. The deprecated `comwit` package re-exports `@comwit/state` for
compatibility. See the [v2.0.0 migration notes](https://library.comwit.io/blog/v2.0.0-release).

## License

[MIT](./LICENSE)
