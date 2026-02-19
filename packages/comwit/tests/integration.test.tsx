// @vitest-environment happy-dom
import { describe, test, expect, vi } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { model, action, useModel, useAction, ComwitProvider, query } from '../src'

function createWrapper(providerProps: Record<string, any> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ComwitProvider {...providerProps}>{children}</ComwitProvider>
  }
}

describe('React integration', () => {
  test('useModel returns initial state snapshot', () => {
    const counter = model({ count: 0, name: 'test' })
    const wrapper = createWrapper()

    const { result } = renderHook(() => useModel(counter), { wrapper })

    expect(result.current.count).toBe(0)
    expect(result.current.name).toBe('test')
  })

  test('useModel re-renders on proxy mutation via action', async () => {
    const counter = model({ count: 0 })
    const increment = action(({ state }) => ({
      increment() {
        state(counter).count += 1
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        state: useModel(counter),
        actions: useAction<{ increment: () => void }>([increment]),
      }),
      { wrapper }
    )

    expect(result.current.state.count).toBe(0)

    await act(async () => {
      result.current.actions.increment()
    })

    expect(result.current.state.count).toBe(1)
  })

  test('useModel with selector returns selected value', () => {
    const user = model({ name: 'Alice', age: 30 })
    const wrapper = createWrapper()

    const { result } = renderHook(() => useModel(user, (s) => s.name), { wrapper })

    expect(result.current).toBe('Alice')
  })

  test('useModel selector prevents unnecessary re-renders (referential equality)', async () => {
    const counter = model({ count: 0, unrelated: 'a' })
    const actions = action(({ state }) => ({
      changeUnrelated() {
        state(counter).unrelated = 'b'
      },
    }))

    const wrapper = createWrapper()
    let renderCount = 0

    const { result } = renderHook(
      () => {
        renderCount++
        return {
          count: useModel(counter, (s) => s.count),
          actions: useAction<{ changeUnrelated: () => void }>([actions]),
        }
      },
      { wrapper }
    )

    const initialRenderCount = renderCount
    expect(result.current.count).toBe(0)

    await act(async () => {
      result.current.actions.changeUnrelated()
    })

    // count didn't change, so selector should return same value and not re-render
    expect(result.current.count).toBe(0)
    expect(renderCount).toBe(initialRenderCount)
  })

  test('useAction binds action methods and they can mutate model state', async () => {
    const todo = model({ items: [] as string[] })
    const todoActions = action(({ state }) => ({
      add(item: string) {
        state(todo).items.push(item)
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        state: useModel(todo),
        actions: useAction<{ add: (item: string) => void }>([todoActions]),
      }),
      { wrapper }
    )

    await act(async () => {
      result.current.actions.add('buy milk')
    })

    await act(async () => {
      result.current.actions.add('walk dog')
    })

    expect(result.current.state.items).toEqual(['buy milk', 'walk dog'])
  })

  test('multiple models are independent in provider', async () => {
    const modelA = model({ value: 'a' })
    const modelB = model({ value: 'b' })
    const actionsA = action(({ state }) => ({
      set(v: string) {
        state(modelA).value = v
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        stateA: useModel(modelA),
        stateB: useModel(modelB),
        actions: useAction<{ set: (v: string) => void }>([actionsA]),
      }),
      { wrapper }
    )

    await act(async () => {
      result.current.actions.set('changed')
    })

    expect(result.current.stateA.value).toBe('changed')
    expect(result.current.stateB.value).toBe('b')
  })

  test('ComwitProvider with context passes context to actions', async () => {
    const dummy = model({ result: '' })
    const ctxAction = action<{ greet: () => void }, { greeting: string }>(({ state, context }) => ({
      greet() {
        state(dummy).result = context.greeting
      },
    }))

    const wrapper = createWrapper({ context: { greeting: 'hello world' } })
    const { result } = renderHook(
      () => ({
        state: useModel(dummy),
        actions: useAction<{ greet: () => void }>([ctxAction]),
      }),
      { wrapper }
    )

    await act(async () => {
      result.current.actions.greet()
    })

    expect(result.current.state.result).toBe('hello world')
  })

  test('action with async operations updates model state correctly', async () => {
    const data = model({ loading: false, value: '' })
    const asyncAction = action(({ state }) => ({
      async fetchData() {
        state(data).loading = true
        await Promise.resolve()
        state(data).value = 'fetched'
        state(data).loading = false
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        state: useModel(data),
        actions: useAction<{ fetchData: () => Promise<void> }>([asyncAction]),
      }),
      { wrapper }
    )

    await act(async () => {
      await result.current.actions.fetchData()
    })

    expect(result.current.state.loading).toBe(false)
    expect(result.current.state.value).toBe('fetched')
  })

  test('query integration: model with query(), state transitions isLoading -> isSuccess', async () => {
    const userModel = model({
      users: query<string[]>({
        initialData: [],
        queryFn: async () => ['alice', 'bob'],
      }),
    })

    const userActions = action(({ state }) => ({
      async loadUsers() {
        await state(userModel).users.query()
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        state: useModel(userModel),
        actions: useAction<{ loadUsers: () => Promise<void> }>([userActions]),
      }),
      { wrapper }
    )

    // Initial state
    expect(result.current.state.users.data).toEqual([])
    expect(result.current.state.users.isSuccess).toBe(false)

    await act(async () => {
      await result.current.actions.loadUsers()
    })

    // After query
    expect(result.current.state.users.data).toEqual(['alice', 'bob'])
    expect(result.current.state.users.isSuccess).toBe(true)
    expect(result.current.state.users.isLoading).toBe(false)
  })

  test('full pipeline: model + action + useModel + useAction together', async () => {
    const counterModel = model({ count: 0 })

    const counterActions = action(({ state }) => ({
      increment() {
        state(counterModel).count += 1
      },
      decrement() {
        state(counterModel).count -= 1
      },
      reset() {
        state(counterModel).count = 0
      },
    }))

    const wrapper = createWrapper()

    const { result } = renderHook(
      () => ({
        state: useModel(counterModel),
        actions: useAction<{
          increment: () => void
          decrement: () => void
          reset: () => void
        }>([counterActions]),
      }),
      { wrapper }
    )

    expect(result.current.state.count).toBe(0)

    await act(async () => {
      result.current.actions.increment()
      result.current.actions.increment()
      result.current.actions.increment()
    })

    expect(result.current.state.count).toBe(3)

    await act(async () => {
      result.current.actions.decrement()
    })

    expect(result.current.state.count).toBe(2)

    await act(async () => {
      result.current.actions.reset()
    })

    expect(result.current.state.count).toBe(0)
  })
})
