# Yoshi

React state management library.
Define domain state as plain objects, optimize re-renders with immer-based immutable snapshots.

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
import { StateProvider } from '@meursyphus/yoshi'

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
import { model } from '@meursyphus/yoshi'
import type { TodoState } from './types'

export const todoModel = model<TodoState>({
  todos: [],
  errorMessage: '',
})
```

### 3. actions/

```ts
// state/todo/actions/crud.ts
import { action } from '@meursyphus/yoshi'
import type { TodoActions } from '../types'
import { todoModel } from '../model'

export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete'>>((state) => {
  const model = state(todoModel)

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
export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete'>>((state) => {
  const model = state(todoModel)

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
import { create } from '@meursyphus/yoshi'
import type { TodoState, TodoActions } from './types'
import { todoModel } from './model'
import { todoCrudActions } from './actions/crud'
import { todoBulkActions } from './actions/bulk'

export const useTodo = create<TodoState, TodoActions>(todoModel, {
  actions: [todoCrudActions, todoBulkActions],
})

export type { TodoState, TodoActions } from './types'
```
