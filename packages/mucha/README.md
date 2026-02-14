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

You can also use an inline class, which opens the door to decorators:

```ts
export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete'>>(({ inject }) => {
  const model = inject(todoModel)

  return new class {
    async create(title: string) {
      const todo = await api.createTodo({ title })
      model.todos.push(todo)
    }
    async delete(id: string) {
      model.todos = model.todos.filter(t => t.id !== id)
      await api.deleteTodo(id)
    }
  }
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

You can wrap only part of your tree with a separate `StateProvider` when you want state to be isolated per subtree (for example in tests, storybook stories, or nested apps).

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

## Interceptors

Interceptors can be used in two styles in `actions`:

1) Decorator style (class-based actions)

```ts
import { action, OnError, OnSuccess, Debounce } from 'muchajs'

export const todoActions = action(({ inject }) => {
  const model = inject(todoModel)
  return new class {
    @Debounce(300)
    @OnError((error) => {
      sonner.error(error.message ?? '요청 처리 중 오류가 발생했습니다')
      throw error
    })
    @OnSuccess((result) => {
      console.log('saved', result)
    })
    async save(payload: { title: string }) {
      model.todos.push(await api.saveTodo(payload))
    }
  }
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
        sonner.error(error.message ?? '요청 처리 중 오류가 발생했습니다')
        throw error
      }),
      onSuccess((result) => console.log('saved', result)),
      debounce(300),
    )(save),
  }
})
```
```
