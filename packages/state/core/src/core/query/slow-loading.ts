import type { ResourceDataLike } from './types'

// Browsers clamp larger timeouts to ~1ms. Reject them rather than report a
// slow request immediately for a threshold we cannot schedule faithfully.
export function validateSlowLoadingMs(value: number | undefined): void {
  if (value === undefined) return
  if (!Number.isFinite(value) || value < 0 || value > 2_147_483_647) {
    throw new RangeError('slowLoadingMs must be a finite number between 0 and 2147483647')
  }
}

export type SlowLoadingClock = ReturnType<typeof createSlowLoadingClock>

/** One clock per bound query, never per consumer or persisted cache entry. */
export function createSlowLoadingClock(state: ResourceDataLike, delay: number, observed = true) {
  let startedAt: number | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0

  const clear = () => {
    generation++
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  const reset = () => {
    clear()
    startedAt = undefined
    state.isSlowLoading = false
  }

  const sync = () => {
    if (!state.isLoading || state.isSuccess || state.isError) {
      reset()
      return
    }
    // SSR and render-staged Suspense must not start browser loading clocks.
    if (typeof window === 'undefined') return
    const now = performance.now()
    startedAt ??= now
    const remaining = delay - (now - startedAt)
    if (remaining <= 0) {
      clear()
      state.isSlowLoading = true
    } else if (observed && timer === undefined) {
      const current = generation
      timer = setTimeout(
        () => {
          if (generation !== current) return
          timer = undefined
          sync()
        },
        Math.max(1, remaining)
      )
    }
  }

  return {
    sync,
    reset,
    pause() {
      observed = false
      clear()
    },
    resume() {
      observed = true
      // Retain elapsed time if the same initial load survived an unmount.
      sync()
    },
  }
}
