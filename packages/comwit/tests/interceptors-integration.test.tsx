// @vitest-environment happy-dom
import { describe, test, expect } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { model, action, useAction, ComwitProvider } from '../src'
import { intercept } from '../src/interceptors/utils'

function createWrapper(providerProps: Record<string, any> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ComwitProvider {...providerProps}>{children}</ComwitProvider>
  }
}

describe('lazy intercept integration with full comwit pipeline', () => {
  test('lazy intercept accesses model state via state()', () => {
    const counterModel = model({ isLoading: false })

    const Loading = intercept(({ state }) => ({
      onBefore: () => {
        state(counterModel).isLoading = true
      },
      onSettled: () => {
        state(counterModel).isLoading = false
      },
    }))

    const myAction = action(({ state }) => {
      class Actions {
        @Loading
        doWork() {
          // During execution, isLoading should be true
          expect(state(counterModel).isLoading).toBe(true)
          return 'done'
        }
      }
      return new Actions()
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useAction<{ doWork: () => string }>([myAction]), {
      wrapper,
    })

    let returnValue: string
    act(() => {
      returnValue = result.current.doWork()
    })

    expect(returnValue!).toBe('done')
  })

  test('lazy intercept onSuccess receives result', async () => {
    const capturedResults: any[] = []

    const CaptureResult = intercept(() => ({
      onSuccess: (result: any) => {
        capturedResults.push(result)
      },
    }))

    const myAction = action(() => {
      class Actions {
        @CaptureResult
        async fetchData() {
          return { id: 1, name: 'test' }
        }
      }
      return new Actions()
    })

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => useAction<{ fetchData: () => Promise<{ id: number; name: string }> }>([myAction]),
      { wrapper }
    )

    await act(async () => {
      const data = await result.current.fetchData()
      expect(data).toEqual({ id: 1, name: 'test' })
    })

    expect(capturedResults).toHaveLength(1)
    expect(capturedResults[0]).toEqual({ id: 1, name: 'test' })
  })

  test('lazy intercept onError handles errors', () => {
    const capturedErrors: unknown[] = []

    const CaptureError = intercept(() => ({
      onError: (error: unknown) => {
        capturedErrors.push(error)
      },
    }))

    const myAction = action(() => {
      class Actions {
        @CaptureError
        doFail() {
          throw new Error('something went wrong')
        }
      }
      return new Actions()
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useAction<{ doFail: () => void }>([myAction]), { wrapper })

    act(() => {
      expect(() => result.current.doFail()).toThrow('something went wrong')
    })

    expect(capturedErrors).toHaveLength(1)
    expect(capturedErrors[0]).toEqual(expect.objectContaining({ message: 'something went wrong' }))
  })

  test('lazy intercept with context', () => {
    const receivedContexts: any[] = []

    const ContextCapture = intercept(({ context }) => {
      receivedContexts.push(context)
      return {
        onBefore: () => {},
      }
    })

    const myAction = action(() => {
      class Actions {
        @ContextCapture
        doWork() {
          return 'ok'
        }
      }
      return new Actions()
    })

    const wrapper = createWrapper({ context: { apiUrl: 'https://api.test' } })
    const { result } = renderHook(() => useAction<{ doWork: () => string }>([myAction]), {
      wrapper,
    })

    act(() => {
      result.current.doWork()
    })

    expect(receivedContexts).toHaveLength(1)
    expect(receivedContexts[0]).toEqual({ apiUrl: 'https://api.test' })
  })

  test('multiple lazy interceptors resolve in order', () => {
    const order: string[] = []

    const First = intercept(() => ({
      onBefore: () => {
        order.push('first-before')
      },
      onSuccess: () => {
        order.push('first-success')
      },
    }))

    const Second = intercept(() => ({
      onBefore: () => {
        order.push('second-before')
      },
      onSuccess: () => {
        order.push('second-success')
      },
    }))

    const myAction = action(() => {
      class Actions {
        @First
        @Second
        doWork() {
          order.push('execute')
          return 'done'
        }
      }
      return new Actions()
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useAction<{ doWork: () => string }>([myAction]), {
      wrapper,
    })

    act(() => {
      result.current.doWork()
    })

    // Lazy interceptors are resolved in array order (Second stored first via bottom-up decoration,
    // then First). resolveLazyInterceptors iterates the factories array and wraps each one,
    // so the last-applied decorator (outermost = First) ends up as the outermost wrapper.
    // The outermost wrapper's hooks fire first for onBefore, then inner.
    // For onSuccess, inner fires first (closer to execution), then outer.
    expect(order).toContain('execute')
    expect(order.indexOf('first-before')).toBeLessThan(order.indexOf('execute'))
    expect(order.indexOf('second-before')).toBeLessThan(order.indexOf('execute'))
    expect(order.indexOf('execute')).toBeLessThan(order.indexOf('first-success'))
    expect(order.indexOf('execute')).toBeLessThan(order.indexOf('second-success'))
  })

  test('class-level lazy intercept applies to all methods', () => {
    const calls: string[] = []

    const TrackAll = intercept(() => ({
      onBefore: (...args: any[]) => {
        calls.push(`before`)
      },
      onSuccess: (result: any) => {
        calls.push(`success:${result}`)
      },
    }))

    const myAction = action(() => {
      @TrackAll
      class Actions {
        doA() {
          return 'a'
        }
        doB() {
          return 'b'
        }
      }
      return new Actions()
    })

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => useAction<{ doA: () => string; doB: () => string }>([myAction]),
      { wrapper }
    )

    act(() => {
      result.current.doA()
      result.current.doB()
    })

    expect(calls).toContain('before')
    expect(calls).toContain('success:a')
    expect(calls).toContain('success:b')
    expect(calls.filter((c) => c === 'before')).toHaveLength(2)
  })
})
