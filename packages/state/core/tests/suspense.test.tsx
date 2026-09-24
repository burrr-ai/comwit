// @vitest-environment happy-dom
import { describe, test, expect, vi } from 'vitest'
import React, { Suspense, Component, type ReactNode } from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { model, useModel, action, useAction, create, ComwitProvider, query } from '../src'

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function Wrapper({ children }: { children: ReactNode }) {
  return <ComwitProvider>{children}</ComwitProvider>
}

class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) return this.props.fallback
    return this.props.children
  }
}

describe('Suspense support', () => {
  test('component suspends until query resolves', async () => {
    const d = deferred<string[]>()

    const items = model({
      list: query({
        initialData: null as string[] | null,
        suspense: true,
        queryFn: () => d.promise,
      }),
    })

    const fetchItems = action(({ state }) => ({
      fetch() {
        state(items).list.query()
      },
    }))

    function ItemList() {
      const s = useModel(items)
      const actions = useAction<{ fetch: () => void }>([fetchItems])
      React.useEffect(() => {
        actions.fetch()
      }, [])
      return <div data-testid="data">{JSON.stringify(s.list.data)}</div>
    }

    render(
      <Wrapper>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <ItemList />
        </Suspense>
      </Wrapper>
    )

    // Should show fallback while loading
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeDefined()
    })

    // Resolve the query
    await act(async () => {
      d.resolve(['a', 'b', 'c'])
      await d.promise
      await new Promise((r) => setTimeout(r, 50))
    })

    // Should now show the data
    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('["a","b","c"]')
    })
  })

  test('component throws error to error boundary', async () => {
    const d = deferred<string[]>()

    const items = model({
      list: query({
        initialData: null as string[] | null,
        suspense: true,
        queryFn: () => d.promise,
      }),
    })

    const fetchItems = action(({ state }) => ({
      fetch() {
        state(items).list.query()
      },
    }))

    function ItemList() {
      const s = useModel(items)
      const actions = useAction<{ fetch: () => void }>([fetchItems])
      React.useEffect(() => {
        actions.fetch()
      }, [])
      return <div data-testid="data">{JSON.stringify(s.list.data)}</div>
    }

    render(
      <Wrapper>
        <ErrorBoundary fallback={<div data-testid="error">Error occurred</div>}>
          <Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <ItemList />
          </Suspense>
        </ErrorBoundary>
      </Wrapper>
    )

    // Should show suspense fallback while loading
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeDefined()
    })

    // Reject the query
    await act(async () => {
      d.reject(new Error('Network failure'))
      try {
        await d.promise
      } catch {}
      await new Promise((r) => setTimeout(r, 50))
    })

    // Should show error boundary fallback
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeDefined()
    })
  })

  test('refetch does NOT suspend', async () => {
    let callCount = 0
    const d1 = deferred<string[]>()
    let d2: ReturnType<typeof deferred<string[]>>

    const items = model({
      list: query({
        initialData: null as string[] | null,
        suspense: true,
        queryFn: () => {
          callCount++
          if (callCount === 1) return d1.promise
          d2 = deferred<string[]>()
          return d2.promise
        },
      }),
    })

    const fetchItems = action(({ state }) => ({
      fetch() {
        state(items).list.query()
      },
      refetch() {
        state(items).list.refetch()
      },
    }))

    let actionsRef: { fetch: () => void; refetch: () => void }

    function ItemList() {
      const s = useModel(items)
      const actions = useAction<{ fetch: () => void; refetch: () => void }>([fetchItems])
      actionsRef = actions
      React.useEffect(() => {
        actions.fetch()
      }, [])
      return (
        <div>
          <div data-testid="data">{JSON.stringify(s.list.data)}</div>
          <div data-testid="fetching">{String(s.list.isFetching)}</div>
        </div>
      )
    }

    render(
      <Wrapper>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <ItemList />
        </Suspense>
      </Wrapper>
    )

    // Initially suspended
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeDefined()
    })

    // Resolve initial query
    await act(async () => {
      d1.resolve(['first'])
      await d1.promise
      await new Promise((r) => setTimeout(r, 50))
    })

    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('["first"]')
    })

    // Trigger refetch - should NOT suspend
    await act(async () => {
      actionsRef.refetch()
      await new Promise((r) => setTimeout(r, 10))
    })

    // The component should remain visible (not suspended) during refetch
    expect(screen.queryByTestId('loading')).toBeNull()
    expect(screen.getByTestId('data')).toBeDefined()

    // Resolve refetch
    await act(async () => {
      d2!.resolve(['second'])
      await d2!.promise
      await new Promise((r) => setTimeout(r, 50))
    })

    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('["second"]')
    })
  })

  test('non-suspense queries still work normally', async () => {
    const d = deferred<string[]>()

    const items = model({
      list: query({
        initialData: null as string[] | null,
        queryFn: () => d.promise,
      }),
    })

    const fetchItems = action(({ state }) => ({
      fetch() {
        state(items).list.query()
      },
    }))

    function ItemList() {
      const s = useModel(items)
      const actions = useAction<{ fetch: () => void }>([fetchItems])
      React.useEffect(() => {
        actions.fetch()
      }, [])
      return (
        <div>
          <div data-testid="data">{JSON.stringify(s.list.data)}</div>
          <div data-testid="loading-state">{String(s.list.isLoading)}</div>
        </div>
      )
    }

    render(
      <Wrapper>
        <Suspense fallback={<div data-testid="suspense-fallback">Suspended</div>}>
          <ItemList />
        </Suspense>
      </Wrapper>
    )

    // Should NOT suspend - should render normally with initial data
    expect(screen.queryByTestId('suspense-fallback')).toBeNull()
    expect(screen.getByTestId('data').textContent).toBe('null')

    // Resolve
    await act(async () => {
      d.resolve(['x', 'y'])
      await d.promise
      await new Promise((r) => setTimeout(r, 50))
    })

    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('["x","y"]')
    })
  })
})
