export function model<T>(initial: T): Model<T> {
    return {
        key: Symbol(),
        instance() {
            return structuredClone(initial)
        }
    }
}

export type Model<T> = {
    key: symbol
    instance(): T
}
