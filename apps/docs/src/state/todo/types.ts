export type Todo = {
    id: string
    title: string
    status: 'pending' | 'done'
}

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
