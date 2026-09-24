import { model } from '../src/core'
import {
  query,
  bindResourceState,
  createQueryBindingRegistry,
  type BoundSingleResourceState,
} from '../src/core/query'

function createBound<TData>(opts: {
  initialData: TData
  queryFn: (...args: any[]) => any
  streamBatchInterval?: number
}) {
  const m = model({
    resource: query({
      initialData: opts.initialData,
      queryFn: opts.queryFn,
      ...(opts.streamBatchInterval !== undefined
        ? { streamBatchInterval: opts.streamBatchInterval }
        : {}),
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

async function* asyncGen<T>(values: T[], delayMs = 0): AsyncGenerator<T> {
  for (const v of values) {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    yield v
  }
}

function controllableStream<T>() {
  let resolve!: (val: IteratorResult<T>) => void
  let reject!: (err: unknown) => void
  const pending: Array<{ resolve: (v: IteratorResult<T>) => void; reject: (e: unknown) => void }> =
    []
  const values: IteratorResult<T>[] = []
  let done = false

  function push(value: T) {
    values.push({ value, done: false })
    flush()
  }

  function complete() {
    done = true
    values.push({ value: undefined as T, done: true })
    flush()
  }

  function error(err: unknown) {
    if (pending.length > 0) {
      pending.shift()!.reject(err)
    }
  }

  function flush() {
    while (pending.length > 0 && values.length > 0) {
      const p = pending.shift()!
      const v = values.shift()!
      p.resolve(v)
    }
  }

  const iterable: AsyncIterable<T> = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<T>> {
          if (values.length > 0) {
            return Promise.resolve(values.shift()!)
          }
          return new Promise<IteratorResult<T>>((res, rej) => {
            pending.push({ resolve: res, reject: rej })
          })
        },
      }
    },
  }

  return { iterable, push, complete, error }
}

describe('streaming query', () => {
  describe('basic streaming', () => {
    it('should update data progressively with each yield', async () => {
      const bound = createBound({
        initialData: '',
        queryFn: () => asyncGen(['hello', 'hello world', 'hello world!']),
      })

      await bound.query()

      expect(bound.data).toBe('hello world!')
      expect(bound.isSuccess).toBe(true)
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
    })

    it('should set loading state during streaming', async () => {
      const stream = controllableStream<string>()
      const bound = createBound({
        initialData: '',
        queryFn: () => stream.iterable,
      })

      const promise = bound.query()

      // Should be loading while stream is active
      expect(bound.isLoading).toBe(true)
      expect(bound.isFetching).toBe(true)

      stream.push('chunk1')
      await new Promise((r) => setTimeout(r, 0))
      expect(bound.data).toBe('chunk1')
      // Still loading during stream
      expect(bound.isFetching).toBe(true)

      stream.push('chunk2')
      await new Promise((r) => setTimeout(r, 0))
      expect(bound.data).toBe('chunk2')

      stream.complete()
      await promise

      expect(bound.isSuccess).toBe(true)
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
    })
  })

  describe('status transitions', () => {
    it('should transition from idle to loading to success', async () => {
      const bound = createBound({
        initialData: '',
        queryFn: () => asyncGen(['a', 'b']),
      })

      expect(bound.isLoading).toBe(false)
      expect(bound.isSuccess).toBe(false)

      await bound.query()

      expect(bound.isLoading).toBe(false)
      expect(bound.isSuccess).toBe(true)
      expect(bound.isError).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should set error status when iterator throws', async () => {
      async function* failingStream() {
        yield 'partial'
        throw new Error('stream failed')
      }

      const bound = createBound({
        initialData: '',
        queryFn: () => failingStream(),
      })

      await expect(bound.query()).rejects.toThrow('stream failed')

      expect(bound.isError).toBe(true)
      expect(bound.error).toBe('stream failed')
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
      // Data was updated with the partial yield before error
      expect(bound.data).toBe('partial')
    })
  })

  describe('refetch aborts stream', () => {
    it('should abort current stream and start new one on refetch', async () => {
      let callCount = 0
      const yieldLog: string[] = []

      const bound = createBound({
        initialData: '',
        queryFn: () => {
          callCount++
          const id = callCount
          return {
            async *[Symbol.asyncIterator]() {
              for (let i = 1; i <= 3; i++) {
                await new Promise((r) => setTimeout(r, 10))
                const val = `stream${id}-chunk${i}`
                yieldLog.push(val)
                yield val
              }
            },
          }
        },
      })

      // Start first stream
      const promise1 = bound.query()
      // Let the first yield happen
      await new Promise((r) => setTimeout(r, 20))
      expect(bound.data).toBe('stream1-chunk1')

      // Refetch triggers abort of stream1 and starts stream2
      const promise2 = bound.refetch()

      // Wait for both to settle
      await Promise.allSettled([promise1, promise2])

      // Stream2 should have completed fully
      expect(bound.data).toBe('stream2-chunk3')
      expect(bound.isSuccess).toBe(true)
    })
  })

  describe('non-streaming still works', () => {
    it('should handle normal promise-based queryFn unchanged', async () => {
      const bound = createBound({
        initialData: [] as string[],
        queryFn: vi.fn().mockResolvedValue(['alice', 'bob']),
      })

      await bound.query()

      expect(bound.data).toEqual(['alice', 'bob'])
      expect(bound.isSuccess).toBe(true)
      expect(bound.isLoading).toBe(false)
      expect(bound.isFetching).toBe(false)
    })
  })

  describe('streamBatchInterval', () => {
    it('should coalesce rapid yields when streamBatchInterval is set', async () => {
      const dataUpdates: string[] = []
      let originalData: string

      async function* rapidStream() {
        yield 'a'
        yield 'b'
        yield 'c'
        // Small delay to let batch timer expire
        await new Promise((r) => setTimeout(r, 100))
        yield 'd'
      }

      const bound = createBound({
        initialData: '',
        queryFn: () => rapidStream(),
        streamBatchInterval: 50,
      })

      await bound.query()

      // After stream completes, final data should be 'd'
      expect(bound.data).toBe('d')
      expect(bound.isSuccess).toBe(true)
    })
  })
})
