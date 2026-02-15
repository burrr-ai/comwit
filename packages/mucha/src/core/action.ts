import type { BoundResourceState } from './query'

export type Inject = <T extends object>(model: Model<T>) => BoundResourceState<T>

export type ActionContext = {
    inject: Inject
}

export type ActionFactory<A> = (ctx: ActionContext) => A

export function action<A>(factory: ActionFactory<A>): ActionFactory<A> {
    return factory
}

type Model<T extends object> = import('./model').Model<T>
