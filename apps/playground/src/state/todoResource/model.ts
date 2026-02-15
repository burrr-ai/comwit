import { model, resource } from 'muchajs'
import type { DemoTodo, TodoResourceState } from './types'

const TOTAL: DemoTodo[] = new Array(16).fill(null).map((_, index) => ({
    id: `${index + 1}`,
    title: `Demo todo ${index + 1}`,
    done: false,
}))

export const todoResourceModel = model<TodoResourceState>({
    todos: resource.page<DemoTodo[], { page: number }>({
        initialState: {
            data: [] as DemoTodo[],
            page: 1,
            totalPage: 1,
            totalCount: 0,
            isLoading: false,
            isFetching: false,
            isSuccess: false,
            isError: false,
            error: null,
        },
        load: ({ page }) => {
            const pageSize = 5
            const start = (Math.max(1, page) - 1) * pageSize
            const next = TOTAL.slice(start, start + pageSize)

            return Promise.resolve({
                data: next,
                page,
                totalPage: Math.ceil(TOTAL.length / pageSize),
                totalCount: TOTAL.length,
            })
        },
    }),
})
