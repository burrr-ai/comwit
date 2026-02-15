# Yoshi

React state management library.
Define domain state as plain objects, optimize re-renders with immutable snapshots.

## Folder Structure

```
state/
  todo/
    types.ts
    model.ts
    actions/
      crud.ts
      bulk.ts
      counter.ts
    index.ts
```

Each domain gets its own folder with a consistent layout:

- `types.ts` — State and Actions interfaces. Read this file to understand the entire domain.
- `model.ts` — Factory function returning the initial state.
- `actions/` — One file per concern. Each file exports a single action factory.
- `index.ts` — Assembles model + actions with `create()` and re-exports types.

## Setup

Wrap your app root with `MuchaProvider`.

```tsx
import { MuchaProvider } from 'muchajs'

function App() {
  return (
    <MuchaProvider>
      <YourApp />
    </MuchaProvider>
  )
}
```

## Usage

```tsx
import { useTodo } from '@/state/todo'

function TodoPage() {
  const todo = useTodo()

  // read state
  todo.count
  todo.todos

  // call actions
  todo.actions.create({ title: 'New todo' })
  todo.actions.increment()

  return <div>{todo.count}</div>
}
```

### Selectors

Pass a selector to pick only what you need from a single call.

```tsx
const { count, todos, actions } = useTodo(s => ({
  count: s.count,
  todos: s.todos,
  actions: s.actions,
}))
```

## Writing Guide

Write files in this order: **types → model → actions → index**.

### 1. types.ts

Add JSDoc comments to actions — they show up in editor hover tooltips and help LLMs understand the domain from this file alone.

```ts
// state/todo/types.ts
export type TodoState = {
  todos: Todo[]
  errorMessage: string
}

export type TodoActions = {
  /** Create a new todo and append it to the list */
  create(title: string): Promise<void>
  /** Delete a todo by id */
  delete(id: string): Promise<void>
  /** Bulk delete todos. Requires admin permission. */
  deleteMany(ids: string[]): Promise<void>
}
```

### 2. model.ts

```ts
// state/todo/model.ts
import { model } from 'muchajs'
import type { TodoState } from './types'

export const todoModel = model<TodoState>({
  todos: [],
  errorMessage: '',
})
```

### 3. actions/

```ts
// state/todo/actions/crud.ts
import { action } from 'muchajs'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete'>>(({ inject }) => {
  const model = inject(todoModel)

  return {
    async create(title) {
      const todo = await api.createTodo({ title })
      model.todos.push(todo)
    },
    async delete(id) {
      model.todos = model.todos.filter(t => t.id !== id)
      await api.deleteTodo(id)
    },
  }
})
```

For class-based actions with decorators, declare the class and return an instance:

```ts
class TodoCrudActionHandlers {
  constructor(private readonly model: TodoState) {}

  async create(title: string) {
    const todo = await api.createTodo({ title })
    this.model.todos.push(todo)
  }

  async delete(id: string) {
    this.model.todos = this.model.todos.filter(t => t.id !== id)
    await api.deleteTodo(id)
  }
}

export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete'>>(({ inject }) => {
  const model = inject(todoModel)
  return new TodoCrudActionHandlers(model)
})
```

### 4. index.ts

```ts
// state/todo/index.ts
import { create } from 'muchajs'
import type { TodoState, TodoActions } from './types'
import { todoModel } from './model'
import { todoCrudActions } from './actions/crud'
import { todoBulkActions } from './actions/bulk'

export const useTodo = create<TodoState, TodoActions>(todoModel, {
  actions: [todoCrudActions, todoBulkActions],
})

export type { TodoState, TodoActions } from './types'
```

## Additional Usage Patterns

### Combine Action Modules

You can split domain logic into multiple action files and compose them in one hook.

```ts
// state/todo/index.ts
import { create } from 'muchajs'
import type { TodoState, TodoActions } from './types'
import { todoModel } from './model'
import { todoCrudActions } from './actions/crud'
import { todoBulkActions } from './actions/bulk'
import { todoFilterActions } from './actions/filter'

export const useTodo = create<TodoState, TodoActions>(todoModel, {
  actions: [todoCrudActions, todoBulkActions, todoFilterActions],
})
```

### Inject Other Domain State in an Action

`inject()` lets one domain read/write another domain model in a controlled way.

```ts
// state/order/actions/create.ts
import { action, silent } from 'muchajs'
import { orderModel } from '../model'
import { userModel } from '@/state/user/model'

export const orderActions = action(({ inject }) => {
  const order = inject(orderModel)
  const user = inject(userModel)

  return {
    async create(input: { productId: string }) {
      if (!user.auth) return
      const created = await api.createOrder(input)
      order.items.push(created)
    },
    resetToServer(data) {
      silent(() => {
        order.items = data
      })
    },
  }
})
```

### Avoid Unnecessary Renders

Selectors are compared with deep equality before React emits updates, so derived objects are safe.

```tsx
import { useTodo } from '@/state/todo'

const todoCount = useTodo(s => s.count)

// Only re-render when `count` changes
const { count, actions } = useTodo(s => ({
  count: s.count,
  actions: s.actions,
}))
```

### Use Multiple Providers for Isolation

`MuchaProvider` instances are scoped by subtree.

```tsx
<MuchaProvider>
  <AppShell />
</MuchaProvider>

<MuchaProvider>
  <EmbeddedWidget />
</MuchaProvider>
```

### SSR / Hydration Helpers

When initializing state from server data, use `silent()` to avoid client re-renders while bootstrapping.

```ts
import { action, silent } from 'muchajs'

export const todoInitActions = action(({ inject }) => {
  const model = inject(todoModel)

  return {
    bootstrap(serverTodos: Todo[]) {
      silent(() => {
        model.todos = serverTodos
      })
    },
  }
})
```

