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

describe('global interceptors via ComwitProvider', () => {
  test('global interceptor runs on action method calls', () => {
    const calls: string[] = []

    const GlobalLog = intercept({
      onBefore: () => {
        calls.push('global-before')
      },
      onSuccess: (result: any) => {
        calls.push(`global-success:${result}`)
      },
    })

    const myAction = action(() => ({
      greet() {
        return 'hello'
      },
    }))

    const wrapper = createWrapper({
      defaultOptions: { interceptors: [GlobalLog] },
    })

    const { result } = renderHook(() => useAction<{ greet: () => string }>([myAction]), { wrapper })

    act(() => {
      result.current.greet()
    })

    expect(calls).toEqual(['global-before', 'global-success:hello'])
  })

  test('global interceptor runs before (outermost) method-level interceptors', () => {
    const order: string[] = []

    const GlobalInterceptor = intercept({
      onBefore: () => {
        order.push('global-before')
      },
      onSuccess: () => {
        order.push('global-success')
      },
    })

    const MethodInterceptor = intercept({
      onBefore: () => {
        order.push('method-before')
      },
      onSuccess: () => {
        order.push('method-success')
      },
    })

    const myAction = action(() => {
      class Actions {
        @MethodInterceptor
        doWork() {
          order.push('execute')
          return 'done'
        }
      }
      return new Actions()
    })

    const wrapper = createWrapper({
      defaultOptions: { interceptors: [GlobalInterceptor] },
    })

    const { result } = renderHook(() => useAction<{ doWork: () => string }>([myAction]), {
      wrapper,
    })

    act(() => {
      result.current.doWork()
    })

    // Global is outermost, so global-before fires first, then method-before,
    // then execute, then method-success, then global-success
    expect(order).toEqual([
      'global-before',
      'method-before',
      'execute',
      'method-success',
      'global-success',
    ])
  })

  test('multiple global interceptors compose in order', () => {
    const order: string[] = []

    const First = intercept({
      onBefore: () => {
        order.push('first-before')
      },
      onSuccess: () => {
        order.push('first-success')
      },
    })

    const Second = intercept({
      onBefore: () => {
        order.push('second-before')
      },
      onSuccess: () => {
        order.push('second-success')
      },
    })

    const myAction = action(() => ({
      doWork() {
        order.push('execute')
        return 'done'
      },
    }))

    const wrapper = createWrapper({
      defaultOptions: { interceptors: [First, Second] },
    })

    const { result } = renderHook(() => useAction<{ doWork: () => string }>([myAction]), {
      wrapper,
    })

    act(() => {
      result.current.doWork()
    })

    // First is applied first (innermost), Second is applied second (outermost)
    // So Second's onBefore fires first, then First's onBefore, then execute,
    // then First's onSuccess, then Second's onSuccess
    expect(order).toEqual([
      'second-before',
      'first-before',
      'execute',
      'first-success',
      'second-success',
    ])
  })

  test('works with async action methods', async () => {
    const calls: string[] = []

    const GlobalLog = intercept({
      onBefore: () => {
        calls.push('global-before')
      },
      onSuccess: (result: any) => {
        calls.push(`global-success:${result}`)
      },
    })

    const myAction = action(() => ({
      async fetchData() {
        calls.push('execute')
        return 'data'
      },
    }))

    const wrapper = createWrapper({
      defaultOptions: { interceptors: [GlobalLog] },
    })

    const { result } = renderHook(
      () => useAction<{ fetchData: () => Promise<string> }>([myAction]),
      { wrapper }
    )

    await act(async () => {
      const data = await result.current.fetchData()
      expect(data).toBe('data')
    })

    expect(calls).toEqual(['global-before', 'execute', 'global-success:data'])
  })

  test('works alongside class-level decorators', () => {
    const order: string[] = []

    const GlobalInterceptor = intercept({
      onBefore: () => {
        order.push('global-before')
      },
      onSuccess: () => {
        order.push('global-success')
      },
    })

    const ClassDecorator = intercept(() => ({
      onBefore: () => {
        order.push('class-before')
      },
      onSuccess: () => {
        order.push('class-success')
      },
    }))

    const myAction = action(() => {
      @ClassDecorator
      class Actions {
        doWork() {
          order.push('execute')
          return 'done'
        }
      }
      return new Actions()
    })

    const wrapper = createWrapper({
      defaultOptions: { interceptors: [GlobalInterceptor] },
    })

    const { result } = renderHook(() => useAction<{ doWork: () => string }>([myAction]), {
      wrapper,
    })

    act(() => {
      result.current.doWork()
    })

    // Global interceptor is outermost, class decorator is inner
    expect(order.indexOf('global-before')).toBeLessThan(order.indexOf('class-before'))
    expect(order.indexOf('class-before')).toBeLessThan(order.indexOf('execute'))
    expect(order.indexOf('execute')).toBeLessThan(order.indexOf('class-success'))
    expect(order.indexOf('class-success')).toBeLessThan(order.indexOf('global-success'))
  })
})
