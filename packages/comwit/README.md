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

Install `@comwit/state@beta` and keep the existing global Provider:

```tsx
;<ComwitProvider context={{ router }} getServerSearchParams={getServerSearchParams}>
  {children}
</ComwitProvider>

const thread = useSearchParam(locationModel, 'requestedThreadId', {
  key: 'thread',
  defaultValue: null,
  // history defaults to replace
})
```

`getServerSearchParams?: () => string | null` is optional and runs only during server
initialization. The Provider internally transfers its result to hydration. With a string result,
including `''`, the binding and following model selectors read the URL selection from the first
server/hydration render. Without a getter, or when it returns `null`, those renders use the model
default and the browser URL initializes state after commit. The browser never calls the getter.

Only search parameter bindings subscribe to native browser history. Ordinary model hooks are
unchanged. Model actions and `set()` use `replace` by default; opt into `history: 'push'` on a binding
or a single call. `ifRevision` guards stale async results, and unrelated queries/hash are preserved.
Bind a separate requested field when the active session field changes temporarily during loading.

[Read the server getter, hydration, history, and async contracts](https://library.comwit.io/docs/api/router).

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
