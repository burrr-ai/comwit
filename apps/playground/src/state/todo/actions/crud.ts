import { action, OnError, OnSuccess, Transaction } from 'mucha'
import { toast } from 'sonner'
import type { Todo, TodoActionOptions, TodoActions } from '../types'
import { todoModel } from '../model'
import { createTodo, deleteTodo, updateTodo } from '@/api/todo'

export const todoCrudActions = action<Pick<TodoActions, 'create' | 'delete' | 'updateStatus' | 'updatePriority'>>(({ inject }) => {
    const model = inject(todoModel)

    const onServerError = (context: string) => {
        return (error: unknown) => {
            const message = error instanceof Error ? error.message : '요청 처리 중 알 수 없는 오류가 발생했습니다.'
            toast.error(`${context} 실패`, { description: message })
            throw error
        }
    }

    return new class {
        @OnError(onServerError('할 일 생성'))
        @OnSuccess((result: Todo) => {
            toast.success('할 일 생성 완료', { description: result.title })
        })
        async create(title: string, priority: Todo['priority'], options?: TodoActionOptions) {
            const created = await createTodo({ title, priority, forceFail: options?.forceFail })
            model.todos.push(created)
            return created
        }

        @Transaction()
        @OnError(onServerError('상태 변경'))
        @OnSuccess((result: Todo) => {
            toast.success('상태 변경 완료', { description: `${result.title} (${result.status})` })
        })
        async updateStatus(id: string, status: Todo['status'], options?: TodoActionOptions) {
            const updated = await updateTodo(id, { status, forceFail: options?.forceFail })
            const index = model.todos.findIndex(t => t.id === id)
            if (index !== -1) model.todos[index] = updated
            return updated
        }

        @Transaction()
        @OnError(onServerError('우선순위 변경'))
        @OnSuccess((result: Todo) => {
            toast.success('우선순위 변경 완료', { description: `${result.title} (${result.priority})` })
        })
        async updatePriority(id: string, priority: Todo['priority'], options?: TodoActionOptions) {
            const updated = await updateTodo(id, { priority, forceFail: options?.forceFail })
            const index = model.todos.findIndex(t => t.id === id)
            if (index !== -1) model.todos[index] = updated
            return updated
        }

        @Transaction()
        @OnError(onServerError('할 일 삭제'))
        @OnSuccess(() => {
            toast.success('삭제 완료')
        })
        async delete(id: string, options?: TodoActionOptions) {
            await deleteTodo(id, { forceFail: options?.forceFail })
            model.todos = model.todos.filter(t => t.id !== id)
        }
    }
})
