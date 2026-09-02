// @vitest-environment happy-dom
import React, { Component, Suspense, startTransition, type ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { action, ComwitProvider, local, model, query, useAction, useModel } from '../src'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    return this.state.error ? this.props.fallback : this.props.children
  }
}

describe('query selector suspend', () => {
  test('starts one key-scoped query during render and retries with its resolved state', async () => {
    const request = deferred<{ id: string; title: string; meta: { locked: boolean } }>()
    const queryFn = vi.fn(() => request.promise)
    const renderedData: Array<{ meta: { locked: boolean } }> = []
    const posts = model({
      detail: query<{ id: string; title: string; meta: { locked: boolean } } | null, string>({
        initialData: null,
        queryFn,
      }),
    })

    function Detail() {
      const detail = useModel(posts, (state) => state.detail.suspend('one'))
      if (detail.data) renderedData.push(detail.data)
      return <div data-testid="detail">{detail.data?.title}</div>
    }

    render(
      <React.StrictMode>
        <ComwitProvider>
          <Suspense fallback={<div data-testid="fallback">loading</div>}>
            <Detail />
          </Suspense>
        </ComwitProvider>
      </React.StrictMode>
    )

    expect(screen.getByTestId('fallback')).toBeDefined()
    expect(queryFn).toHaveBeenCalledOnce()

    await act(async () => {
      request.resolve({ id: 'one', title: 'First', meta: { locked: true } })
      await request.promise
    })

    await waitFor(() => expect(screen.getByTestId('detail').textContent).toBe('First'))
    expect(queryFn).toHaveBeenCalledOnce()
    expect(Object.isFrozen(renderedData[0])).toBe(true)
    expect(Object.isFrozen(renderedData[0].meta)).toBe(true)
  })

  test('keeps the committed key active while a transitioned key is pending', async () => {
    const first = deferred<{ id: string }>()
    const second = deferred<{ id: string }>()
    const queryFn = vi.fn((id: string) => (id === 'a' ? first.promise : second.promise))
    const posts = model({
      detail: query<{ id: string } | null, string>({ initialData: null, queryFn }),
    })

    function Detail({ id }: { id: string }) {
      const detail = useModel(posts, (state) => state.detail.suspend(id))
      return <div data-testid="detail">{detail.data.id}</div>
    }

    function App() {
      const [id, setId] = React.useState('a')
      const activeId = useModel(posts, (state) => state.detail.data?.id ?? 'none')
      return (
        <>
          <button onClick={() => startTransition(() => setId('b'))}>next</button>
          <div data-testid="active">{activeId}</div>
          <Suspense fallback={<div data-testid="fallback">loading</div>}>
            <Detail id={id} />
          </Suspense>
        </>
      )
    }

    render(
      <ComwitProvider>
        <App />
      </ComwitProvider>
    )

    await act(async () => {
      first.resolve({ id: 'a' })
      await first.promise
    })
    await waitFor(() => expect(screen.getByTestId('detail').textContent).toBe('a'))
    expect(screen.getByTestId('active').textContent).toBe('a')

    fireEvent.click(screen.getByText('next'))
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('detail').textContent).toBe('a')
    expect(screen.getByTestId('active').textContent).toBe('a')

    await act(async () => {
      second.resolve({ id: 'b' })
      await second.promise
    })
    await waitFor(() => expect(screen.getByTestId('detail').textContent).toBe('b'))
    await waitFor(() => expect(screen.getByTestId('active').textContent).toBe('b'))
  })

  test('does not activate a staged key when its transition is abandoned', async () => {
    const first = deferred<{ id: string }>()
    const abandoned = deferred<{ id: string }>()
    const queryFn = vi.fn((id: string) => (id === 'a' ? first.promise : abandoned.promise))
    const posts = model({
      detail: query<{ id: string } | null, string>({ initialData: null, queryFn }),
    })

    function Detail({ id }: { id: string }) {
      const detail = useModel(posts, (state) => state.detail.suspend(id))
      return <div data-testid="detail">{detail.data?.id}</div>
    }

    function App() {
      const [id, setId] = React.useState('a')
      const activeId = useModel(posts, (state) => state.detail.data?.id ?? 'none')
      return (
        <>
          <button onClick={() => startTransition(() => setId('b'))}>stage b</button>
          <button onClick={() => setId('a')}>stay on a</button>
          <div data-testid="active">{activeId}</div>
          <Suspense fallback={<div data-testid="fallback">loading</div>}>
            <Detail id={id} />
          </Suspense>
        </>
      )
    }

    render(
      <ComwitProvider>
        <App />
      </ComwitProvider>
    )

    await act(async () => {
      first.resolve({ id: 'a' })
      await first.promise
    })
    await waitFor(() => expect(screen.getByTestId('detail').textContent).toBe('a'))

    fireEvent.click(screen.getByText('stage b'))
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('active').textContent).toBe('a')

    fireEvent.click(screen.getByText('stay on a'))

    await act(async () => {
      abandoned.resolve({ id: 'b' })
      await abandoned.promise
    })

    expect(screen.getByTestId('detail').textContent).toBe('a')
    expect(screen.getByTestId('active').textContent).toBe('a')
  })

  test('throws a key-scoped rejection to the nearest ErrorBoundary', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const request = deferred<string>()
    const resource = model({
      value: query<string | null, string>({
        initialData: null,
        queryFn: () => request.promise,
      }),
    })

    function View() {
      const value = useModel(resource, (state) => state.value.suspend('bad'))
      return <div>{value.data}</div>
    }

    render(
      <ComwitProvider>
        <ErrorBoundary fallback={<div data-testid="error">failed</div>}>
          <Suspense fallback={<div data-testid="fallback">loading</div>}>
            <View />
          </Suspense>
        </ErrorBoundary>
      </ComwitProvider>
    )

    await act(async () => {
      request.reject(new Error('boom'))
      await request.promise.catch(() => {})
    })

    await waitFor(() => expect(screen.getByTestId('error')).toBeDefined())
    consoleError.mockRestore()
  })

  test('stages local.query remotely and reconciles its lifecycle only after commit', async () => {
    const collection = local.collection<{ id: string }>({ key: 'suspend-items', version: 1 })
    const request = deferred<{ id: string }>()
    const queryFn = vi.fn(() => request.promise)
    const resource = model({
      detail: local.query<{ id: string } | null, string>({
        source: collection,
        initialData: null,
        queryFn,
      }),
    })

    function View() {
      const detail = useModel(resource, (state) => state.detail.suspend('one'))
      return <div data-testid="local-detail">{detail.data?.id}</div>
    }

    render(
      <ComwitProvider>
        <Suspense fallback={<div data-testid="local-fallback">loading</div>}>
          <View />
        </Suspense>
      </ComwitProvider>
    )

    expect(screen.getByTestId('local-fallback')).toBeDefined()
    expect(queryFn).toHaveBeenCalledOnce()

    await act(async () => {
      request.resolve({ id: 'one' })
      await request.promise
    })

    await waitFor(() => expect(screen.getByTestId('local-detail').textContent).toBe('one'))
  })

  test('reports streaming query drivers as unsupported instead of partially committing data', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const queryFn = vi.fn(async function* () {
      yield ['one']
    })
    const resource = model({
      list: query<string[]>({ initialData: [], queryFn }),
    })

    function View() {
      useModel(resource, (state) => state.list.suspend())
      return null
    }

    render(
      <ComwitProvider>
        <ErrorBoundary fallback={<div data-testid="unsupported-stream">unsupported</div>}>
          <Suspense fallback={<div>loading</div>}>
            <View />
          </Suspense>
        </ErrorBoundary>
      </ComwitProvider>
    )

    await waitFor(() => expect(screen.getByTestId('unsupported-stream')).toBeDefined())
    expect(queryFn).toHaveBeenCalledOnce()
    consoleError.mockRestore()
  })

  test('supports an infinite query result without suspending subsequent page fetches', async () => {
    const initial = deferred<{ data: string[]; cursor: string; hasMore: boolean }>()
    const nextPage = deferred<{ data: string[]; cursor: string; hasMore: boolean }>()
    const queryFn = vi
      .fn<() => Promise<{ data: string[]; cursor: string; hasMore: boolean }>>()
      .mockImplementationOnce(() => initial.promise)
      .mockImplementationOnce(() => nextPage.promise)
    const resource = model({
      list: query.infinite<string[]>({ initialData: [], queryFn }),
    })
    const resourceActions = action(({ state }) => ({
      next() {
        return state(resource).list.nextFetch()
      },
    }))

    function View() {
      const list = useModel(resource, (state) => state.list.suspend())
      const actions = useAction<{ next(): Promise<unknown> }>([resourceActions])
      return (
        <>
          <div data-testid="items">{list.data.join(',')}</div>
          <button onClick={() => void actions.next()}>next page</button>
        </>
      )
    }

    render(
      <ComwitProvider>
        <Suspense fallback={<div data-testid="fallback">loading</div>}>
          <View />
        </Suspense>
      </ComwitProvider>
    )

    await act(async () => {
      initial.resolve({ data: ['a'], cursor: 'next', hasMore: true })
      await initial.promise
    })
    await waitFor(() => expect(screen.getByTestId('items').textContent).toBe('a'))

    fireEvent.click(screen.getByText('next page'))
    expect(screen.queryByTestId('fallback')).toBeNull()
    expect(screen.getByTestId('items').textContent).toBe('a')

    await act(async () => {
      nextPage.resolve({ data: ['b'], cursor: 'done', hasMore: false })
      await nextPage.promise
    })
    await waitFor(() => expect(screen.getByTestId('items').textContent).toBe('a,b'))
  })

  test('keeps resolved data visible during a background refetch', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const queryFn = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)
    const resource = model({ value: query<string>({ initialData: '', queryFn }) })
    const resourceActions = action(({ state }) => ({
      refetch() {
        return state(resource).value.refetch()
      },
    }))

    function View() {
      const value = useModel(resource, (state) => state.value.suspend())
      const actions = useAction<{ refetch(): Promise<unknown> }>([resourceActions])
      return (
        <>
          <div data-testid="value">{value.data}</div>
          <button onClick={() => void actions.refetch()}>refetch</button>
        </>
      )
    }

    render(
      <ComwitProvider>
        <Suspense fallback={<div data-testid="fallback">loading</div>}>
          <View />
        </Suspense>
      </ComwitProvider>
    )

    await act(async () => {
      first.resolve('first')
      await first.promise
    })
    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('first'))

    fireEvent.click(screen.getByText('refetch'))
    expect(screen.queryByTestId('fallback')).toBeNull()
    expect(screen.getByTestId('value').textContent).toBe('first')

    await act(async () => {
      second.resolve('second')
      await second.promise
    })
    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('second'))
  })

  test('keeps load() on its non-throwing effect path', async () => {
    const request = deferred<string>()
    const resource = model({
      value: query<string>({ initialData: 'initial', queryFn: () => request.promise }),
    })

    function View() {
      const value = useModel(resource, (state) => state.value.load())
      return <div data-testid="value">{value.data}</div>
    }

    render(
      <ComwitProvider>
        <Suspense fallback={<div data-testid="fallback">loading</div>}>
          <View />
        </Suspense>
      </ComwitProvider>
    )

    expect(screen.queryByTestId('fallback')).toBeNull()
    expect(screen.getByTestId('value').textContent).toBe('initial')

    await act(async () => {
      request.resolve('loaded')
      await request.promise
    })
    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('loaded'))
  })
})
