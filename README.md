# muchajs

State management for Next.js.

> Give this document to Claude Code. It sets up your project.

## 1. Install

```bash
npm i muchajs
```

## 2. Setup Provider

Create `app/providers.tsx` and wrap your root layout.

```tsx
// app/providers.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { keepPreviousData, MuchaProvider } from 'muchajs'
import { ReactNode } from 'react'

type AppContext = {
  router: { push: (href: string) => void }
}

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()
  const context: AppContext = { router }

  return (
    <MuchaProvider
      context={context}
      defaultOptions={{
        query: {
          staleTime: 30_000,
          cacheTime: 120_000,
          gcTime: 180_000,
          placeholderData: keepPreviousData,
        },
      }}
    >
      {children}
    </MuchaProvider>
  )
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## 3. Create `state/.ai.md`

Create `src/state/.ai.md` (or `state/.ai.md`) with the full content below.

## 4. Update `CLAUDE.md`

Add this to your project's `CLAUDE.md`:

```md
## State Management

This project uses muchajs. When working on files in state/, always read state/.ai.md first.
```

---

## state/.ai.md Content

Copy everything between the ````fences into your`state/.ai.md`:

````md
## Structure

```
state/{domain}/
  ├── types.ts          # State + Actions types
  ├── model.ts          # model() with initial state
  ├── actions/
  │   ├── crud.ts       # CRUD operations
  │   ├── load.ts       # Data fetching / query triggers
  │   ├── init.ts       # SSR hydration via silent()
  │   └── ...           # One file per concern
  └── index.ts          # create() hook + re-exports
```

Write order: **types.ts -> model.ts -> actions/\*.ts -> index.ts**

## Rules

- Actions define all side effects — UI event handlers just call one action, never compose multiple
- Actions read state internally via `state(model)` — if you already know it (user, current item), don't take it as a parameter
- One action = one complete transaction (optimistic + API + rollback)
- Sync list and detail in one action — update `current` and matching item in `items[]` together
- Optimistic updates: snapshot -> mutate -> try API -> catch restore + rethrow
- SSR data: `silent()` init, no useEffect. Client data: `query()`
- Pass domain objects whole: `<Card post={post} />`
- Dependencies: pages -> state -> api (one way)

## File Templates

### types.ts

```ts
export type Todo = { id: string; title: string; status: 'pending' | 'done' }

export type TodoState = {
  todos: Todo[]
  current: Todo | null
}

export type TodoActions = {
  /** Create with optimistic update */
  create(title: string): Promise<void>
  /** Delete with rollback */
  delete(id: string): Promise<void>
  /** Init from SSR — no re-render */
  init(todos: Todo[]): void
}
```

### model.ts

```ts
import { model } from 'muchajs'
import type { TodoState } from './types'

export const todo = model<TodoState>({
  todos: [],
  current: null,
})
```

### actions/\*.ts

```ts
import { action, OnError } from 'muchajs'
import type { TodoActions } from '../types'
import { todo } from '../model'

export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete'>>(({ state }) => {
  class TodoCrudActions {
    private model = state(todo)

    @OnError((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Unexpected error')
    })
    async create(title: string) {
      /* optimistic update -> try API -> catch rollback */
    }
    async delete(id: string) {
      /* snapshot -> remove -> try API -> catch restore */
    }
  }
  return new TodoCrudActions()
})
```

### index.ts

```ts
import { create } from 'muchajs'
import type { TodoState, TodoActions } from './types'
import { todo } from './model'
import { todoCrudActions } from './actions/crud'
import { todoInitActions } from './actions/init'
// ...

export const useTodo = create<TodoState, TodoActions>(todo, {
  actions: [todoCrudActions, todoInitActions /* ... */],
})
export type { Todo, TodoState, TodoActions } from './types'
```

### Cross-Domain — Auth Check

Access other domain models inside actions via `state()`. Common use: check user auth before mutations.

```ts
import { user } from '@/state/user/model'

