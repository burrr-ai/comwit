import { action, OnError, OnSuccess, Transaction } from 'muchajs'
import { toast } from 'sonner'
import type { TodoActionOptions, TodoActions } from '../types'
import { todoModel } from '../model'
import { clearCompletedTodos } from '@/api/todo'

export const todoBulkActions = action<Pick<TodoActions, 'clearCompleted' | 'setFilter'>>(({ inject }) => {
    const model = inject(todoModel)
    const onServerError = (context: string) => (error: unknown) => {
        const message = error instanceof Error ? error.message : '요청 처리 중 알 수 없는 오류가 발생했습니다.'
        toast.error(`${context} 실패`, { description: message })
        throw error
    }

    return new class {
        @Transaction()
        @OnError(onServerError('완료 항목 삭제'))
        @OnSuccess(() => {
            toast.success('완료 항목 삭제 완료')
        })
        async clearCompleted(options?: TodoActionOptions) {
            const remaining = await clearCompletedTodos({ forceFail: options?.forceFail })
            model.todos = remaining
        }

        setFilter(filter) {
            Object.assign(model.filter, filter)
        }
    }
})
