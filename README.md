# muchajs

State management for Next.js. Built for Claude Code.

> Give this document to Claude Code. It handles the rest.

## Install

```bash
npm i muchajs
```

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

## Folder Structure

```
state/
  todo/
    types.ts
    model.ts
    actions/
      crud.ts
      bulk.ts
    index.ts
```

Each domain gets its own folder with a consistent layout:

- `types.ts` — State and Actions interfaces. Read this file to understand the entire domain.
- `model.ts` — Factory function returning the initial state.
- `actions/` — One file per concern. Each file exports a single action factory.
- `index.ts` — Assembles model + actions with `create()` and re-exports types.

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

Use class-based actions with decorators.

```ts
// state/todo/actions/crud.ts
import { action, OnError, OnSuccess, Debounce } from 'muchajs'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete'>>(({ inject }) => {
  class TodoCrudActionHandlers {
    private model = inject(todoModel)

    @OnError((error) => {
      sonner.error(error.message ?? 'An unexpected error occurred')
      throw error
    })
    async create(title: string) {
      const todo = await api.createTodo({ title })
      this.model.todos.push(todo)
    }

    async delete(id: string) {
      this.model.todos = this.model.todos.filter(t => t.id !== id)
      await api.deleteTodo(id)
    }
  }

  return new TodoCrudActionHandlers()
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

Pass a selector to pick only what you need. Selectors are compared with deep equality before React emits updates, so derived objects are safe.

```tsx
const { count, todos, actions } = useTodo(s => ({
  count: s.count,
  todos: s.todos,
  actions: s.actions,
}))
```

## Inject Other Domain State

`inject()` lets one domain read/write another domain model in a controlled way.

```ts
// state/order/actions/create.ts
import { action, silent } from 'muchajs'
import { orderModel } from '../model'
import { userModel } from '@/state/user/model'

export const orderActions = action(({ inject }) => {
  class OrderActionHandlers {
    private order = inject(orderModel)
    private user = inject(userModel)

    async create(input: { productId: string }) {
      if (!this.user.auth) return
      const created = await api.createOrder(input)
      this.order.items.push(created)
    }

    resetToServer(data: Order[]) {
      silent(() => {
        this.order.items = data
      })
    }
  }

  return new OrderActionHandlers()
})
```

## Interceptors (Decorators)

```ts
import { action, OnError, OnSuccess, Debounce, Transaction } from 'muchajs'

export const todoActions = action(({ inject }) => {
  class TodoActions {
    private model = inject(todoModel)

    @Debounce(300)
    @OnError((error) => {
      sonner.error(error.message ?? 'An unexpected error occurred')
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

## SSR / Hydration

Use `silent()` to initialize state from server data without triggering client re-renders.

```ts
import { action, silent } from 'muchajs'

export const todoInitActions = action(({ inject }) => {
  class TodoInitActions {
    private model = inject(todoModel)

    bootstrap(serverTodos: Todo[]) {
      silent(() => {
        this.model.todos = serverTodos
      })
    }
  }

  return new TodoInitActions()
})
```

You can call this init action directly when hydrating from server props (instead of wrapping it in `useEffect`) and guard it to run only once.

```tsx
import { useRef } from 'react'

export function TodoPage({ initialTodos }: { initialTodos: Todo[] }) {
  const { actions } = useTodo(s => ({ actions: s.actions }))
  const initedRef = useRef(false)

  if (!initedRef.current) {
    initedRef.current = true
    actions.init(initialTodos)
  }
}
```

This pattern is used in the playground `TodoPage` init flow.

## Data Fetching with Resource

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

```ts
// state/todo/actions/crud.ts
import { action } from 'muchajs'
import { todoModel } from './model'

export const todoActions = action(({ inject }) => {
  class TodoResourceActions {
    private state = inject(todoModel)

    async reload() {
      await this.state.todos.load()
    }

    async nextPage() {
      await this.state.todos.load({ page: this.state.todos.page + 1 })
    }
  }

  return new TodoResourceActions()
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

`Resource` states use one `is*` shape across modes.
- `isLoading`, `isFetching`, `isSuccess`, `isError`, `error`

Mode fields:
- `Single`: `data`
- `Page`: `data`, `page`, `totalPage`, `totalCount`
- `Infinite`: `data`, `cursor`, `hasMore`
