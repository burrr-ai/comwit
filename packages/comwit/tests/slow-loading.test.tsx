// @vitest-environment happy-dom
import React, { StrictMode, Suspense, type ReactNode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  ComwitProvider,
  action,
  create,
  local,
  model,
  query,
  retry,
  useAction,
  useModel,
} from '../src'
import { bindResourceState, createQueryBindingRegistry } from '../src/core/query'
import { cancelModelGc, scheduleModelGc } from '../src/core/query/accessor'
import { RESOURCE_LIFECYCLE, type AnyResourceDescriptor } from '../src/core/query/types'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function bind(descriptor: AnyResourceDescriptor) {
  const resource = model({ value: descriptor })
  const store = resource.instance()
  const registry = createQueryBindingRegistry()
  const state = bindResourceState(
    store.proxy,
    resource.pluginBags.get('query')!,
    undefined,
    registry,
    resource.key
  ) as any
  return { value: state.value, registry, resource }
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <ComwitProvider>{children}</ComwitProvider>
    </StrictMode>
  )
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('query slow loading clock', () => {
  test.each([-1, NaN, Infinity, -Infinity, 2_147_483_648, '500', null])(
    'rejects invalid threshold %s',
    (slowLoadingMs) => {
      expect(() =>
        query({ initialData: [], queryFn: () => [], slowLoadingMs: slowLoadingMs as number })
      ).toThrow(RangeError)
    }
  )

  test('accepts the maximum browser timeout without overflowing', () => {
    const { value } = bind(
      query({
        initialData: null,
        queryFn: () => new Promise(() => {}),
        slowLoadingMs: 2_147_483_647,
      })
    )
    void value.query()
    vi.advanceTimersByTime(2_147_483_646)
    expect(value.isSlowLoading).toBe(false)
    vi.advanceTimersByTime(1)
    expect(value.isSlowLoading).toBe(true)
  })

  test('does not allocate a timer without the declaration option', async () => {
    const request = deferred<null>()
    const { value } = bind(query({ initialData: null, queryFn: () => request.promise }))
    const result = value.query()
    vi.advanceTimersByTime(10_000)
    expect(value.isLoading).toBe(true)
    expect(value.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    request.resolve(null)
    await result
  })

  test('crosses 499/500ms and exposes successful empty data immediately', async () => {
    const request = deferred<string[]>()
    const { value } = bind(
      query({ initialData: ['initial'], queryFn: () => request.promise, slowLoadingMs: 500 })
    )
    const result = value.query()
    expect(value.isLoading).toBe(true)
    expect(value.isFetching).toBe(true)
    vi.advanceTimersByTime(499)
    expect(value.isSlowLoading).toBe(false)
    vi.advanceTimersByTime(1)
    expect(value.isSlowLoading).toBe(true)
    request.resolve([])
    await result
    expect(value.data).toEqual([])
    expect(value.isSuccess).toBe(true)
    expect(value.isLoading).toBe(false)
    expect(value.isFetching).toBe(false)
    expect(value.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  test.each([0, 80, 499])(
    'cancels fast completion at %sms without delaying its Promise',
    async (elapsed) => {
      const request = deferred<null>()
      const { value } = bind(
        query({ initialData: null, queryFn: () => request.promise, slowLoadingMs: 500 })
      )
      const result = value.query()
      vi.advanceTimersByTime(elapsed)
      request.resolve(null)
      await result
      expect(value.isSuccess).toBe(true)
      expect(value.isSlowLoading).toBe(false)
      expect(vi.getTimerCount()).toBe(0)
      vi.advanceTimersByTime(500)
      expect(value.isSlowLoading).toBe(false)
    }
  )

  test('zero means immediate initial loading, without a timer', async () => {
    const request = deferred<null>()
    const { value } = bind(
      query({ initialData: null, queryFn: () => request.promise, slowLoadingMs: 0 })
    )
    const result = value.query()
    expect(value.isSlowLoading).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    request.resolve(null)
    await result
    expect(value.isSlowLoading).toBe(false)
  })

  test('errors reset the flag and same-key retry starts a new interval', async () => {
    let request = deferred<null>()
    const { value } = bind(
      query({ initialData: null, queryFn: () => request.promise, slowLoadingMs: 500 })
    )
    const failed = value.query().catch(() => {})
    vi.advanceTimersByTime(500)
    expect(value.isSlowLoading).toBe(true)
    request.reject(new Error('failed'))
    await failed
    expect(value.isError).toBe(true)
    expect(value.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    request = deferred<null>()
    const retried = value.query()
    vi.advanceTimersByTime(499)
    expect(value.isSlowLoading).toBe(false)
    vi.advanceTimersByTime(1)
    expect(value.isSlowLoading).toBe(true)
    request.resolve(null)
    await retried
  })

  test('a retry inside queryFn retains the continuous pending interval', async () => {
    const request = deferred<null>()
    const driver = vi
      .fn()
      .mockRejectedValueOnce(new Error('retry'))
      .mockImplementation(() => request.promise)
    const { value } = bind(
      query({ initialData: null, queryFn: retry(1, 400)(driver), slowLoadingMs: 500 })
    )
    const result = value.query()
    await vi.advanceTimersByTimeAsync(400)
    expect(driver).toHaveBeenCalledTimes(2)
    expect(value.isSlowLoading).toBe(false)
    await vi.advanceTimersByTimeAsync(100)
    expect(value.isSlowLoading).toBe(true)
    request.resolve(null)
    await result
  })

  test('pending A → B → A and late settlement cannot inherit another interval', async () => {
    const requests = [deferred<string>(), deferred<string>(), deferred<string>()]
    const driver = vi
      .fn()
      .mockImplementationOnce(() => requests[0].promise)
      .mockImplementationOnce(() => requests[1].promise)
      .mockImplementationOnce(() => requests[2].promise)
    const { value } = bind(
      query<string, string>({ initialData: '', queryFn: driver, slowLoadingMs: 500 })
    )
    const first = value.query('a')
    vi.advanceTimersByTime(400)
    const second = value.query('b')
    vi.advanceTimersByTime(400)
    expect(value.isSlowLoading).toBe(false)
    const third = value.query('a')
    requests[0].resolve('old a')
    requests[1].resolve('old b')
    await Promise.all([first, second])
    vi.advanceTimersByTime(499)
    expect(value.isSlowLoading).toBe(false)
    vi.advanceTimersByTime(1)
    expect(value.isSlowLoading).toBe(true)
    requests[2].resolve('new a')
    await third
    expect(value.data).toBe('new a')
  })

  test('overlapping requests for the same serialized key keep one pending interval', async () => {
    const first = deferred<string>(),
      second = deferred<string>()
    const { value } = bind(
      query({
        initialData: '',
        queryFn: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
        slowLoadingMs: 500,
      })
    )
    const p1 = value.query({ a: 1, b: 2 })
    vi.advanceTimersByTime(400)
    const p2 = value.query({ b: 2, a: 1 })
    vi.advanceTimersByTime(100)
    expect(value.isSlowLoading).toBe(true)
    first.resolve('old')
    await p1
    expect(value.isSlowLoading).toBe(true)
    second.resolve('new')
    await p2
  })

  test('set and fresh/stale memory cache never restore the derived flag', async () => {
    const pending = deferred<string>()
    const driver = vi
      .fn()
      .mockResolvedValueOnce('cached')
      .mockImplementation(() => pending.promise)
    const { value } = bind(
      query<string, string>({
        initialData: '',
        queryFn: driver,
        staleTime: 1000,
        slowLoadingMs: 500,
      })
    )
    await value.query('a')
    await value.query('a')
    expect(driver).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1000)
    const refresh = value.query('a')
    vi.advanceTimersByTime(1000)
    expect(value.isLoading).toBe(false)
    expect(value.isFetching).toBe(true)
    expect(value.isSlowLoading).toBe(false)
    value.set({ data: 'manual', isSlowLoading: true }, { arg: 'a' })
    expect(value.isSlowLoading).toBe(false)
    expect(value.data).toBe('manual')
    pending.resolve('outdated')
    await refresh
    expect(value.data).toBe('manual')
    expect(vi.getTimerCount()).toBe(0)
  })

  test('stream readiness ends the interval without waiting for the stream to close', async () => {
    const chunk = deferred<string>(),
      done = deferred<void>()
    const { value } = bind(
      query({
        initialData: '',
        slowLoadingMs: 500,
        async *queryFn() {
          yield { data: await chunk.promise, isLoading: false, isSuccess: true }
          await done.promise
        },
      })
    )
    const result = value.query()
    await vi.advanceTimersByTimeAsync(500)
    expect(value.isSlowLoading).toBe(true)
    chunk.resolve('first')
    await vi.advanceTimersByTimeAsync(0)
    expect(value.data).toBe('first')
    expect(value.isFetching).toBe(true)
    expect(value.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    done.resolve()
    await result
  })

  test.each(['infinite', 'realtime'] as const)(
    'supports the initial request of query.%s',
    async (kind) => {
      const request = deferred<any>()
      const options = { initialData: [], queryFn: () => request.promise, slowLoadingMs: 500 }
      const descriptor =
        kind === 'infinite'
          ? query.infinite(options)
          : query.realtime({ ...options, subscribe: () => () => {} })
      const { value } = bind(descriptor)
      const result = value.query()
      vi.advanceTimersByTime(500)
      expect(value.isSlowLoading).toBe(true)
      request.resolve({ data: [], cursor: null, hasMore: false })
      await result
      expect(value.isSlowLoading).toBe(false)
    }
  )

  test('resolved data clears the clock before durable persistence completes', async () => {
    const request = deferred<null>(),
      persisted = deferred<void>()
    const descriptor = query({
      initialData: null,
      queryFn: () => request.promise,
      slowLoadingMs: 500,
    })
    descriptor[RESOURCE_LIFECYCLE] = [{ bind: () => ({ afterSuccess: () => persisted.promise }) }]
    const { value } = bind(descriptor)
    const result = value.query()
    await vi.advanceTimersByTimeAsync(500)
    expect(value.isSlowLoading).toBe(true)
    request.resolve(null)
    await vi.advanceTimersByTimeAsync(0)
    expect(value.isSuccess).toBe(true)
    expect(value.isLoading).toBe(true) // Existing write-through semantics are unchanged.
    expect(value.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    persisted.resolve()
    await result
  })

  test('realtime errors immediately clear a slow initial request for a new key', async () => {
    const request = deferred<string>()
    let fail!: (error: unknown) => void
    const { value } = bind(
      query.realtime<string, string>({
        initialData: '',
        slowLoadingMs: 500,
        queryFn: vi.fn().mockResolvedValueOnce('first').mockReturnValue(request.promise),
        subscribe: (callbacks) => {
          fail = callbacks.onError
          return () => {}
        },
      })
    )
    await value.query('a')
    const result = value.query('b')
    vi.advanceTimersByTime(500)
    expect(value.isSlowLoading).toBe(true)
    fail(new Error('disconnected'))
    expect(value.isError).toBe(true)
    expect(value.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    request.resolve('second')
    await result
  })

  test('last observer pauses its timer; reobservation resumes the same pending interval', async () => {
    const request = deferred<null>()
    const { value, registry, resource } = bind(
      query({
        initialData: null,
        queryFn: () => request.promise,
        slowLoadingMs: 500,
        gcTime: 10000,
      })
    )
    cancelModelGc(registry, resource.key)
    const result = value.query()
    vi.advanceTimersByTime(300)
    scheduleModelGc(registry, resource.key)
    expect(vi.getTimerCount()).toBe(1) // Only the existing cache GC timer remains.
    vi.advanceTimersByTime(300)
    expect(value.isSlowLoading).toBe(false)
    cancelModelGc(registry, resource.key)
    expect(value.isSlowLoading).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    request.resolve(null)
    await result
  })
})

describe('React and server snapshots', () => {
  test('committed hydration clears a slow request and invalidates its late result', async () => {
    const request = deferred<string>()
    const resource = model({
      value: query({ initialData: '', queryFn: () => request.promise, slowLoadingMs: 500 }),
    })
    const useResource = create(resource, { actions: [] })
    const view = renderHook(
      ({ seed }: { seed?: string }) => {
        useResource.hydrate(seed === undefined ? undefined : { value: { data: seed } })
        return useResource((s) => s.value.load())
      },
      { initialProps: { seed: undefined as string | undefined }, wrapper: Wrapper }
    )
    act(() => vi.advanceTimersByTime(500))
    expect(view.result.current.isSlowLoading).toBe(true)
    view.rerender({ seed: 'server' })
    expect(view.result.current.data).toBe('server')
    expect(view.result.current.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    await act(async () => {
      request.resolve('late')
      await request.promise
    })
    expect(view.result.current.data).toBe('server')
  })
  test('provider teardown cancels an action-only query clock, including Strict Mode replay', async () => {
    const request = deferred<null>()
    const resource = model({
      value: query({ initialData: null, queryFn: () => request.promise, slowLoadingMs: 500 }),
    })
    const commands = action(({ state }) => ({ load: () => state(resource).value.query() }))
    const view = renderHook(
      () => {
        const actions = useAction([commands])
        React.useEffect(() => {
          void actions.load()
        }, [actions])
      },
      { wrapper: Wrapper }
    )
    expect(vi.getTimerCount()).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
    await act(async () => {
      request.resolve(null)
      await request.promise
    })
  })

  test('Strict Mode selectors share a clock; key changes and unmount clean up', async () => {
    const request = deferred<string>()
    const driver = vi.fn(() => request.promise)
    const resource = model({
      value: query<string, string>({ initialData: '', queryFn: driver, slowLoadingMs: 500 }),
    })
    const view = renderHook(
      ({ id }) => [
        useModel(resource, (s) => s.value.load(id)),
        useModel(resource, (s) => s.value.load(id)),
      ],
      { initialProps: { id: 'a' }, wrapper: Wrapper }
    )
    expect(driver).toHaveBeenCalledOnce()
    act(() => vi.advanceTimersByTime(500))
    expect(view.result.current.map((v) => v.isSlowLoading)).toEqual([true, true])
    view.rerender({ id: 'b' })
    expect(view.result.current.map((v) => v.isSlowLoading)).toEqual([false, false])
    act(() => vi.advanceTimersByTime(499))
    expect(view.result.current[0].isSlowLoading).toBe(false)
    view.unmount()
    expect(vi.getTimerCount()).toBe(2) // Two query keys scheduled for existing GC.
    await act(async () => {
      request.resolve('done')
      await request.promise
    })
  })

  test.each([false, true])('SSR and hydration agree with server seed=%s', async (seeded) => {
    const request = deferred<string>()
    const driver = vi.fn(() => request.promise)
    const resource = model({
      value: query({ initialData: '', queryFn: driver, slowLoadingMs: 0, staleTime: Infinity }),
    })
    const useResource = create(resource, { actions: [] })
    function View() {
      useResource.hydrate(seeded ? { value: { data: 'server' } } : undefined)
      const value = useResource((s) => s.value.load())
      return <span>{value.isSlowLoading ? 'slow' : value.isLoading ? 'pending' : value.data}</span>
    }
    const tree = (
      <Wrapper>
        <View />
      </Wrapper>
    )
    const html = renderToString(tree)
    expect(html).toContain(seeded ? 'server' : 'pending')
    expect(driver).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    const container = document.createElement('div')
    container.innerHTML = html
    const errors = vi.fn()
    let root!: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(container, tree, { onRecoverableError: errors })
    })
    expect(errors).not.toHaveBeenCalled()
    expect(container.textContent).toBe(seeded ? 'server' : 'slow')
    await act(async () => {
      request.resolve('client')
      await request.promise
    })
    expect(container.textContent).toBe(seeded ? 'server' : 'client')
    await act(async () => root.unmount())
  })

  test('an abandoned suspended render starts no loading timer', async () => {
    const request = deferred<null>()
    const resource = model({
      value: query({ initialData: null, queryFn: () => request.promise, slowLoadingMs: 10 }),
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ComwitProvider>
        <Suspense fallback={null}>{children}</Suspense>
      </ComwitProvider>
    )
    const view = renderHook(() => useModel(resource, (s) => s.value.suspend()), { wrapper })
    expect(vi.getTimerCount()).toBe(0)
    view.unmount()
    await act(async () => {
      request.resolve(null)
      await request.promise
    })
  })

  test('imperative server queries allocate no loading timers', async () => {
    vi.stubGlobal('window', undefined)
    const request = deferred<null>()
    const { value } = bind(
      query({ initialData: null, queryFn: () => request.promise, slowLoadingMs: 0 })
    )
    const result = value.query()
    expect(value.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    request.resolve(null)
    await result
  })

  test('plain local retains its existing state shape', () => {
    const source = local.collection<{ id: string }>({ key: 'plain', version: 1 })
    const descriptor = local({ source, initialData: [] })
    expect(descriptor.initialState).not.toHaveProperty('isSlowLoading')
    expect(descriptor).not.toHaveProperty('isSlowLoading')
  })
})
