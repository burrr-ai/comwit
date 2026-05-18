// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import React from 'react'
import { act, renderHook } from '@testing-library/react'
import { action, ComwitProvider, create, model, useAction, useModel } from '../src'

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ComwitProvider>{children}</ComwitProvider>
  }
}

describe('history', () => {
  test('is disabled by default', () => {
    const counter = model({ count: 0 })
    const store = counter.instance()

    expect('$history' in store.getSnapshot()).toBe(false)
  })

  test('exposes $history when enabled', () => {
    const counter = model({ count: 0 }, { history: true })
    const store = counter.instance()
    const snap = store.getSnapshot()

    expect(snap.$history.canUndo).toBe(false)
    expect(snap.$history.canRedo).toBe(false)
    expect(typeof snap.$history.undo).toBe('function')
    expect(typeof snap.$history.redo).toBe('function')
  })

  test('records one action method as one undo step', async () => {
    const counter = model({ count: 0, label: 'idle' }, { history: true })
    const counterActions = action(({ state }) => ({
      update() {
        const s = state(counter)
        s.count += 1
        s.label = 'updated'
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        state: useModel(counter),
        actions: useAction<{ update: () => void }>([counterActions]),
      }),
      { wrapper }
    )

    await act(async () => {
      result.current.actions.update()
    })

    expect(result.current.state.count).toBe(1)
    expect(result.current.state.label).toBe('updated')
    expect(result.current.state.$history.canUndo).toBe(true)
    expect(result.current.state.$history.canRedo).toBe(false)

    await act(async () => {
      result.current.state.$history.undo()
    })

    expect(result.current.state.count).toBe(0)
    expect(result.current.state.label).toBe('idle')
    expect(result.current.state.$history.canUndo).toBe(false)
    expect(result.current.state.$history.canRedo).toBe(true)

    await act(async () => {
      result.current.state.$history.redo()
    })

    expect(result.current.state.count).toBe(1)
    expect(result.current.state.label).toBe('updated')
    expect(result.current.state.$history.canUndo).toBe(true)
    expect(result.current.state.$history.canRedo).toBe(false)
  })

  test('restores array pushes without leaving sparse items', async () => {
    const todo = model({ items: [] as string[] }, { history: true })
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

    expect(result.current.state.items).toEqual(['buy milk'])

    await act(async () => {
      result.current.state.$history.undo()
    })

    expect(result.current.state.items).toEqual([])
    expect(result.current.state.items.length).toBe(0)

    await act(async () => {
      result.current.state.$history.redo()
    })

    expect(result.current.state.items).toEqual(['buy milk'])
  })

  test('clears redo stack when a new action is committed after undo', async () => {
    const counter = model({ count: 0 }, { history: true })
    const counterActions = action(({ state }) => ({
      add(value: number) {
        state(counter).count += value
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        state: useModel(counter),
        actions: useAction<{ add: (value: number) => void }>([counterActions]),
      }),
      { wrapper }
    )

    await act(async () => result.current.actions.add(1))
    await act(async () => result.current.actions.add(1))
    expect(result.current.state.count).toBe(2)

    await act(async () => result.current.state.$history.undo())
    expect(result.current.state.count).toBe(1)
    expect(result.current.state.$history.canRedo).toBe(true)

    await act(async () => result.current.actions.add(10))
    expect(result.current.state.count).toBe(11)
    expect(result.current.state.$history.canRedo).toBe(false)
  })

  test('uses a default limit of 100 undo entries', async () => {
    const counter = model({ count: 0 }, { history: true })
    const counterActions = action(({ state }) => ({
      increment() {
        state(counter).count += 1
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        state: useModel(counter),
        actions: useAction<{ increment: () => void }>([counterActions]),
      }),
      { wrapper }
    )

    await act(async () => {
      for (let i = 0; i < 101; i++) {
        result.current.actions.increment()
      }
    })

    expect(result.current.state.count).toBe(101)

    await act(async () => {
      result.current.state.$history.undo(100)
    })

    expect(result.current.state.count).toBe(1)
    expect(result.current.state.$history.canUndo).toBe(false)
  })

  test('buckets one action transaction by each changed model', async () => {
    const profile = model({ name: 'Ada' }, { history: true })
    const settings = model({ theme: 'light' }, { history: true })
    const actions = action(({ state }) => ({
      updateBoth() {
        state(profile).name = 'Grace'
        state(settings).theme = 'dark'
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        profile: useModel(profile),
        settings: useModel(settings),
        actions: useAction<{ updateBoth: () => void }>([actions]),
      }),
      { wrapper }
    )

    await act(async () => {
      result.current.actions.updateBoth()
    })

    expect(result.current.profile.name).toBe('Grace')
    expect(result.current.settings.theme).toBe('dark')
    expect(result.current.profile.$history.canUndo).toBe(true)
    expect(result.current.settings.$history.canUndo).toBe(true)

    await act(async () => {
      result.current.profile.$history.undo()
    })

    expect(result.current.profile.name).toBe('Ada')
    expect(result.current.settings.theme).toBe('dark')

    await act(async () => {
      result.current.settings.$history.undo()
    })

    expect(result.current.settings.theme).toBe('light')
  })

  test('supports ignore without suppressing rendering', async () => {
    const counter = model({ count: 0 }, { history: true })
    const counterActions = action(({ state }) => ({
      setIgnored(value: number) {
        const s = state(counter)
        s.$history.ignore(() => {
          s.count = value
        })
      },
    }))

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => ({
        state: useModel(counter),
        actions: useAction<{ setIgnored: (value: number) => void }>([counterActions]),
      }),
      { wrapper }
    )

    await act(async () => {
      result.current.actions.setIgnored(5)
    })

    expect(result.current.state.count).toBe(5)
    expect(result.current.state.$history.canUndo).toBe(false)
  })

  test('works through create() without adding a new hook', async () => {
    const todo = model({ items: [] as string[] }, { history: true })
    const todoActions = action(({ state }) => ({
      add(item: string) {
        state(todo).items.push(item)
      },
    }))
    const useTodo = create(todo, { actions: [todoActions] })

    const wrapper = createWrapper()
    const { result } = renderHook(
      () =>
        useTodo((s) => ({
          items: s.items,
          actions: s.actions,
          history: s.$history,
        })),
      { wrapper }
    )

    await act(async () => {
      result.current.actions.add('ship history')
    })

    expect(result.current.items).toEqual(['ship history'])
    expect(result.current.history.canUndo).toBe(true)

    await act(async () => {
      result.current.history.undo()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.history.canRedo).toBe(true)
  })
})
