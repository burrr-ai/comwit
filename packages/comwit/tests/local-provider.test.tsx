// @vitest-environment happy-dom
import React, { type ReactNode } from 'react'
import { IDBFactory } from 'fake-indexeddb'
import { renderHook, waitFor } from '@testing-library/react'
import { ComwitProvider, local, model, query, useModel } from '../src'

type Todo = {
  id: string
  title: string
}

describe('local() provider integration', () => {
  test('uses defaultOptions.local for selector-owned loads across provider instances', async () => {
    const factory = new IDBFactory()
    const database = `local-provider-${crypto.randomUUID()}`
    const todos = local.collection<Todo>({ key: 'todos', version: 1 })
    const queryFn = vi.fn().mockResolvedValue([{ id: '1', title: 'Durable' }])
    const todoModel = model({
      list: local(
        query<Todo[], { status: string }>({
          initialData: [],
          staleTime: 60_000,
          queryFn,
        }),
        { source: todos }
      ),
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
})
