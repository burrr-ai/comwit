/**
 * @description
 * 
 * @example
 * ```typescript
 * 
 * const todoModel = model({
 *   title: '',
 *   completed: false,
 * });
 * ```
 */
export function model<T>(obj: T): Model<T> {
    return {
        key: Symbol(),
        instance() {
            return obj
        }
    }
}


export type Model<T> = {
    key: Symbol
    instance(): T
}

