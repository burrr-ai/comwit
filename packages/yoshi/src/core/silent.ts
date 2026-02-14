/**
 * Suppress state change notifications within the callback scope.
 * Use this for SSR initialization or hydration where mutations
 * should not trigger re-renders.
 *
 * @example
 * ```ts
 * import { silent } from '@meursyphus/yoshi'
 *
 * silent(() => {
 *   model.todos = serverData.todos
 * })
 * ```
 */
let _silent = false

export function silent(fn: () => void) {
    _silent = true
    try {
        fn()
    } finally {
        _silent = false
    }
}

export function isSilent() {
    return _silent
}
