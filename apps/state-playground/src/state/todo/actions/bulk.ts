import { action, OnError, OnSuccess } from '@comwit/state'
import { toast } from 'sonner'
import type { TodoActionOptions, TodoActions, Filter, TodoState } from '../types'
import { todoModel } from '../model'
import { clearCompletedTodos } from '@/api/todo/index'

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'An unknown error occurred while processing the request.'
}

function throwAfterToast(context: string, error: unknown) {
  const message = errorMessage(error)
  toast.error(`${context} failed`, { description: message })
  throw error
}

export const todoBulkActions = action<Pick<TodoActions, 'clearCompleted' | 'setFilter'>>(
  ({ state }) => {
    const model = state<TodoState>(todoModel)

    class TodoBulkActions {
      constructor(private readonly model: TodoState) {}

      @OnSuccess(() => {
        toast.success('Completed items deleted')
      })
      @OnError((error: unknown) => throwAfterToast('Delete completed items', error))
      async clearCompleted(options?: TodoActionOptions) {
        const previous = [...this.model.todos]
        this.model.todos = this.model.todos.filter((t) => t.status !== 'done')

        try {
          const remaining = await clearCompletedTodos({ forceFail: options?.forceFail })
          this.model.todos = remaining
        } catch (error) {
          this.model.todos = previous
          throw error
        }
      }

      setFilter(filter: Partial<Filter>) {
        Object.assign(this.model.filter, filter)
      }
    }

    return new TodoBulkActions(model)
  }
)
