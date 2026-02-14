export type Inject = <T extends object>(model: Model<T>) => T

export type ActionFactory<A> = (inject: Inject) => A

export function action<A>(factory: ActionFactory<A>): ActionFactory<A> {
    return factory
}

type Model<T> = import('./model').Model<T>
