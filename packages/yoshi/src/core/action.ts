export type State = <T>(model: Model<T>) => T

export type ActionFactory<A> = (state: State) => A

export function action<A>(factory: ActionFactory<A>): ActionFactory<A> {
    return factory
}

type Model<T> = import('./model').Model<T>
