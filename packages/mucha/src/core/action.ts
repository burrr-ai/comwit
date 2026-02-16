import type { BoundResourceState } from './query'

export type State = <T extends object>(model: Model<T>) => BoundResourceState<T>

export type ActionContext<TContext extends object = Record<string, never>> = {
    state: State
    context: TContext
}

export type ActionFactory<A, TContext extends object = Record<string, never>> = (ctx: ActionContext<TContext>) => A

export function action<A, C extends object = Record<string, never>>(
    factory: ActionFactory<A, C>,
): ActionFactory<A, C> {
    return factory
}

export function createActionContext<TContext extends object>() {
    return {
        action<A>(factory: ActionFactory<A, TContext>): ActionFactory<A, TContext> {
            return factory
        },
    } as const
}

type Model<T extends object> = import('./model').Model<T>
