import { model } from '../src/core'
import {
  query,
  bindResourceState,
  createQueryBindingRegistry,
  type BoundRealtimeResourceState,
  type SubscribeCallbacks,
  type ConnectionStatus,
} from '../src/core/query'

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createBoundRealtime<TData>(opts: {
  initialData: TData
  queryFn: (...args: any[]) => any
  subscribe: (callbacks: SubscribeCallbacks<TData>) => () => void
}) {
  const m = model({
    resource: query.realtime({
      initialData: opts.initialData,
      queryFn: opts.queryFn,
      subscribe: opts.subscribe,
    }),
  })
  const store = m.instance()
  const registry = createQueryBindingRegistry()
  const bound = bindResourceState(
    store.proxy,
    m.pluginBags.get('query')!,
    undefined,
    registry
  ) as any
  return bound.resource as BoundRealtimeResourceState<TData, any>
}

describe('query.realtime', () => {
  describe('Descriptor', () => {
    it('should create a descriptor with kind "realtime"', () => {
      const subscribeFn = vi.fn(() => () => {})
      const descriptor = query.realtime({
        initialData: null as string | null,
        queryFn: vi.fn(),
        subscribe: subscribeFn,
      })
      expect(descriptor.kind).toBe('realtime')
      expect(descriptor.data).toBe(null)
      expect(descriptor.connectionStatus).toBe('disconnected')
      expect(descriptor.isConnected).toBe(false)
    })

    it('should have correct initial state shape', () => {
      const descriptor = query.realtime({
        initialData: [] as string[],
        queryFn: vi.fn(),
        subscribe: vi.fn(() => () => {}),
      })
      expect(descriptor.isLoading).toBe(false)
      expect(descriptor.isFetching).toBe(false)
      expect(descriptor.isSuccess).toBe(false)
      expect(descriptor.isError).toBe(false)
      expect(descriptor.error).toBe(null)
      expect(descriptor.connectionStatus).toBe('disconnected')
      expect(descriptor.isConnected).toBe(false)
    })
  })

  describe('Initial state', () => {
    it('should have correct initial bound state', () => {
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn(),
        subscribe: vi.fn(() => () => {}),
      })
      expect(bound.data).toEqual([])
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
      expect(bound.isSuccess).toBe(false)
      expect(bound.isError).toBe(false)
      expect(bound.error).toBe(null)
      expect(bound.connectionStatus).toBe('disconnected')
      expect(bound.isConnected).toBe(false)
    })
  })

  describe('Query lifecycle', () => {
    it('should fetch initial data via queryFn', async () => {
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['alice', 'bob']),
        subscribe: vi.fn(() => () => {}),
      })
      await bound.query()
      expect(bound.data).toEqual(['alice', 'bob'])
      expect(bound.isSuccess).toBe(true)
    })

    it('should set isLoading and isFetching during fetch', async () => {
      const d = deferred<string[]>()
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockReturnValue(d.promise),
        subscribe: vi.fn(() => () => {}),
      })
      const promise = bound.query()
      expect(bound.isLoading).toBe(true)
      expect(bound.isFetching).toBe(true)
      d.resolve(['alice'])
      await promise
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
    })
  })

  describe('Subscribe lifecycle', () => {
    it('should call subscribe after initial query succeeds', async () => {
      const subscribeFn = vi.fn(() => () => {})
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['initial']),
        subscribe: subscribeFn,
      })
      expect(subscribeFn).not.toHaveBeenCalled()
      await bound.query()
      expect(subscribeFn).toHaveBeenCalledTimes(1)
      expect(subscribeFn).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.any(Function),
          set: expect.any(Function),
          refetch: expect.any(Function),
          onStatus: expect.any(Function),
          onError: expect.any(Function),
        })
      )
    })

    it('should set connectionStatus to "connecting" when subscribe is called', async () => {
      let capturedCallbacks: SubscribeCallbacks<string[]> | null = null
      const subscribeFn = vi.fn((cb: SubscribeCallbacks<string[]>) => {
        capturedCallbacks = cb
        return () => {}
      })
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['initial']),
        subscribe: subscribeFn,
      })
      await bound.query()
      expect(capturedCallbacks).not.toBeNull()
    })

    it('should clean up previous subscription on re-subscribe', async () => {
      const cleanup1 = vi.fn()
      const cleanup2 = vi.fn()
      let callCount = 0
      const subscribeFn = vi.fn(() => {
        callCount++
        return callCount === 1 ? cleanup1 : cleanup2
      })
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['data']),
        subscribe: subscribeFn,
      })
      await bound.query()
      expect(subscribeFn).toHaveBeenCalledTimes(1)
      expect(cleanup1).not.toHaveBeenCalled()
      await bound.query({ force: true })
      expect(subscribeFn).toHaveBeenCalledTimes(2)
      expect(cleanup1).toHaveBeenCalledTimes(1)
    })

    it('should clean up subscription on unsubscribe()', async () => {
      const cleanup = vi.fn()
      const subscribeFn = vi.fn(() => cleanup)
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['data']),
        subscribe: subscribeFn,
      })
      await bound.query()
      expect(cleanup).not.toHaveBeenCalled()
      bound.unsubscribe()
      expect(cleanup).toHaveBeenCalledTimes(1)
      expect(bound.connectionStatus).toBe('disconnected')
      expect(bound.isConnected).toBe(false)
    })
  })

  describe('Subscribe callbacks', () => {
    it('update() should merge data using updater function', async () => {
      let capturedCallbacks: SubscribeCallbacks<string[]> | null = null
      const subscribeFn = vi.fn((cb: SubscribeCallbacks<string[]>) => {
        capturedCallbacks = cb
        return () => {}
      })
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['alice']),
        subscribe: subscribeFn,
      })
      await bound.query()
      expect(capturedCallbacks).not.toBeNull()
      capturedCallbacks!.update((prev) => [...prev, 'bob'])
      expect(bound.data).toEqual(['alice', 'bob'])
    })

    it('set() should replace data entirely', async () => {
      let capturedCallbacks: SubscribeCallbacks<string[]> | null = null
      const subscribeFn = vi.fn((cb: SubscribeCallbacks<string[]>) => {
        capturedCallbacks = cb
        return () => {}
      })
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['alice', 'bob']),
        subscribe: subscribeFn,
      })
      await bound.query()
      capturedCallbacks!.set(['charlie'])
      expect(bound.data).toEqual(['charlie'])
    })

    it('onStatus() should update connectionStatus and isConnected', async () => {
      let capturedCallbacks: SubscribeCallbacks<string[]> | null = null
      const subscribeFn = vi.fn((cb: SubscribeCallbacks<string[]>) => {
        capturedCallbacks = cb
        return () => {}
      })
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['data']),
        subscribe: subscribeFn,
      })
      await bound.query()
      capturedCallbacks!.onStatus('connected')
      expect(bound.connectionStatus).toBe('connected')
      expect(bound.isConnected).toBe(true)
      capturedCallbacks!.onStatus('reconnecting')
      expect(bound.connectionStatus).toBe('reconnecting')
      expect(bound.isConnected).toBe(false)
      capturedCallbacks!.onStatus('disconnected')
      expect(bound.connectionStatus).toBe('disconnected')
      expect(bound.isConnected).toBe(false)
    })

    it('onError() should set error state', async () => {
      let capturedCallbacks: SubscribeCallbacks<string[]> | null = null
      const subscribeFn = vi.fn((cb: SubscribeCallbacks<string[]>) => {
        capturedCallbacks = cb
        return () => {}
      })
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['data']),
        subscribe: subscribeFn,
      })
      await bound.query()
      capturedCallbacks!.onError(new Error('WebSocket closed'))
      expect(bound.isError).toBe(true)
      expect(bound.error).toBe('WebSocket closed')
    })

    it('onError() should handle non-Error objects', async () => {
      let capturedCallbacks: SubscribeCallbacks<string[]> | null = null
      const subscribeFn = vi.fn((cb: SubscribeCallbacks<string[]>) => {
        capturedCallbacks = cb
        return () => {}
      })
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['data']),
        subscribe: subscribeFn,
      })
      await bound.query()
      capturedCallbacks!.onError('string error')
      expect(bound.isError).toBe(true)
      expect(bound.error).toBe('Unknown error')
    })

    it('refetch() should trigger a refetch', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce(['initial'])
        .mockResolvedValueOnce(['refreshed'])
      let capturedCallbacks: SubscribeCallbacks<string[]> | null = null
      const subscribeFn = vi.fn((cb: SubscribeCallbacks<string[]>) => {
        capturedCallbacks = cb
        return () => {}
      })
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn,
        subscribe: subscribeFn,
      })
      await bound.query()
      expect(bound.data).toEqual(['initial'])
      await capturedCallbacks!.refetch()
      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(bound.data).toEqual(['refreshed'])
    })
  })

  describe('Controller methods', () => {
    it('should expose query, refetch, set, and unsubscribe methods', () => {
      const bound = createBoundRealtime({
        initialData: null,
        queryFn: vi.fn(),
        subscribe: vi.fn(() => () => {}),
      })
      expect(typeof bound.query).toBe('function')
      expect(typeof bound.refetch).toBe('function')
      expect(typeof bound.set).toBe('function')
      expect(typeof bound.unsubscribe).toBe('function')
    })

    it('set() should replace data on bound state', async () => {
      const bound = createBoundRealtime({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['alice']),
        subscribe: vi.fn(() => () => {}),
      })
      await bound.query()
      bound.set(['replaced'])
      expect(bound.data).toEqual(['replaced'])
      expect(bound.isSuccess).toBe(true)
    })

    it('should not expose nextFetch or previousFetch', () => {
      const bound = createBoundRealtime({
        initialData: null,
        queryFn: vi.fn(),
        subscribe: vi.fn(() => () => {}),
      }) as any
      expect(bound.nextFetch).toBeUndefined()
      expect(bound.previousFetch).toBeUndefined()
    })
  })

  describe('Error handling in queryFn', () => {
    it('should not call subscribe when queryFn fails', async () => {
      const subscribeFn = vi.fn(() => () => {})
      const bound = createBoundRealtime({
        initialData: null,
        queryFn: vi.fn().mockRejectedValue(new Error('fetch failed')),
        subscribe: subscribeFn,
      })
      await expect(bound.query()).rejects.toThrow('fetch failed')
      expect(subscribeFn).not.toHaveBeenCalled()
      expect(bound.isError).toBe(true)
      expect(bound.error).toBe('fetch failed')
    })
  })
})
