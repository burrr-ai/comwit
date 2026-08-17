// @vitest-environment happy-dom
import React, { type ReactNode } from 'react'
import { IDBFactory } from 'fake-indexeddb'
import { renderHook, waitFor } from '@testing-library/react'
import { ComwitProvider, local, model, useModel } from '../src'
import { bindResourceState, createQueryBindingRegistry } from '../src/core/query'

type Todo = {
  id: string
  title: string
}

describe('local() provider integration', () => {
  test('resolves an inline collection scope from another model lazily', async () => {
    const factory = new IDBFactory()
    const database = `local-provider-model-scope-${crypto.randomUUID()}`
    const identityModel = model({ me: { id: '1' } as { id: string } | null })
    let scopeEvaluations = 0
    const todos = local.collection<Todo>({
      key: 'model-scoped-todos',
      version: 1,
      scope: ({ state }) => {
        scopeEvaluations++
        const id = state(identityModel).me?.id
        return id ? `user:${id}` : null
      },
    })
    const queryFn = vi.fn().mockResolvedValue([{ id: '1', title: 'Scoped' }])
    const todoModel = model({
      list: local.query<Todo[]>({
        source: todos,
        initialData: [],
        staleTime: 60_000,
        queryFn,
      }),
    })

    expect(scopeEvaluations).toBe(0)

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <ComwitProvider defaultOptions={{ local: { database, indexedDB: factory } }}>
          {children}
        </ComwitProvider>
      )
    }

    const first = renderHook(() => useModel(todoModel, (state) => state.list.load()), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(first.result.current.data[0]?.title).toBe('Scoped'))
    first.unmount()

    const second = renderHook(() => useModel(todoModel, (state) => state.list.load()), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(second.result.current.data[0]?.title).toBe('Scoped'))

    expect(scopeEvaluations).toBeGreaterThan(0)
    expect(queryFn).toHaveBeenCalledOnce()
    second.unmount()
  })

  test('uses defaultOptions.local for selector-owned loads across provider instances', async () => {
    const factory = new IDBFactory()
    const database = `local-provider-${crypto.randomUUID()}`
    const todos = local.collection<Todo>({ key: 'todos', version: 1 })
    const queryFn = vi.fn().mockResolvedValue([{ id: '1', title: 'Durable' }])
    const todoModel = model({
      list: local.query<Todo[], { status: string }>({
        source: todos,
        initialData: [],
        staleTime: 60_000,
        queryFn,
      }),
    })

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <ComwitProvider
          defaultOptions={{
            local: {
              database,
              scope: 'user:1',
              indexedDB: factory,
            },
          }}
        >
          {children}
        </ComwitProvider>
      )
    }

    const first = renderHook(
      () => useModel(todoModel, (state) => state.list.load({ status: 'open' })),
      { wrapper: Wrapper }
    )
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()

    const second = renderHook(
      () => useModel(todoModel, (state) => state.list.load({ status: 'open' })),
      { wrapper: Wrapper }
    )
    await waitFor(() => expect(second.result.current.data[0]?.title).toBe('Durable'))

    expect(queryFn).toHaveBeenCalledOnce()
    second.unmount()
  })

  test('lets a server Suspense fallback restore only IndexedDB detail data', async () => {
    const factory = new IDBFactory()
    const database = `local-provider-detail-${crypto.randomUUID()}`
    const todos = local.collection<Todo>({ key: 'todos', version: 1 })
    const todoModel = model({
      detail: local<Todo | null, string>({
        source: todos,
        initialData: null,
      }),
    })

    const seedStore = todoModel.instance()
    const seed = bindResourceState(
      seedStore.proxy,
      todoModel.pluginBags.get('query')!,
      undefined,
      createQueryBindingRegistry({
        local: { database, scope: 'user:1', indexedDB: factory },
      }),
      todoModel.key
    ) as any
    seed.detail.set({ id: '1', title: 'Cached SEO detail' }, { arg: '1' })
    await new Promise((resolve) => setTimeout(resolve, 0))

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <ComwitProvider
          defaultOptions={{
            local: { database, scope: 'user:1', indexedDB: factory },
          }}
        >
          {children}
        </ComwitProvider>
      )
    }

    const cached = renderHook(() => useModel(todoModel, (state) => state.detail.restore('1')), {
      wrapper: Wrapper,
    })
    expect(cached.result.current.data).toBeNull()
    await waitFor(() => expect(cached.result.current.data?.title).toBe('Cached SEO detail'))
    cached.unmount()

    const miss = renderHook(() => useModel(todoModel, (state) => state.detail.restore('missing')), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(miss.result.current.isLoading).toBe(false))
    expect(miss.result.current.data).toBeNull()
    miss.unmount()
  })
})
