// @vitest-environment happy-dom
import React, { type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import { ComwitProvider, create, model, query, useModel } from '../src'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function Wrapper({ children }: { children: ReactNode }) {
  return <ComwitProvider>{children}</ComwitProvider>
}

describe('query selector load', () => {
  test('loads an argument query from the selector and returns its query state', async () => {
    const request = deferred<string[]>()
    const queryFn = vi.fn((_arg: { category: string }) => request.promise)
    const products = model({
      list: query<string[], { category: string }>({
        initialData: [],
        queryFn,
      }),
    })

    const { result } = renderHook(
      () => useModel(products, (state) => state.list.load({ category: 'books' })),
      { wrapper: Wrapper }
    )

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn).toHaveBeenCalledWith({ category: 'books' }, expect.any(Object))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isFetching).toBe(true)

    await act(async () => {
      request.resolve(['The Left Hand of Darkness'])
      await request.promise
    })

    expect(result.current.data).toEqual(['The Left Hand of Darkness'])
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
  })

  test('supports an explicit load for a query without arguments', async () => {
    const queryFn = vi.fn().mockResolvedValue(42)
    const dashboard = model({
      total: query<number>({ initialData: 0, queryFn }),
    })

    const { result } = renderHook(() => useModel(dashboard, (state) => state.total.load()), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryFn).toHaveBeenCalledOnce()
    expect(result.current.data).toBe(42)
  })

  test('loads from a frozen snapshot produced by model extensions', async () => {
    const queryFn = vi.fn().mockResolvedValue(['book'])
    const products = model(
      {
        list: query<string[]>({ initialData: [], queryFn }),
      },
      {
        derive: (state) => ({
          count: () => state.list.data.length,
        }),
      }
    )

    const { result } = renderHook(() => useModel(products, (state) => state.list.load()), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryFn).toHaveBeenCalledOnce()
    expect(result.current.data).toEqual(['book'])
  })

  test('treats an option-shaped object as the declared query argument', async () => {
    const queryFn = vi.fn(({ force }: { force: boolean }) => Promise.resolve(String(force)))
    const search = model({
      result: query<string, { force: boolean }>({ initialData: '', queryFn }),
    })

    const { result } = renderHook(
      () => useModel(search, (state) => state.result.load({ force: true })),
      { wrapper: Wrapper }
    )

    await waitFor(() => expect(result.current.data).toBe('true'))
    expect(queryFn).toHaveBeenCalledWith({ force: true }, expect.any(Object))
  })

  test('does not load a query that is only selected as passive state', async () => {
    const queryFn = vi.fn().mockResolvedValue(['unexpected'])
    const products = model({
      list: query<string[]>({ initialData: [], queryFn }),
    })

    const { result } = renderHook(() => useModel(products, (state) => state.list), {
      wrapper: Wrapper,
    })

    await act(async () => Promise.resolve())
    expect(queryFn).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  test('declares loading during server render without starting the request', () => {
    const queryFn = vi.fn().mockResolvedValue(['client-only'])
    const products = model({
      list: query<string[]>({ initialData: [], queryFn }),
    })

    function View() {
      const list = useModel(products, (state) => state.list.load())
      return <span>{String(list.isLoading)}</span>
    }

    const html = renderToString(
      <ComwitProvider>
        <View />
      </ComwitProvider>
    )

    expect(html).toContain('true')
    expect(queryFn).not.toHaveBeenCalled()
  })

  test('does not refetch on unrelated rerenders with the same argument', async () => {
    const queryFn = vi.fn(({ id }: { id: number }) => Promise.resolve({ id }))
    const product = model({
      detail: query<{ id: number } | null, { id: number }>({
        initialData: null,
        queryFn,
      }),
    })

    const { result, rerender } = renderHook(
      ({ id }) => useModel(product, (state) => state.detail.load({ id })),
      { initialProps: { id: 1 }, wrapper: Wrapper }
    )

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }))
    rerender({ id: 1 })
    rerender({ id: 1 })

    expect(queryFn).toHaveBeenCalledOnce()
  })

  test('loads a new key when the selector argument changes', async () => {
    const first = deferred<{ id: number }>()
    const second = deferred<{ id: number }>()
    const queryFn = vi.fn(({ id }: { id: number }) => (id === 1 ? first.promise : second.promise))
    const product = model({
      detail: query<{ id: number } | null, { id: number }>({
        initialData: null,
        queryFn,
      }),
    })

    const { result, rerender } = renderHook(
      ({ id }) => useModel(product, (state) => state.detail.load({ id })),
      { initialProps: { id: 1 }, wrapper: Wrapper }
    )

    await act(async () => {
      first.resolve({ id: 1 })
      await first.promise
    })
    expect(result.current.data).toEqual({ id: 1 })

    rerender({ id: 2 })
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(result.current.data).toBe(null)
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      second.resolve({ id: 2 })
      await second.promise
    })
    expect(result.current.data).toEqual({ id: 2 })
  })

  test('reuses a fresh cached key when returning to a previous argument', async () => {
    const queryFn = vi.fn(({ id }: { id: number }) => Promise.resolve({ id }))
    const product = model({
      detail: query<{ id: number } | null, { id: number }>({
        initialData: null,
        staleTime: 10_000,
        queryFn,
      }),
    })

    const { result, rerender } = renderHook(
      ({ id }) => useModel(product, (state) => state.detail.load({ id })),
      { initialProps: { id: 1 }, wrapper: Wrapper }
    )

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }))
    rerender({ id: 2 })
    await waitFor(() => expect(result.current.data).toEqual({ id: 2 }))
    rerender({ id: 1 })
    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  test('deduplicates concurrent selector loads for the same resource and key', async () => {
    const request = deferred<string[]>()
    const queryFn = vi.fn(() => request.promise)
    const products = model({
      list: query<string[]>({ initialData: [], queryFn }),
    })

    renderHook(
      () => ({
        first: useModel(products, (state) => state.list.load()),
        second: useModel(products, (state) => state.list.load()),
      }),
      { wrapper: Wrapper }
    )

    expect(queryFn).toHaveBeenCalledOnce()

    await act(async () => {
      request.resolve(['shared'])
      await request.promise
    })
  })

  test('surfaces rejected selector loads as query state without an unhandled rejection', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('Network failure'))
    const products = model({
      list: query<string[]>({ initialData: [], queryFn }),
    })

    const { result } = renderHook(() => useModel(products, (state) => state.list.load()), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe('Network failure')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
  })

  test('works through create() without adding another hook', async () => {
    const catalog = model({
      list: query<string[], { page: number }>({
        initialData: [],
        queryFn: ({ page }) => Promise.resolve([`page-${page}`]),
      }),
    })
    const useCatalog = create(catalog, { actions: [] })

    const { result } = renderHook(() => useCatalog((state) => state.list.load({ page: 2 }).data), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current).toEqual(['page-2']))
  })
})
