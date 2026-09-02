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

## Durable on-demand queries (2.2 beta)

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

`local()` restores an exact IndexedDB view without making an API request, which fits server-owned
SEO details. `local.query()` and `local.infinite()` add background server revalidation while keeping
the `.load()`, `.suspend()`, `.query()`, `.refetch()`, `.set()`, and optimistic mutation interfaces.

[Read the local resource reference](https://library.comwit.io/docs/api/local).

## Loading queries

Choose loading behavior where the query is consumed:

```tsx
// Non-suspending: reports loading state, then starts after commit.
const list = usePost((state) => state.posts.load(filter))

// SSR/Suspense: starts or reuses a keyed Promise during render.
const detail = usePost((state) => state.detail.suspend(slug))
```

`suspend()` throws the cached Promise while pending. A surrounding `<Suspense>` renders its
fallback; without one, React 19 streaming SSR waits at the root. The descriptor-level `suspense`
option is deprecated. Provider setup is unchanged and models remain lazy until accessed.

For browser mounting and hydration, place the `<Suspense>` boundary below `ComwitProvider` so the
provider-scoped query cache survives a suspended initial render.

Do not initialize state by calling a mutating action during render, even through `silent()`.
`silent()` is deprecated and cannot suppress React's external-store snapshot checks.
