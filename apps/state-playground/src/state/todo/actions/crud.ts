import { action, OnError, OnSuccess } from '@comwit/state'
import { toast } from 'sonner'
import type { Todo, TodoActionOptions, TodoActions, TodoState } from '../types'
import { todoModel } from '../model'
import { createTodo, deleteTodo, updateTodo } from '@/api/todo/index'

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'An unknown error occurred while processing the request.'
}

function handleError(context: string, error: unknown) {
  const message = errorMessage(error)
  toast.error(`${context} failed`, { description: message })
  throw error
}

function nextOptimisticId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export const todoCrudActions = action<
  Pick<TodoActions, 'create' | 'delete' | 'updateStatus' | 'updatePriority'>
>(({ state }) => {
  const model = state<TodoState>(todoModel)

  class TodoCrudActions {
    constructor(private readonly model: TodoState) {}

    @OnSuccess((created: Todo) => {
      toast.success('Task created', { description: created.title })
    })
    @OnError((error: unknown) => handleError('Create task', error))
    async create(title: string, priority: Todo['priority'], options?: TodoActionOptions) {
      const optimistic: Todo = {
        id: nextOptimisticId(),
        title: title.trim(),
        status: 'pending',
        priority,
        createdAt: Date.now(),
      }

      this.model.todos = [optimistic, ...this.model.todos]

      try {
        const created = await createTodo({ title, priority, forceFail: options?.forceFail })
        const index = this.model.todos.findIndex((todo) => todo.id === optimistic.id)
        if (index !== -1) {
          this.model.todos[index] = created
        } else {
          this.model.todos = [created, ...this.model.todos]
        }
        return created
      } catch (error) {
        this.model.todos = this.model.todos.filter((todo) => todo.id !== optimistic.id)
        throw error
      }
    }

    @OnSuccess((updated: Todo) => {
      toast.success('Status updated', { description: `${updated.title} (${updated.status})` })
    })
    @OnError((error: unknown) => handleError('Update status', error))
    async updateStatus(id: string, status: Todo['status'], options?: TodoActionOptions) {
      if (!id) {
        throw new Error('Todo id is required')
      }

      const index = this.model.todos.findIndex((t) => t.id === id)
      const missing = index === -1

      let previous = missing ? undefined : this.model.todos[index]
      if (index === -1) {
        previous = undefined
        this.model.todos = [
          {
            id,
            title: `Todo ${id}`,
            status: 'pending',
            priority: 'low',
            createdAt: Date.now(),
          },
          ...this.model.todos,
        ]
      } else {
        this.model.todos[index] = { ...this.model.todos[index], status }
      }

      const fallbackIndex = this.model.todos.findIndex((t) => t.id === id)

      try {
        const updated = await updateTodo(id, { status, forceFail: options?.forceFail })
        const nextIndex = this.model.todos.findIndex((t) => t.id === id)
        if (nextIndex !== -1) {
          this.model.todos[nextIndex] = updated
        } else {
          this.model.todos = [updated, ...this.model.todos]
        }
        return updated
      } catch (error) {
        if (missing) {
          this.model.todos = this.model.todos.filter((todo) => todo.id !== id)
        } else if (fallbackIndex !== -1 && previous) {
          this.model.todos[fallbackIndex] = previous
        }
        throw error
      }
    }

    @OnSuccess((updated: Todo) => {
      toast.success('Priority updated', { description: `${updated.title} (${updated.priority})` })
    })
    @OnError((error: unknown) => handleError('Update priority', error))
    async updatePriority(id: string, priority: Todo['priority'], options?: TodoActionOptions) {
      if (!id) {
        throw new Error('Todo id is required')
      }

      const index = this.model.todos.findIndex((t) => t.id === id)
      const missing = index === -1

      const previous = missing ? undefined : this.model.todos[index]
      if (index === -1) {
        this.model.todos = [
          {
            id,
            title: `Todo ${id}`,
            status: 'pending',
            priority: 'low',
            createdAt: Date.now(),
          },
          ...this.model.todos,
        ]
      } else {
        this.model.todos[index] = { ...this.model.todos[index], priority }
      }

      const fallbackIndex = this.model.todos.findIndex((t) => t.id === id)

      try {
        const updated = await updateTodo(id, { priority, forceFail: options?.forceFail })
        const nextIndex = this.model.todos.findIndex((t) => t.id === id)
        if (nextIndex !== -1) {
          this.model.todos[nextIndex] = updated
        } else {
          this.model.todos = [updated, ...this.model.todos]
        }
        return updated
      } catch (error) {
        if (missing) {
          this.model.todos = this.model.todos.filter((todo) => todo.id !== id)
        } else if (fallbackIndex !== -1 && previous) {
          this.model.todos[fallbackIndex] = previous
        }
        throw error
      }
    }

    @OnSuccess(() => {
      toast.success('Deleted')
    })
    @OnError((error: unknown) => handleError('Delete task', error))
    async delete(id: string, options?: TodoActionOptions) {
      if (!id) {
        throw new Error('Todo id is required')
      }

      const previous = [...this.model.todos]
      this.model.todos = this.model.todos.filter((t) => t.id !== id)

      try {
        await deleteTodo(id, { forceFail: options?.forceFail })
      } catch (error) {
        this.model.todos = previous
        throw error
      }
    }
  }

  return new TodoCrudActions(model)
})