Use this init action directly during render/initialization (not inside `useEffect`), following the playground `TodoPage` pattern:

```tsx
export function TodoPage({ initialTodos }: { initialTodos: Todo[] }) {
  const { actions } = useTodo(s => ({ actions: s.actions }))
  actions.init(initialTodos)

  return <main>...</main>
}
```

## Interceptors

Interceptors can be used in two styles in `actions`:

1) Decorator style (class-based actions)

```ts
import { action, OnError, OnSuccess, Debounce, Transaction } from 'muchajs'

export const todoActions = action(({ inject }) => {

  class TodoActions {
    private model = inject(todoModel)

    @Debounce(300)
    @OnError((error) => {
      sonner.error(error.message ?? 'An unexpected error occurred while processing the request')
      throw error
    })
    @OnSuccess((result) => {
      console.log('saved', result)
    })
    async save(payload: { title: string }) {
      this.model.todos.push(await api.saveTodo(payload))
    }
  }

  return new TodoActions()
})
```

2) Function style (pipe)

```ts
import { action, onError, onSuccess, debounce, pipe } from 'muchajs'

export const todoActions = action(({ inject }) => {
  const model = inject(todoModel)
  const save = async (payload: { title: string }) => {
    model.todos.push(await api.saveTodo(payload))
  }

  return {
    save: pipe(
      onError((error) => {
        sonner.error(error.message ?? 'An unexpected error occurred while processing the request')
        throw error
      }),
      onSuccess((result) => console.log('saved', result)),
      debounce(300),
    )(save),
  }
})
```


## Data Fetching with Query (domain-first)

`query` now follows a query-oriented API.

- `query({...})` creates a single resource
- `query.infinite({...})` creates an infinite resource
- `query(arg?, options?)` is the fetch entry
- `query` has no separate page-builder in this version

### Query types

```ts
// state/todo/types.ts
import { Query } from 'muchajs'

export type Todo = { id: string; title: string; status: 'pending' | 'done' }
export type TodoPageResult = {
  data: Todo[]
  page: number
  totalPage: number
  totalCount: number
}

export type TodoState = {
  me: Query<Todo>
  todos: Query<TodoPageResult, { page?: number }>
  feed: Query.Infinite<Todo[]>
}
```

### Provider default options

```tsx
import { MuchaProvider, keepPreviousData } from 'muchajs'

function App() {
  return (
    <MuchaProvider
      defaultOptions={{
        query: {
          staleTime: 60_000,
          placeholderData: keepPreviousData,
        },
      }}
    >
      <YourApp />
    </MuchaProvider>
  )
}
```

### Model registration

```ts
// state/todo/model.ts
import { keepPreviousData, model, query } from 'muchajs'
import type { Todo, TodoPageResult, TodoState } from './types'

export const todoModel = model<TodoState>({
  me: query<Todo>({
    initialData: { id: '', title: '', status: 'pending' },
    queryFn: async () => {
      return { id: 'id-1', title: 'Demo', status: 'pending' }
    },
    placeholderData: keepPreviousData,
  }),
  todos: query<TodoPageResult, { page?: number }>({
    initialData: { data: [], page: 1, totalPage: 1, totalCount: 0 },
    queryFn: ({ page = 1 }) => {
      return api.todo.findAll({ page })
    },
    placeholderData: keepPreviousData,
  }),
  feed: query.infinite<Todo[]>({
    initialData: [],
    queryFn: ({ cursor }) => api.todo.findAfter(cursor),
  }),
  })
```

`defaultOptions.query` values are used whenever a query call does not provide its own options.  
Per-query options override provider defaults, and per-call options override both.

```tsx
// default option: stale for 60s
<MuchaProvider
  defaultOptions={{
    query: {
      staleTime: 60_000,
      cacheTime: 60_000,
      placeholderData: keepPreviousData,
    },
  }}
>
  <App />
</MuchaProvider>

// Uses provider defaults
await state.users.query() // staleTime 60_000, cacheTime 60_000, placeholderData keepPreviousData

// Override for only this call
await state.users.query(
  { page: 2 },
  { staleTime: 0, force: true },
)
```

### Action usage

```ts
// state/todo/actions/crud.ts
import { action } from 'muchajs'
import { todoModel } from './model'

export const todoActions = action(({ inject }) => {
  const state = inject(todoModel)

  return {
    async refreshMe() {
      await state.me.query()
    },
    async loadNextPage() {
      const nextPage = Math.min(state.todos.data.page + 1, state.todos.data.totalPage)
      await state.todos.query({ page: nextPage })
    },
    async loadNextFeed() {
      await state.feed.nextFetch()
    },
    async reloadFeed() {
      await state.feed.refetch()
    },
  }
})
```

### Builder and call options

- `staleTime`: stale threshold in ms
- `cacheTime` / `gcTime`: cache duration hints
- `placeholderData`: function or value for transitional data
- `force`: force execute even if cache is still fresh

```ts
await state.todos.query(
  { page: 3 },
  {
    force: true,
    staleTime: 0,
    placeholderData: keepPreviousData,
  },
)
```

`placeholderData` can also be a value/function:

```ts
import { keepPreviousData, type PlaceholderData } from 'muchajs'

const same: PlaceholderData<TodoPageResult, { page?: number }> = keepPreviousData
```

`isLoading` is `true` for the initial query phase (before first success), and `false` during background refetches.

`Query` states always provide these flags:

- `isLoading`
- `isFetching`
- `isSuccess`
- `isError`
- `error`

State fields:

- `Query<TData, TArg>`: `data`, query args are part of method signature
- `Query.Infinite`: `data`, `cursor`, `hasMore`
