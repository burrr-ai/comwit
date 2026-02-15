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

Wrap your app root with `StateProvider`.

```tsx
import { StateProvider } from 'muchajs'

function App() {
  return (
    <StateProvider>
      <YourApp />
    </StateProvider>
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

`StateProvider` instances are scoped by subtree.

```tsx
<StateProvider>
  <AppShell />
</StateProvider>

<StateProvider>
  <EmbeddedWidget />
</StateProvider>
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

Use this init action directly during render/initialization (not inside `useEffect`) with a one-time guard, following the playground `TodoPage` pattern:

```tsx
import { useRef } from 'react'

export function TodoPage({ initialTodos }: { initialTodos: Todo[] }) {
  const { actions } = useTodo(s => ({ actions: s.actions }))
  const initedRef = useRef(false)

  if (!initedRef.current) {
    initedRef.current = true
    actions.init(initialTodos)
  }

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

## Data Fetching with Resource (domain-first)

```ts
// state/todo/types.ts
import { Resource } from 'muchajs'

export type Todo = { id: string; title: string; status: 'pending' | 'done' }

export type TodoState = {
  todos: Resource.Page<Todo[]>
  filter: { status: 'all' | 'pending' | 'done' }
}
```

```ts
// state/todo/model.ts
import { model, resource } from 'muchajs'
import type { Todo, TodoState } from './types'

export const todoModel = model<TodoState>({
  todos: resource.page({
    initialData: [] as Todo[],
    load: async ({ page }) => {
      const r = await api.memo.findAll({ page })
      return {
        data: r.items,
        page: r.page,
        totalPage: r.totalPage,
        totalCount: r.totalCount,
      }
    },
  }),
  filter: { status: 'all' },
})
```

`initialData` is the only required input for every resource definition. Loading flags are preinitialized (`isLoading`, `isFetching`, `isSuccess`, `isError`, `error`) and page/infinite fields get safe defaults.

```ts
// state/todo/actions/crud.ts
import { action } from 'muchajs'
import { todoModel } from './model'

export const todoActions = action(({ inject }) => {
  const state = inject(todoModel)

  return {
    async reload() {
      await state.todos.load()
    },
    async nextPage() {
      await state.todos.load({ page: state.todos.page + 1 })
    },
  }
})
```

### Resource builders and exposed types

`resource()` has three factory forms:

- `resource({...})` → `Resource.Single<TData>` (single shape)
- `resource.page({...})` → `Resource.Page<TData>`
- `resource.infinite({...})` → `Resource.Infinite<TData>`

Common builder options:

```ts
resource({
  initialData: TData,             // required
  keepPreviousData?: boolean,      // keep data while fetching
  load?: (...) => ...,
})
```

```ts
export type TodoState = {
  single: Resource.Single<Todo[]>
  paged: Resource.Page<Todo[]>
  infinite: Resource.Infinite<Todo[]>
}
```

```ts
// state/todo/model.ts
import { model, resource } from 'muchajs'
import type { Todo, TodoState } from './types'

export const todoModel = model<TodoState>({
  single: resource({
    initialData: [] as Todo[],
    keepPreviousData: true,
    load: ({ state }) => {
      return state.data
    },
  }),
  paged: resource.page({
    initialData: [] as Todo[],
    keepPreviousData: false,
    load: async ({ page }) => {
      const r = await api.todo.findAll({ page })
      return {
        data: r.items,
        page: r.page,
        totalPage: r.totalPage,
        totalCount: r.totalCount,
      }
    },
  }),
  infinite: resource.infinite({
    initialData: [] as Todo[],
    keepPreviousData: true,
    load: async ({ cursor }) => api.todo.findAfter(cursor),
    loadMore: async ({ cursor }) => api.todo.findAfter(cursor),
  }),
})
```

### Resource loading strategy (`load` / `loadMore`) and `keepPreviousData`

`keepPreviousData` controls whether current `data` is preserved during loading. If true, `isLoading` stays false while `isFetching` can still be true.

- builder-level: set `keepPreviousData` in `resource(...)`, `resource.page(...)`, `resource.infinite(...)`
- call-level override:
  - `state.paged.load(arg, { keepPreviousData: true })`
  - `state.single.load({ keepPreviousData: true })`
  - `state.infinite.loadMore(arg, { keepPreviousData: true })`

```ts
export const todoActions = action(({ inject }) => {
  const state = inject(todoModel)

  return {
    async refresh() {
      await state.single.load({ keepPreviousData: true })
      await state.paged.load({ page: 2 }, { keepPreviousData: true })
      await state.infinite.loadMore({ cursor: state.infinite.cursor }, { keepPreviousData: true })
    },
  }
})
```

Merge behavior:
- single: returned value (or `undefined`) replaces `data`
- page/infinite: returned `{ data, ... }` is merged into state
- infinite `loadMore`: when both arrays exist, returned `data` is appended to existing `data`

```tsx
const { todos, actions } = useTodo(s => ({ todos: s.todos, actions: s.actions }))

if (todos.isLoading) return <span>loading...</span>
if (todos.isError) return <span>{String(todos.error)}</span>

// load can be used from actions; keep UI state focused on flags/data
```

`Resource` states use one `is*` shape across modes.
- `isLoading`
- `isFetching`
- `isSuccess`
- `isError`
- `error`

Mode fields.
- `Single`: `data`
- `Page`: `data`, `page`, `totalPage`, `totalCount` (use `load` for next page)
- `Infinite`: `data`, `cursor`, `hasMore`
