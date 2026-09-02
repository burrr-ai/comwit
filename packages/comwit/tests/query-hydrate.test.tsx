// @vitest-environment happy-dom
import React, { StrictMode, Suspense, startTransition, useState } from 'react'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { IDBFactory } from 'fake-indexeddb'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { action, ComwitProvider, create, local, model, query } from '../src'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

describe('generated domain hook hydrate', () => {
  test('initializes a complete success entry before the first passive snapshot', () => {
    const queryFn = vi.fn(async (slug: string) => ({ slug, title: 'remote' }))
    const posts = model({
      detail: query<{ slug: string; title: string } | null, string>({
        initialData: null,
        queryFn,
      }),
    })
    const usePosts = create(posts, { actions: [] })
    let renders = 0

    function RouteAdapter() {
      renders++
      usePosts.hydrate({
        detail: { arg: 'hello', data: { slug: 'hello', title: 'Server' } },
      })
      const detail = usePosts((state) => state.detail)
      return (
        <div>
          <span data-testid="title">{detail.data?.title}</span>
          <span data-testid="status">
            {String(detail.isSuccess)}:{String(detail.isLoading)}:{String(detail.isFetching)}:
            {String(detail.isError)}:{String(detail.error)}
          </span>
        </div>
      )
    }

    render(
      <ComwitProvider>
        <RouteAdapter />
      </ComwitProvider>
    )

    expect(screen.getByTestId('title').textContent).toBe('Server')
    expect(screen.getByTestId('status').textContent).toBe('true:false:false:false:null')
    expect(queryFn).not.toHaveBeenCalled()
    expect(renders).toBe(1)
  })

  test('is idempotent for the same provider field and key', () => {
    const resource = model({
      detail: query<{ id: string } | null, string>({
        initialData: null,
        queryFn: vi.fn(),
      }),
    })
    const useResource = create(resource, { actions: [] })
    let renders = 0

    function RouteAdapter() {
      const [, rerender] = useState(0)
      useResource.hydrate({ detail: { arg: 'one', data: { id: 'server' } } })
      const id = useResource((state) => state.detail.data?.id)
      renders++
      return (
        <button data-testid="value" onClick={() => rerender((value) => value + 1)}>
          {id}
        </button>
      )
    }

    render(
      <ComwitProvider>
        <RouteAdapter />
      </ComwitProvider>
    )
    const initialRenders = renders

    act(() => screen.getByTestId('value').click())

    expect(screen.getByTestId('value').textContent).toBe('server')
    expect(renders).toBe(initialRenders + 1)
  })

  test('treats nullable hydration input as a no-op', () => {
    const resource = model({
      detail: query<string | null>({ initialData: null, queryFn: vi.fn() }),
    })
    const useResource = create(resource, { actions: [] })

    function View() {
      useResource.hydrate(null)
      const detail = useResource((state) => state.detail)
      return (
        <span data-testid="value">
          {String(detail.data)}:{String(detail.isSuccess)}
        </span>
      )
    }

    render(
      <ComwitProvider>
        <View />
      </ComwitProvider>
    )

    expect(screen.getByTestId('value').textContent).toBe('null:false')
  })

  test('defers an observed entry replacement until layout commit', () => {
    const resource = model({
      detail: query<{ id: string } | null, string>({ initialData: null, queryFn: vi.fn() }),
    })
    const useResource = create(resource, { actions: [] })
    const renderedValues: string[] = []

    function View() {
      const [seed, setSeed] = useState<{ arg: string; data: { id: string } } | null>(null)
      useResource.hydrate(seed ? { detail: seed } : null)
      const id = useResource((state) => state.detail.data?.id ?? 'empty')
      renderedValues.push(id)
      return (
        <button
          data-testid="value"
          onClick={() => setSeed({ arg: 'later', data: { id: 'late server value' } })}
        >
          {id}
        </button>
      )
    }

    render(
      <ComwitProvider>
        <View />
      </ComwitProvider>
    )
    const rendersBeforeHydration = renderedValues.length
    act(() => screen.getByTestId('value').click())

    const hydrationRenders = renderedValues.slice(rendersBeforeHydration)
    expect(hydrationRenders[0]).toBe('empty')
    expect(hydrationRenders.at(-1)).toBe('late server value')
    expect(screen.getByTestId('value').textContent).toBe('late server value')
  })

  test('does not apply observed hydration from an abandoned transition', async () => {
    let resolvePending!: () => void
    const pending = new Promise<void>((resolve) => {
      resolvePending = resolve
    })
    const resource = model({
      detail: query<{ id: string } | null, string>({ initialData: null, queryFn: vi.fn() }),
    })
    const useResource = create(resource, { actions: [] })

    function PendingRoute({ active }: { active: boolean }) {
      if (active) throw pending
      return null
    }

    function View() {
      const [route, setRoute] = useState('a')
      useResource.hydrate({ detail: { arg: route, data: { id: route } } })
      const id = useResource((state) => state.detail.data?.id)

      return (
        <>
          <button onClick={() => startTransition(() => setRoute('b'))}>stage b</button>
          <button onClick={() => setRoute('a')}>stay a</button>
          <span data-testid="active-route">{id}</span>
          <PendingRoute active={route === 'b'} />
        </>
      )
    }

    render(
      <ComwitProvider>
        <Suspense fallback={<span>pending</span>}>
          <View />
        </Suspense>
      </ComwitProvider>
    )

    expect(screen.getByTestId('active-route').textContent).toBe('a')
    act(() => screen.getByText('stage b').click())
    expect(screen.getByTestId('active-route').textContent).toBe('a')
    act(() => screen.getByText('stay a').click())

    await act(async () => {
      resolvePending()
      await pending
    })

    expect(screen.getByTestId('active-route').textContent).toBe('a')
  })

  test('hydrates local.query without running its query function', () => {
    const queryFn = vi.fn(async () => [{ id: 'remote' }])
    const source = local.collection<{ id: string }>({ key: 'hydrated-items', version: 1 })
    const resource = model({
      list: local.query<{ id: string }[]>({ source, initialData: [], queryFn }),
    })
    const useResource = create(resource, { actions: [] })

    function View() {
      useResource.hydrate({ list: { data: [{ id: 'server' }] } })
      const list = useResource((state) => state.list.data)
      return <span data-testid="local-value">{list[0]?.id}</span>
    }

    render(
      <ComwitProvider defaultOptions={{ local: { database: 'hydrate-test' } }}>
        <View />
      </ComwitProvider>
    )

    expect(screen.getByTestId('local-value').textContent).toBe('server')
    expect(queryFn).not.toHaveBeenCalled()
  })

  test('persists a hydrated local.query entry after commit', async () => {
    const indexedDB = new IDBFactory()
    const database = `hydrate-local-${crypto.randomUUID()}`
    const queryFn = vi.fn(async () => [{ id: 'remote' }])
    const source = local.collection<{ id: string }>({ key: 'hydrated-persisted-items', version: 1 })
    const resource = model({
      list: local.query<{ id: string }[], string>({
        source,
        initialData: [],
        staleTime: 60_000,
        queryFn,
      }),
    })
    const useResource = create(resource, { actions: [] })
    const providerOptions = { local: { indexedDB, database } }

    function Seed() {
      useResource.hydrate({ list: { arg: 'one', data: [{ id: 'server' }] } })
      const list = useResource((state) => state.list.data)
      return <span>{list[0]?.id}</span>
    }

    const seeded = render(
      <ComwitProvider defaultOptions={providerOptions}>
        <Seed />
      </ComwitProvider>
    )
    expect(screen.getByText('server')).toBeDefined()
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)))
    seeded.unmount()

    function Restore() {
      const list = useResource((state) => state.list.load('one'))
      return <span data-testid="restored-local">{list.data[0]?.id}</span>
    }

    render(
      <ComwitProvider defaultOptions={providerOptions}>
        <Restore />
      </ComwitProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('restored-local').textContent).toBe('server')
    })
    expect(queryFn).not.toHaveBeenCalled()
  })

  test('sets the serialized argument as the active key for later actions', async () => {
    const queryFn = vi.fn(async (arg: { slug: string }) => ({ slug: arg.slug }))
    const resource = model({
      detail: query<{ slug: string } | null, { slug: string }>({
        initialData: null,
        serializeArg: ({ slug }) => slug,
        queryFn,
      }),
    })
    const resourceActions = action(({ state }) => ({
      refetch() {
        return state(resource).detail.refetch()
      },
    }))
    const useResource = create<
      typeof resource extends import('../src/core/model').Model<infer T> ? T : never,
      { refetch(): Promise<unknown> }
    >(resource, { actions: [resourceActions] })

    function View() {
      useResource.hydrate({ detail: { arg: { slug: 'server-key' }, data: { slug: 'server' } } })
      const state = useResource((current) => ({
        slug: current.detail.data?.slug,
        refetch: current.actions.refetch,
      }))
      return <button onClick={() => void state.refetch()}>{state.slug}</button>
    }

    render(
      <ComwitProvider>
        <View />
      </ComwitProvider>
    )

    await act(async () => screen.getByText('server').click())
    expect(queryFn).toHaveBeenCalledWith(
      { slug: 'server-key' },
      expect.objectContaining({ state: expect.objectContaining({ data: { slug: 'server' } }) })
    )
  })

  test('records hydration freshness without calling the query function', async () => {
    const queryFn = vi.fn(async () => ({ id: 'remote' }))
    const resource = model({
      detail: query<{ id: string } | null, string>({
        initialData: null,
        staleTime: 60_000,
        queryFn,
      }),
    })
    const useResource = create(resource, { actions: [] })

    function View() {
      useResource.hydrate({ detail: { arg: 'one', data: { id: 'server' } } })
      const detail = useResource((state) => state.detail.load('one'))
      return <span data-testid="fresh-value">{detail.data?.id}</span>
    }

    render(
      <ComwitProvider>
        <View />
      </ComwitProvider>
    )
    await act(async () => Promise.resolve())

    expect(screen.getByTestId('fresh-value').textContent).toBe('server')
    expect(queryFn).not.toHaveBeenCalled()
  })

  test('invalidates an older pending request when committed hydration wins', async () => {
    const request = deferred<{ id: string }>()
    const resource = model({
      detail: query<{ id: string } | null, string>({
        initialData: null,
        queryFn: () => request.promise,
      }),
    })
    const useResource = create(resource, { actions: [] })

    function View() {
      const [hydrate, setHydrate] = useState(false)
      useResource.hydrate(hydrate ? { detail: { arg: 'one', data: { id: 'server' } } } : null)
      const detail = useResource((state) => state.detail.load('one'))
      return <button onClick={() => setHydrate(true)}>{detail.data?.id ?? 'loading'}</button>
    }

    render(
      <ComwitProvider>
        <View />
      </ComwitProvider>
    )

    act(() => screen.getByText('loading').click())
    expect(screen.getByText('server')).toBeDefined()

    await act(async () => {
      request.resolve({ id: 'stale request' })
      await request.promise
    })

    expect(screen.getByText('server')).toBeDefined()
  })

  test('renders and hydrates React 19 with the same server snapshot and no client query', async () => {
    const queryFn = vi.fn(async () => ({ id: 'client' }))
    const resource = model({
      detail: query<{ id: string } | null, string>({ initialData: null, queryFn }),
    })
    const useResource = create(resource, { actions: [] })
    const recoverableError = vi.fn()

    function RouteAdapter() {
      useResource.hydrate({ detail: { arg: 'one', data: { id: 'server' } } })
      const id = useResource((state) => state.detail.data?.id)
      return <strong data-testid="hydrated-value">{id}</strong>
    }

    const tree = (
      <StrictMode>
        <ComwitProvider>
          <RouteAdapter />
        </ComwitProvider>
      </StrictMode>
    )
    const html = renderToString(tree)
    expect(html).toContain('>server</strong>')

    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)

    let root!: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(container, tree, { onRecoverableError: recoverableError })
    })

    expect(container.querySelector('[data-testid="hydrated-value"]')?.textContent).toBe('server')
    expect(recoverableError).not.toHaveBeenCalled()
    expect(queryFn).not.toHaveBeenCalled()
    await act(async () => root.unmount())
  })
})
