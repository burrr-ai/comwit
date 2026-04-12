import { model } from '../src/core'
import {
  query,
  bindResourceState,
  createQueryBindingRegistry,
  keepPreviousData,
  type BoundSingleResourceState,
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

function createBound<TData>(opts: {
  initialData: TData
  queryFn: (...args: any[]) => any
  staleTime?: number
  gcTime?: number
  placeholderData?: any
}) {
  const m = model({
    resource: query({
      initialData: opts.initialData,
      queryFn: opts.queryFn,
      ...(opts.staleTime !== undefined ? { staleTime: opts.staleTime } : {}),
      ...(opts.gcTime !== undefined ? { gcTime: opts.gcTime } : {}),
      ...(opts.placeholderData !== undefined ? { placeholderData: opts.placeholderData } : {}),
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
  return bound.resource as BoundSingleResourceState<TData, any>
}

describe('query', () => {
  describe('Lifecycle', () => {
    it('should have correct initial state', () => {
      const bound = createBound({
        initialData: [] as string[],
        queryFn: vi.fn(),
      })

      expect(bound.data).toEqual([])
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
      expect(bound.isSuccess).toBe(false)
      expect(bound.isError).toBe(false)
      expect(bound.error).toBe(null)
    })

    it('should set isLoading and isFetching during fetch', async () => {
      const d = deferred<string[]>()
      const bound = createBound({
        initialData: [] as string[],
        queryFn: vi.fn().mockReturnValue(d.promise),
      })

      const promise = bound.query()

      expect(bound.isLoading).toBe(true)
      expect(bound.isFetching).toBe(true)

      d.resolve(['alice'])
      await promise

      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
    })

    it('should update state on successful query', async () => {
      const bound = createBound({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['alice', 'bob']),
      })

      await bound.query()

      expect(bound.data).toEqual(['alice', 'bob'])
      expect(bound.isSuccess).toBe(true)
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
      expect(bound.isError).toBe(false)
      expect(bound.error).toBe(null)
    })

    it('should update state on query error and re-throw', async () => {
      const bound = createBound({
        initialData: [] as string[],
        queryFn: vi.fn().mockRejectedValue(new Error('Network failure')),
      })

      await expect(bound.query()).rejects.toThrow('Network failure')

      expect(bound.isError).toBe(true)
      expect(bound.error).toBe('Network failure')
      expect(bound.isSuccess).toBe(false)
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
    })

    it('should set isLoading=false but isFetching=true on refetch after success', async () => {
      const d = deferred<string[]>()
      const queryFn = vi.fn().mockResolvedValueOnce(['first']).mockReturnValueOnce(d.promise)

      const bound = createBound({
        initialData: [] as string[],
        queryFn,
      })

      await bound.query()
      expect(bound.isSuccess).toBe(true)

      const refetchPromise = bound.refetch()

      // isLoading should be false because isSuccess is already true
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(true)

      d.resolve(['second'])
      await refetchPromise
    })
  })

  describe('Cache', () => {
    it('should return cached result within staleTime without calling queryFn again', async () => {
      const queryFn = vi.fn().mockResolvedValue(['alice'])
      const bound = createBound({
        initialData: [] as string[],
        queryFn,
        staleTime: 10_000,
      })

      await bound.query()
      expect(queryFn).toHaveBeenCalledTimes(1)

      await bound.query()
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(bound.data).toEqual(['alice'])
    })

    it('should call queryFn again after staleTime expires', async () => {
      const queryFn = vi.fn().mockResolvedValue(['alice'])
      const bound = createBound({
        initialData: [] as string[],
        queryFn,
        staleTime: 100,
      })

      await bound.query()
      expect(queryFn).toHaveBeenCalledTimes(1)

      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 200)

      await bound.query()
      expect(queryFn).toHaveBeenCalledTimes(2)

      vi.restoreAllMocks()
    })

    it('should bypass staleTime with force:true', async () => {
      const queryFn = vi.fn().mockResolvedValue(['alice'])
      const bound = createBound({
        initialData: [] as string[],
        queryFn,
        staleTime: 10_000,
      })

      await bound.query()
      expect(queryFn).toHaveBeenCalledTimes(1)

      await bound.query({ force: true })
      expect(queryFn).toHaveBeenCalledTimes(2)
    })

    it('should produce different cache keys for different args', async () => {
      const queryFn = vi
        .fn()
        .mockImplementation((arg: string) => Promise.resolve([`result-${arg}`]))
      const bound = createBound({
        initialData: [] as string[],
        queryFn,
        staleTime: 10_000,
      })

      await bound.query('a')
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(bound.data).toEqual(['result-a'])

      await bound.query('b')
      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(bound.data).toEqual(['result-b'])

      // Going back to 'a' should use cache
      await bound.query('a')
      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(bound.data).toEqual(['result-a'])
    })

    it('should clean up cache entries after gcTime on next query', async () => {
      const queryFn = vi
        .fn()
        .mockImplementation((arg: string) => Promise.resolve([`result-${arg}`]))
      const bound = createBound({
        initialData: [] as string[],
        queryFn,
        staleTime: 10_000,
        gcTime: 500,
      })

      await bound.query('a')
      expect(queryFn).toHaveBeenCalledTimes(1)

      // Simulate time passing beyond gcTime
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000)

      // Query 'b' triggers cleanup of expired 'a'
      await bound.query('b')
      expect(queryFn).toHaveBeenCalledTimes(2)

      // 'a' should have been gc'd, so querying 'a' again calls queryFn
      await bound.query('a')
      expect(queryFn).toHaveBeenCalledTimes(3)

      vi.restoreAllMocks()
    })
  })

  describe('Race condition', () => {
    it('should ignore late-resolving query when a newer query has started', async () => {
      const deferredA = deferred<string[]>()
      const deferredB = deferred<string[]>()

      const queryFn = vi
        .fn()
        .mockReturnValueOnce(deferredA.promise)
        .mockReturnValueOnce(deferredB.promise)

      const bound = createBound({
        initialData: [] as string[],
        queryFn,
      })

      const promiseA = bound.query('a')
      const promiseB = bound.query('b')

      // Resolve B first, then A
      deferredB.resolve(['bob'])
      await promiseB
      expect(bound.data).toEqual(['bob'])

      // Resolve A late — should be ignored due to fetchId mismatch
      deferredA.resolve(['alice'])
      await promiseA
      expect(bound.data).toEqual(['bob'])
    })
  })

  describe('refetch', () => {
    it('should do nothing if no prior query', async () => {
      const queryFn = vi.fn().mockResolvedValue(['data'])
      const bound = createBound({
        initialData: [] as string[],
        queryFn,
      })

      await bound.refetch()
      expect(queryFn).not.toHaveBeenCalled()
    })

    it('should re-execute last query after successful query', async () => {
      const queryFn = vi.fn().mockResolvedValueOnce(['first']).mockResolvedValueOnce(['second'])

      const bound = createBound({
        initialData: [] as string[],
        queryFn,
      })

      await bound.query('arg1')
      expect(bound.data).toEqual(['first'])

      await bound.refetch()
      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(bound.data).toEqual(['second'])
      // refetch uses the same arg
      expect(queryFn.mock.calls[1][0]).toBe('arg1')
    })
  })

  describe('set()', () => {
    it('should replace data with plain value and set isSuccess', () => {
      const bound = createBound({
        initialData: [] as string[],
        queryFn: vi.fn(),
      })

      bound.set(['new', 'data'])

      expect(bound.data).toEqual(['new', 'data'])
      expect(bound.isSuccess).toBe(true)
      expect(bound.isError).toBe(false)
      expect(bound.error).toBe(null)
    })

    it('should merge object with Object.assign', () => {
      const bound = createBound({
        initialData: 'initial',
        queryFn: vi.fn(),
      })

      bound.set({ data: 'updated', isError: false })

      expect(bound.data).toBe('updated')
      expect(bound.isError).toBe(false)
      expect(bound.isSuccess).toBe(true)
    })

    it('should update cache entry', async () => {
      const queryFn = vi.fn().mockResolvedValue('fetched')
      const bound = createBound({
        initialData: 'initial',
        queryFn,
        staleTime: 10_000,
      })

      await bound.query()
      expect(bound.data).toBe('fetched')

      bound.set('manual')
      expect(bound.data).toBe('manual')

      // Query again — should return cached (set) value without calling queryFn
      await bound.query()
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(bound.data).toBe('manual')
    })
  })

  describe('mergeResult', () => {
    it('should set data directly when queryFn returns plain value', async () => {
      const bound = createBound({
        initialData: '',
        queryFn: vi.fn().mockResolvedValue('hello'),
      })

      await bound.query()
      expect(bound.data).toBe('hello')
    })

    it('should Object.assign when queryFn returns {data: value}', async () => {
      const bound = createBound({
        initialData: '',
        queryFn: vi.fn().mockResolvedValue({ data: 'world' }),
      })

      await bound.query()
      expect(bound.data).toBe('world')
    })

    it('should set data directly when queryFn returns array', async () => {
      const bound = createBound({
        initialData: [] as number[],
        queryFn: vi.fn().mockResolvedValue([1, 2, 3]),
      })

      await bound.query()
      expect(bound.data).toEqual([1, 2, 3])
    })

    it('should not change data when queryFn returns undefined', async () => {
      const bound = createBound({
        initialData: 'original',
        queryFn: vi.fn().mockResolvedValue(undefined),
      })

      await bound.query()
      expect(bound.data).toBe('original')
    })
  })

  describe('placeholderData', () => {
    it('should show static placeholderData while loading', async () => {
      const d = deferred<string[]>()
      const bound = createBound({
        initialData: [] as string[],
        queryFn: vi.fn().mockReturnValue(d.promise),
        placeholderData: ['placeholder'],
      })

      const promise = bound.query()
      expect(bound.data).toEqual(['placeholder'])
      expect(bound.isLoading).toBe(true)

      d.resolve(['real'])
      await promise
      expect(bound.data).toEqual(['real'])
    })

    it('should call function placeholderData with (arg, previousData)', async () => {
      const d = deferred<string>()
      const placeholderFn = vi.fn((_arg: any, prev: string) => `loading-${prev}`)
      const bound = createBound({
        initialData: 'init',
        queryFn: vi.fn().mockReturnValue(d.promise),
        placeholderData: placeholderFn,
      })

      const promise = bound.query('myArg')

      expect(placeholderFn).toHaveBeenCalledWith('myArg', 'init')
      expect(bound.data).toBe('loading-init')

      d.resolve('done')
      await promise
    })

    it('keepPreviousData should return previousData', () => {
      const result = keepPreviousData('anyArg', 'previousValue')
      expect(result).toBe('previousValue')
    })

    it('should use keepPreviousData as placeholderData', async () => {
      const queryFn = vi.fn().mockResolvedValueOnce('first')

      const d = deferred<string>()
      queryFn.mockReturnValueOnce(d.promise)

      const bound = createBound({
        initialData: 'init',
        queryFn,
        placeholderData: keepPreviousData,
      })

      await bound.query('a')
      expect(bound.data).toBe('first')

      const promise = bound.query('b')
      // keepPreviousData should keep 'first' as placeholder
      expect(bound.data).toBe('first')

      d.resolve('second')
      await promise
      expect(bound.data).toBe('second')
    })
  })

  describe('Arg change reset behavior', () => {
    it('Case 1: without keepPreviousData, changing arg resets data to initialData and sets isLoading=true', async () => {
      const dA = deferred<string>()
      const dB = deferred<string>()
      const queryFn = vi.fn().mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise)

      const bound = createBound({
        initialData: 'init',
        queryFn,
      })

      // query('a') succeeds
      const promiseA = bound.query('a')
      expect(bound.isLoading).toBe(true)
      expect(bound.isFetching).toBe(true)
      dA.resolve('resultA')
      await promiseA
      expect(bound.data).toBe('resultA')
      expect(bound.isLoading).toBe(false)
      expect(bound.isSuccess).toBe(true)

      // query('b') called — data should reset to initialData, isLoading=true
      const promiseB = bound.query('b')
      expect(bound.data).toBe('init')
      expect(bound.isLoading).toBe(true)
      expect(bound.isFetching).toBe(true)
      expect(bound.isSuccess).toBe(false)

      dB.resolve('resultB')
      await promiseB
      expect(bound.data).toBe('resultB')
      expect(bound.isLoading).toBe(false)
      expect(bound.isSuccess).toBe(true)
    })

    it('Case 2: with keepPreviousData, changing arg keeps previous data and sets isFetching=true', async () => {
      const dA = deferred<string>()
      const dB = deferred<string>()
      const queryFn = vi.fn().mockReturnValueOnce(dA.promise).mockReturnValueOnce(dB.promise)

      const bound = createBound({
        initialData: 'init',
        queryFn,
        placeholderData: keepPreviousData,
      })

      // query('a') succeeds
      const promiseA = bound.query('a')
      dA.resolve('resultA')
      await promiseA
      expect(bound.data).toBe('resultA')
      expect(bound.isLoading).toBe(false)
      expect(bound.isSuccess).toBe(true)

      // query('b') called — previous data kept, isLoading=false, isFetching=true
      const promiseB = bound.query('b')
      expect(bound.data).toBe('resultA')
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(true)

      dB.resolve('resultB')
      await promiseB
      expect(bound.data).toBe('resultB')
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
    })

    it('Case 3: same arg refetch keeps data regardless of keepPreviousData', async () => {
      const dRefetch = deferred<string>()
      const queryFn = vi.fn().mockResolvedValueOnce('resultA').mockReturnValueOnce(dRefetch.promise)

      const bound = createBound({
        initialData: 'init',
        queryFn,
      })

      // query('a') succeeds
      await bound.query('a')
      expect(bound.data).toBe('resultA')
      expect(bound.isSuccess).toBe(true)

      // refetch() — data stays, isLoading=false, isFetching=true
      const refetchPromise = bound.refetch()
      expect(bound.data).toBe('resultA')
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(true)

      dRefetch.resolve('resultA-refreshed')
      await refetchPromise
      expect(bound.data).toBe('resultA-refreshed')
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
    })

    it('Case 3 with keepPreviousData: same arg refetch keeps data', async () => {
      const dRefetch = deferred<string>()
      const queryFn = vi.fn().mockResolvedValueOnce('resultA').mockReturnValueOnce(dRefetch.promise)

      const bound = createBound({
        initialData: 'init',
        queryFn,
        placeholderData: keepPreviousData,
      })

      await bound.query('a')
      expect(bound.data).toBe('resultA')

      const refetchPromise = bound.refetch()
      expect(bound.data).toBe('resultA')
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(true)

      dRefetch.resolve('resultA-refreshed')
      await refetchPromise
      expect(bound.data).toBe('resultA-refreshed')
    })
  })

  describe('Frozen state regression (#35)', () => {
    it('should not throw on second query() call when data is an array', async () => {
      let callCount = 0
      const bound = createBound({
        initialData: [] as string[],
        queryFn: vi.fn().mockImplementation(() => {
          callCount++
          return Promise.resolve([`item-${callCount}`])
        }),
      })

      await bound.query()
      expect(bound.data).toEqual(['item-1'])

      // Second call should NOT throw "Cannot assign to read only property"
      await bound.query({ force: true })
      expect(bound.data).toEqual(['item-2'])
    })

    it('should not throw on second query() call when data is a nested object', async () => {
      let callCount = 0
      const bound = createBound({
        initialData: { items: [] as string[], total: 0 },
        queryFn: vi.fn().mockImplementation(() => {
          callCount++
          return Promise.resolve({ data: { items: [`item-${callCount}`], total: callCount } })
        }),
      })

      await bound.query()
      expect(bound.data).toEqual({ items: ['item-1'], total: 1 })

      await bound.query({ force: true })
      expect(bound.data).toEqual({ items: ['item-2'], total: 2 })
    })
  })
})
