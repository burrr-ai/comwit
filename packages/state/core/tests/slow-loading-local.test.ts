// @vitest-environment happy-dom
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { local, model } from '../src'
import { bindResourceState, createQueryBindingRegistry } from '../src/core/query'
import type { AnyResourceDescriptor } from '../src/core/query/types'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const source = local.collection<{ id: string }>({ key: 'slow-local', version: 1 })
let factory: IDBFactory
let database: string

function bind(descriptor: AnyResourceDescriptor, scope = 'one') {
  const resource = model({ value: descriptor })
  const registry = createQueryBindingRegistry({ local: { indexedDB: factory, database, scope } })
  const state = bindResourceState(
    resource.instance().proxy,
    resource.pluginBags.get('query')!,
    undefined,
    registry,
    resource.key
  ) as any
  return { value: state.value, registry }
}

beforeEach(() => {
  // Keep IndexedDB's native task queue; fake only the clock under test.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance', 'Date'] })
  factory = new IDBFactory()
  database = crypto.randomUUID()
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

test('a slow cache miss tracks IndexedDB restoration and the remote request as one interval', async () => {
  const request = deferred<{ id: string }[]>()
  const started = deferred<void>()
  const driver = vi.fn(() => {
    started.resolve()
    return request.promise
  })
  const { value } = bind(
    local.query({ source, initialData: [], queryFn: driver, slowLoadingMs: 500 })
  )
  const result = value.query()
  expect(value.isLoading).toBe(true)
  expect(value.isFetching).toBe(true)
  vi.advanceTimersByTime(400)
  // Allow the durable cache miss to finish without advancing the loading clock.
  await started.promise
  expect(value.isSlowLoading).toBe(false)
  vi.advanceTimersByTime(100)
  expect(value.isSlowLoading).toBe(true)
  request.resolve([])
  await result
  expect(value.isSuccess).toBe(true)
  expect(value.isSlowLoading).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
})

test.each(['fresh', 'stale'] as const)(
  'restores %s durable data without a slow background state',
  async (freshness) => {
    const seed = bind(
      local.query({ source, initialData: [], slowLoadingMs: 0, queryFn: () => [{ id: 'stored' }] })
    )
    await seed.value.query('a')
    const request = deferred<{ id: string }[]>()
    const restored = deferred<void>()
    const driver = vi.fn(() => {
      restored.resolve()
      return request.promise
    })
    const { value } = bind(
      local.query({
        source,
        initialData: [],
        queryFn: driver,
        staleTime: freshness === 'fresh' ? Infinity : 0,
        slowLoadingMs: 500,
      })
    )
    const result = value.query('a')
    if (freshness === 'fresh') {
      await result
      expect(driver).not.toHaveBeenCalled()
    } else {
      await restored.promise
      expect(value.isFetching).toBe(true)
    }
    expect(value.data).toEqual([{ id: 'stored' }])
    expect(value.isLoading).toBe(false)
    expect(value.isSlowLoading).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(value.isSlowLoading).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    if (freshness === 'stale') {
      const caught = result.catch(() => {})
      request.reject(new Error('offline'))
      await caught
      expect(value.isSuccess).toBe(true)
      expect(value.isError).toBe(true)
      expect(value.data).toEqual([{ id: 'stored' }])
      expect(value.isSlowLoading).toBe(false)
    }
  }
)

test('local.infinite restores cursor metadata without restoring slow loading', async () => {
  const descriptor = () =>
    local.infinite({
      source,
      initialData: [],
      slowLoadingMs: 0,
      staleTime: Infinity,
      queryFn: () => ({ data: [{ id: 'stored' }], cursor: 'next', hasMore: true }),
    })
  const first = bind(descriptor())
  await first.value.query()
  const second = bind(descriptor())
  await second.value.query()
  expect(second.value.data).toEqual([{ id: 'stored' }])
  expect(second.value.cursor).toBe('next')
  expect(second.value.isSlowLoading).toBe(false)
})

test('switching the resolved user scope resets a pending query even for the same argument', async () => {
  const identity = model({ user: 'one' })
  const identityStore = identity.instance()
  const privateSource = local.collection<{ id: string }>({
    key: 'private',
    version: 1,
    scope: ({ state }) => state(identity).user,
  })
  const first = deferred<{ id: string }[]>(),
    second = deferred<{ id: string }[]>()
  const firstStarted = deferred<void>(),
    secondStarted = deferred<void>()
  const driver = vi
    .fn()
    .mockImplementationOnce(() => {
      firstStarted.resolve()
      return first.promise
    })
    .mockImplementationOnce(() => {
      secondStarted.resolve()
      return second.promise
    })
  const { value, registry } = bind(
    local.query({ source: privateSource, initialData: [], queryFn: driver, slowLoadingMs: 500 })
  )
  registry.getModelState = () => identityStore.proxy
  const p1 = value.query('same')
  await firstStarted.promise
  vi.advanceTimersByTime(500)
  expect(value.isSlowLoading).toBe(true)
  identityStore.proxy.user = 'two'
  const p2 = value.query('same')
  expect(value.isSlowLoading).toBe(false)
  await secondStarted.promise
  first.resolve([{ id: 'old-user' }])
  await p1
  vi.advanceTimersByTime(499)
  expect(value.isSlowLoading).toBe(false)
  vi.advanceTimersByTime(1)
  expect(value.isSlowLoading).toBe(true)
  second.resolve([{ id: 'new-user' }])
  await p2
  expect(value.data).toEqual([{ id: 'new-user' }])
  expect(value.isSlowLoading).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
})
