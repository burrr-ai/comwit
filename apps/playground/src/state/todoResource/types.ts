import { Resource } from 'muchajs'

export type DemoTodo = {
    id: string
    title: string
    done: boolean
}

export type TodoResourceState = {
    todos: Resource.Page<DemoTodo[]>
}

export type TodoResourceActions = {
    loadFirst(): Promise<void>
    loadNext(): Promise<void>
    seed(): void
}
