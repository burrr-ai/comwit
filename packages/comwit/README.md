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
the existing `.load()`, `.query()`, `.refetch()`, `.set()`, and optimistic mutation interfaces.
Action-side `.draft()`, `.commitDraft()`, and `.discardDraft()` protect an active local view from
polling responses until its server mutation settles.

[Read the local resource reference](https://library.comwit.io/docs/api/local).
