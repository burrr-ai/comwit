import { model } from '../src/core'
import { query, bindResourceState, createQueryBindingRegistry } from '../src/core/query'

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('query.infinite()', () => {
  describe('basic infinite query', () => {
    test('initial state has data=initialData, cursor=null, hasMore=false', () => {
      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn: vi.fn().mockResolvedValue({ data: ['a'], cursor: 'c1', hasMore: true }),
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

      expect(bound.feed.data).toEqual([])
      expect(bound.feed.cursor).toBeNull()
      expect(bound.feed.hasMore).toBe(false)
      expect(bound.feed.isLoading).toBe(false)
      expect(bound.feed.isFetching).toBe(false)
      expect(bound.feed.isSuccess).toBe(false)
      expect(bound.feed.isError).toBe(false)
      expect(bound.feed.error).toBeNull()
    })

    test('query() success updates data, cursor, and hasMore from result', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValue({ data: ['post1', 'post2'], cursor: 'c1', hasMore: true })
      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query()

      expect(bound.feed.data).toEqual(['post1', 'post2'])
      expect(bound.feed.cursor).toBe('c1')
      expect(bound.feed.hasMore).toBe(true)
      expect(bound.feed.isSuccess).toBe(true)
      expect(bound.feed.isLoading).toBe(false)
      expect(bound.feed.isFetching).toBe(false)
    })
  })

  describe('nextFetch', () => {
    test('nextFetch() appends data to existing array', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a', 'b'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['c', 'd'], cursor: 'c2', hasMore: true })

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query()
      expect(bound.feed.data).toEqual(['a', 'b'])

      await bound.feed.nextFetch()
      expect(bound.feed.data).toEqual(['a', 'b', 'c', 'd'])
    })

    test('nextFetch() updates cursor', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['b'], cursor: 'c2', hasMore: true })

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query()
      expect(bound.feed.cursor).toBe('c1')

      await bound.feed.nextFetch()
      expect(bound.feed.cursor).toBe('c2')
    })

    test('nextFetch() is ignored when hasMore=false', async () => {
      const queryFn = vi.fn().mockResolvedValueOnce({ data: ['a'], cursor: null, hasMore: false })

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query()
      expect(bound.feed.hasMore).toBe(false)

      const result = await bound.feed.nextFetch()
      expect(result).toBeUndefined()
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    test('nextFetch() uses last query arg if no arg provided', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['b'], cursor: 'c2', hasMore: false })

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query('topic-1')
      await bound.feed.nextFetch()

      expect(queryFn).toHaveBeenCalledTimes(2)
      expect(queryFn.mock.calls[1][0]).toBe('topic-1')
    })

    test('multiple nextFetch calls accumulate data', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a', 'b'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['c', 'd'], cursor: 'c2', hasMore: true })
        .mockResolvedValueOnce({ data: ['e'], cursor: null, hasMore: false })

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query()
      expect(bound.feed.data).toEqual(['a', 'b'])

      await bound.feed.nextFetch()
      expect(bound.feed.data).toEqual(['a', 'b', 'c', 'd'])

      await bound.feed.nextFetch()
      expect(bound.feed.data).toEqual(['a', 'b', 'c', 'd', 'e'])
      expect(bound.feed.hasMore).toBe(false)
      expect(bound.feed.cursor).toBeNull()
    })
  })

  describe('previousFetch', () => {
    test('previousFetch() pops cursorHistory and re-executes', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a', 'b'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['c', 'd'], cursor: 'c2', hasMore: true })
        .mockResolvedValueOnce({ data: ['prev-a', 'prev-b'], cursor: 'c1', hasMore: true })

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query()
      await bound.feed.nextFetch()

      await bound.feed.previousFetch()
      expect(queryFn).toHaveBeenCalledTimes(3)
      expect(bound.feed.data).toEqual(['prev-a', 'prev-b'])
    })

    test('previousFetch() returns lastResult when cursorHistory.length < 2', async () => {
      const lastResult = { data: ['a'], cursor: 'c1', hasMore: true }
      const queryFn = vi.fn().mockResolvedValueOnce(lastResult)

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query()

      const result = await bound.feed.previousFetch()
      expect(result).toEqual(lastResult)
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    test('previousFetch() with custom arg', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['b'], cursor: 'c2', hasMore: true })
        .mockResolvedValueOnce({ data: ['custom'], cursor: 'c-custom', hasMore: true })

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      await bound.feed.query('arg1')
      await bound.feed.nextFetch()

      await bound.feed.previousFetch('custom-arg')
      expect(queryFn.mock.calls[2][0]).toBe('custom-arg')
    })
  })

  describe('cursor history tracking', () => {
    function createBound(queryFn: ReturnType<typeof vi.fn>) {
      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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
      return { bound, store, registry, m }
    }

    function getCursorHistory(store: any, registry: any, m: any) {
      const state = store.proxy.feed
      const runtime = registry.boundResourceRuntime.get(state)
      if (!runtime?.activeKey) return []
      const entry = runtime.cacheEntries.get(runtime.activeKey)
      return entry?.cursorHistory ?? []
    }

    test('query() initializes cursorHistory', async () => {
      const queryFn = vi.fn().mockResolvedValueOnce({ data: ['a'], cursor: 'c1', hasMore: true })
      const { bound, store, registry, m } = createBound(queryFn)

      await bound.feed.query()

      const history = getCursorHistory(store, registry, m)
      expect(history.length).toBeGreaterThanOrEqual(1)
    })

    test('nextFetch() pushes to cursorHistory', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['b'], cursor: 'c2', hasMore: true })
      const { bound, store, registry, m } = createBound(queryFn)

      await bound.feed.query()
      const historyAfterQuery = getCursorHistory(store, registry, m)
      const lengthAfterQuery = historyAfterQuery.length

      await bound.feed.nextFetch()
      expect(historyAfterQuery.length).toBeGreaterThan(lengthAfterQuery)
    })

    test('previousFetch() pops from cursorHistory', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['b'], cursor: 'c2', hasMore: true })
        .mockResolvedValueOnce({ data: ['a-restored'], cursor: 'c1', hasMore: true })
      const { bound, store, registry, m } = createBound(queryFn)

      await bound.feed.query()
      await bound.feed.nextFetch()

      const historyAfterNext = getCursorHistory(store, registry, m)
      const lengthAfterNext = historyAfterNext.length

      await bound.feed.previousFetch()
      expect(historyAfterNext.length).toBeLessThan(lengthAfterNext)
    })

    test('re-query (replace mode) resets cursorHistory to length 1', async () => {
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ data: ['a'], cursor: 'c1', hasMore: true })
        .mockResolvedValueOnce({ data: ['b'], cursor: 'c2', hasMore: true })
        .mockResolvedValueOnce({ data: ['fresh'], cursor: 'c-new', hasMore: true })
      const { bound, store, registry, m } = createBound(queryFn)

      await bound.feed.query()
      await bound.feed.nextFetch()

      const historyBeforeRequery = getCursorHistory(store, registry, m)
      expect(historyBeforeRequery.length).toBeGreaterThan(1)

      await bound.feed.query({ force: true })

      const historyAfterRequery = getCursorHistory(store, registry, m)
      expect(historyAfterRequery.length).toBe(1)
    })
  })

  describe('loading states during fetch', () => {
    test('isLoading is true during first query, false during subsequent fetches', async () => {
      const d1 = deferred<{ data: string[]; cursor: string; hasMore: boolean }>()
      const queryFn = vi.fn().mockReturnValueOnce(d1.promise)

      const m = model({
        feed: query.infinite({
          initialData: [] as string[],
          queryFn,
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

      const promise = bound.feed.query()
      expect(bound.feed.isLoading).toBe(true)
      expect(bound.feed.isFetching).toBe(true)

      d1.resolve({ data: ['a'], cursor: 'c1', hasMore: true })
      await promise

      expect(bound.feed.isLoading).toBe(false)
      expect(bound.feed.isFetching).toBe(false)
      expect(bound.feed.isSuccess).toBe(true)
    })
  })
})
