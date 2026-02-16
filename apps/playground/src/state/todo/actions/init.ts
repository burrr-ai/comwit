import { action, silent } from 'muchajs'
import type { Todo, TodoActions, TodoState } from '../types'
import { todoModel } from '../model'

export const todoInitActions = action<Pick<TodoActions, 'init'>>(({ state }) => {
  const model = state<TodoState>(todoModel)

  class TodoInitActions {
    constructor(private readonly model: TodoState) {}

    init(todos: Todo[]) {
      silent(() => {
        const seen = new Set<string>()
        this.model.todos = todos.filter((todo) => {
          if (seen.has(todo.id)) {
            return false
          }
          seen.add(todo.id)
          return true
        })
      })
    }
  }

  return new TodoInitActions(model)
})
