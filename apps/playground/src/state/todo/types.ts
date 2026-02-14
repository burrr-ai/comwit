export type Todo = {
    id: string
    title: string
    status: 'pending' | 'in_progress' | 'done'
    priority: 'low' | 'medium' | 'high'
    createdAt: number
}

export type Filter = {
    status: Todo['status'] | 'all'
    priority: Todo['priority'] | 'all'
    search: string
}

export type TodoState = {
    todos: Todo[]
    filter: Filter
    errorMessage: string
}

export type TodoActions = {
    /** Create a new todo and append it to the list */
    create(title: string, priority: Todo['priority']): void
    /** Update a todo's status */
    updateStatus(id: string, status: Todo['status']): void
    /** Update a todo's priority */
    updatePriority(id: string, priority: Todo['priority']): void
    /** Delete a todo by id */
    delete(id: string): void
    /** Bulk delete all completed todos */
    clearCompleted(): void
    /** Set filter criteria */
    setFilter(filter: Partial<Filter>): void
    /** Initialize todos from server data without triggering re-render */
    init(todos: Todo[]): void
}
