# @comwit/state

React / Next.js state management for vibe coding.

Battle-tested across 1,000+ projects on [comwit.io](https://comwit.io) — a Claude Code-powered vibe coding platform from Korea. Sponsored by [burrr.ai](https://burrr.ai).

> **Renamed from `comwit`.** As of v2.0.0 this library is published as `@comwit/state`.
> The API is unchanged — only the package name and import specifier changed.
> See the [migration notes](https://library.comwit.io/blog/v2.0.0-release).

## Install

```bash
npm i @comwit/state
```

## Setup

```
https://library.comwit.io/llms.txt
```

Pass the URL to Claude Code. It handles the rest.

## URL search parameters (beta)

```tsx
import { ComwitProvider, createBrowserRouterAdapter, useSearchParam } from '@comwit/state'

// Keep the adapter stable in a client Provider: useState(() => createBrowserRouterAdapter()).
;<ComwitProvider router={router}>{children}</ComwitProvider>

// Mount once in the route boundary, keyed by project ID when the project changes.
const thread = useSearchParam(threadModel, 'requestedThreadId', {
  key: 'thread',
  defaultValue: null,
  history: 'replace', // default; opt into 'push' to add history entries
})
```

The first commit reads the URL before enabling model write-back. Wait for `thread.ready`, retain a
valid URL selection, and normalize a missing/invalid value with
`thread.set(latestId, { history: 'replace', ifRevision: request.revision })`. Model actions and
`set()` replace the current history entry by default, so switching threads does not grow browser
history. Opt into `history: 'push'` on the binding or override one write with
`thread.set(id, { history: 'push' })`. Back/forward restores the model without an echo. Bind a
separate requested field when the active field changes temporarily during asynchronous loading.

The browser adapter observes native history changes and works with Next App Router's native
History API integration without a Next dependency. Query parameters and hash are preserved.
Custom adapters can implement `RouterAdapter` and be injected through the Provider.

[Read the initialization, cleanup, async race, and adapter contracts](https://library.comwit.io/docs/api/router).

For server-known selections, declare a `searchParamBinding()` and pass its model bindings and an
`initialSnapshot` to a page-level `ComwitRouterProvider`. The model selector and `useSearchParam(binding)`
then read the same URL value on the first server and hydration render. Only declared models receive a
new scope; shared auth/session models and context keep their parent owners. At commit the latest URL
is reconciled, and the initial snapshot is never replayed on later renders.

Server Components can serialize their framework's search parameters without importing React:

```ts
import { createRouterSnapshot } from '@comwit/state/router-snapshot'

const initialSnapshot = createRouterSnapshot({ pathname, searchParams: await searchParams })
```

This initializes selection state; message/query data loading remains the application's responsibility.

## Durable on-demand queries

```ts
const todos = local.collection<Todo>({ key: 'todos', version: 1 })

const todo = model({
  list: local.query<Todo[], TodoFilter>({
    source: todos,
    initialData: [],
    queryFn: api.todo.list,
  }),
  detail: local<Todo | null, { id: string }>({
    source: todos,
    initialData: null,
  }),
})
```

`local()` restores an exact IndexedDB view without making an API request. `local.query()` and
`local.infinite()` add background server revalidation while keeping the `.load()`, `.query()`,
`.refetch()`, `.set()`, and optimistic mutation interfaces.

[Read the local resource reference](https://library.comwit.io/docs/api/local).

## Loading and hydrating queries

Use `.load()` when the mounted client component owns the request:

```tsx
// Non-suspending: reports loading state, then starts after commit.
const list = usePost((state) => state.posts.load(filter))

// Server Component result: initialize cache, then read passively.
usePost.hydrate({ detail: { arg: slug, data: initialDetail } })
const detail = usePost((state) => state.detail.data)
```

The Server Component awaits its server function and passes the resolved seed only to a small client
route adapter. `hydrate()` initializes a complete success entry before the following domain hook
reads its first external-store snapshot. It returns nothing, never calls `queryFn`, and ignores
repeated equivalent values. A later value for an observed entry is applied in the requesting
render's layout commit, so an abandoned transition cannot tear the current screen.

Selector `.suspend(arg)` is experimental. It is intended only for query functions that may execute
during render in every runtime; it does not accept a Promise or initial-data override. Next.js
Server Functions must instead run in a Server Component and use `hydrate()` as above.

Do not initialize state by calling a mutating action during render, even through `silent()`.
`silent()` is deprecated and cannot suppress React's external-store snapshot checks.
