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
  list: local(
    query<Todo[], TodoFilter>({
      initialData: [],
      queryFn: api.todo.list,
    }),
    { source: todos }
  ),
})
```

`local(query(...))` restores exact argument views from normalized IndexedDB entities and uses the
original `queryFn` to revalidate stale data. The `.load()`, `.query()`, `.refetch()`, `.set()`, and
optimistic mutation interfaces remain unchanged.

[Read the local query reference](https://library.comwit.io/docs/api/local).