export const orderCrudActions = action<Pick<OrderActions, 'create'>>(({ state }) => {
  class OrderCrudActions {
    private order = state(order)
    private user = state(user) // read user domain

    async create(productId: string) {
      if (!this.user.me) return // already known — no param needed
      this.order.items.push(await api.createOrder({ productId }))
    }
  }
  return new OrderCrudActions()
})
```

### Context — Router / App-Level Values

Inject via MuchaProvider context. Second generic: `action<Actions, AppContext>()`.

```ts
export const todoNavActions = action<NavActions, AppContext>(({ state, context }) => {
  class NavActions {
    private model = state(todo)
    openDetail(id: string) {
      context.router.push(`/todo/${id}`)
    }
  }
  return new NavActions()
})
```

## Data Loading — SSR vs Client Fetch

Two patterns depending on where data comes from:

| Scenario                            | Pattern                  | Loading UI?                                       |
| ----------------------------------- | ------------------------ | ------------------------------------------------- |
| Server already has data (SSR props) | Plain state + `silent()` | No — data is ready                                |
| Client fetches on mount/interaction | `query()` in model       | Yes — `isLoading`, `isError`, `data` auto-managed |

### SSR — Plain State + `silent()`

Server component fetches, client component hydrates via `silent()` — no re-render, no loading state.

```ts
// state/user/actions/init.ts
export const userInitActions = action<Pick<UserActions, 'init'>>(({ state }) => {
  class UserInitActions {
    private model = state(user)
    init(me: User | null) {
      silent(() => {
        this.model.me = me
        this.model.isAuthenticated = !!me
      })
    }
  }
  return new UserInitActions()
})
```

```tsx
// Server component fetches → Client component hydrates
export default async function Page() {
  const me = await api.user.me()
  return <Dashboard initialUser={me} />
}

function Dashboard({ initialUser }) {
  const { actions } = useUser((s) => ({ actions: s.actions }))
  actions.init(initialUser) // silent — no useEffect needed
  return <Profile />
}
```

### Client Fetch — `query()`

When the client fetches data (no SSR), use `query()`. It auto-manages `isLoading` / `isError` / `data`.

```ts
// types.ts — wrap with Query<T>
import { Query } from 'muchajs'
export type FeedState = {
  posts: Query<Post[]>
  trending: Query.Infinite<Post[]>
}
```

```ts
// model.ts — define queryFn
import { model, query } from 'muchajs'
export const feed = model<FeedState>({
  posts: query<Post[]>({
    initialData: [],
    queryFn: () => api.feed.latest(),
  }),
  trending: query.infinite<Post[]>({
    initialData: [],
    queryFn: ({ cursor }) => api.feed.trending(cursor),
  }),
})
```

```ts
// actions — trigger fetch
async loadPosts() { await this.model.posts.query() }
async loadMoreTrending() { await this.model.trending.nextFetch() }
```

Methods: `.query(arg?)` · `.refetch()` · `.set(data)` · `.nextFetch()` · `.previousFetch()`
Flags: `isLoading` · `isFetching` · `isSuccess` · `isError` · `error`
Options: `staleTime` · `cacheTime` · `gcTime` · `placeholderData` · `force`

```tsx
// UI — loading/error states are automatic
function FeedList() {
  const { posts } = useFeed((s) => ({ posts: s.posts }))

  if (posts.isLoading) return <Skeleton />
  if (posts.isError) return <p>Error: {posts.error}</p>
  return posts.data.map((post) => <Card key={post.id} post={post} />)
}
```

## Usage

```tsx
const { todos, actions } = useTodo((s) => ({
  todos: s.todos,
  actions: s.actions,
}))
```

Selectors use deep equality — only re-renders when selected values change.

## List + Current Pattern

When a domain has both a list view and a detail view, manage `items[]` + `current` together as plain state. Sync both in one action — don't split into separate calls.

```ts
async like() {
  if (!this.model.current) return
  // Update detail
  this.model.current.likeCount += 1
  this.model.current.isLiked = true
  // Sync list
  const item = this.model.items.find((p) => p.id === this.model.current!.id)
  if (item) { item.likeCount += 1; item.isLiked = true }
  await api.like(this.model.current.id)
}
```

## Decorators

All from `'muchajs'`. Stack on class methods.

| Decorator                       | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `@OnError(fn)`                  | Error handler. Re-throw to propagate.                 |
| `@OnSuccess(fn)`                | Success callback.                                     |
| `@Debounce(ms)`                 | Debounce.                                             |
| `@Throttle(ms)`                 | Throttle.                                             |
| `@Authorized({ when, onDeny })` | Auth guard. `when: () => boolean \| Promise<boolean>` |

Reusable guard with `createInterceptor` — accesses `state`/`context` at decoration time:

```ts
import { createInterceptor, onAuthorized } from 'muchajs'

const LoginRequired = createInterceptor(({ state, context }) =>
  onAuthorized({
    when: () => Boolean(state(user).me),
    onDeny: () => context.router.push('/login'),
  })
)
```

`createInterceptor` receives `({ state, context })` like action factories, so `state()` is properly scoped. Use this when guards need to read domain state or app context.

## Key Concepts

- `model(initial)` — global reactive store
- `action(factory)` — factory with `state`/`context` access
- `create(model, { actions })` — model + actions -> React hook
- `silent(fn)` — suppress re-renders (SSR)
- `query()` / `query.infinite()` — client fetch in model
- `state(model)` — mutable proxy in actions
````
