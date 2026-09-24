import { describe, it, expect, vi, afterEach } from 'vitest'
import { model } from '../src/core'
import {
  query,
  bindResourceState,
  createQueryBindingRegistry,
  type BoundSingleResourceState,
  type ResourceDescriptorMap,
} from '../src/core/query'

function flush(ms = 10) {
  return new Promise((r) => setTimeout(r, ms))
}

function createBoundModel<T extends object>(initial: T) {
  const m = model(initial)
  const store = m.instance()
  const registry = createQueryBindingRegistry()
  const descriptors = m.pluginBags.get('query')! as ResourceDescriptorMap
  const bound = bindResourceState(store.proxy, descriptors, undefined, registry)
  return { bound, proxy: store.proxy, descriptors, registry }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('enabled option', () => {
  it('does not fire query when enabled returns false', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data')
    const { bound } = createBoundModel({
      flag: false,
      resource: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        enabled: (s: { flag: boolean }) => s.flag,
      }),
    })

    const res = bound.resource as unknown as BoundSingleResourceState<string | null>
    await res.query()
    await flush()

    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('fires query when enabled returns true', async () => {
    const fetchFn = vi.fn().mockResolvedValue('hello')
    const { bound } = createBoundModel({
      flag: true,
      resource: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        enabled: (s: { flag: boolean }) => s.flag,
      }),
    })

    const res = bound.resource as unknown as BoundSingleResourceState<string | null>
    await res.query()
    await flush()

    expect(fetchFn).toHaveBeenCalledOnce()
    expect(res.data).toBe('hello')
  })

  it('fires when enabled condition changes based on state', async () => {
    const fetchFn = vi.fn().mockResolvedValue('fetched')
    const { bound, proxy } = createBoundModel({
      userId: null as string | null,
      profile: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        enabled: (s: { userId: string | null }) => s.userId !== null,
      }),
    })

    const res = bound.profile as unknown as BoundSingleResourceState<string | null>

    // userId is null, should not fire
    await res.query()
    await flush()
    expect(fetchFn).not.toHaveBeenCalled()

    // Set userId, re-query
    proxy.userId = 'user-1'
    await res.query()
    await flush()
    expect(fetchFn).toHaveBeenCalledOnce()
  })
})

describe('dependsOn option', () => {
  it('blocks query when parent resource has no data (isSuccess false)', async () => {
    const childFetch = vi.fn().mockResolvedValue('child')
    const { bound } = createBoundModel({
      parent: query({
        initialData: null as string | null,
        queryFn: () => Promise.resolve('parent-data'),
      }),
      child: query({
        initialData: null as string | null,
        queryFn: childFetch,
        dependsOn: (s: any) => s.parent,
      }),
    })

    const child = bound.child as unknown as BoundSingleResourceState<string | null>

    // Parent hasn't been queried yet (isSuccess = false)
    await child.query()
    await flush()
    expect(childFetch).not.toHaveBeenCalled()
  })

  it('fires after parent resolves', async () => {
    const childFetch = vi.fn().mockResolvedValue('child-data')
    const { bound } = createBoundModel({
      parent: query({
        initialData: null as string | null,
        queryFn: () => Promise.resolve('parent-data'),
      }),
      child: query({
        initialData: null as string | null,
        queryFn: childFetch,
        dependsOn: (s: any) => s.parent,
      }),
    })

    const parent = bound.parent as unknown as BoundSingleResourceState<string | null>
    const child = bound.child as unknown as BoundSingleResourceState<string | null>

    // Resolve parent first
    await parent.query()
    await flush()
    expect(parent.isSuccess).toBe(true)

    // Now child should fire
    await child.query()
    await flush()
    expect(childFetch).toHaveBeenCalledOnce()
    expect(child.data).toBe('child-data')
  })

  it('blocks when dependsOn returns null', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data')
    const { bound } = createBoundModel({
      selectedId: null as string | null,
      detail: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        dependsOn: (s: { selectedId: string | null }) => s.selectedId,
      }),
    })

    const detail = bound.detail as unknown as BoundSingleResourceState<string | null>
    await detail.query()
    await flush()
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('allows when dependsOn returns truthy', async () => {
    const fetchFn = vi.fn().mockResolvedValue('loaded')
    const { bound } = createBoundModel({
      selectedId: 'abc' as string | null,
      detail: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        dependsOn: (s: { selectedId: string | null }) => s.selectedId,
      }),
    })

    const detail = bound.detail as unknown as BoundSingleResourceState<string | null>
    await detail.query()
    await flush()
    expect(fetchFn).toHaveBeenCalledOnce()
    expect(detail.data).toBe('loaded')
  })
})

describe('refetchInterval option', () => {
  it('polls at a static interval', async () => {
    let count = 0
    const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(`data-${++count}`))

    const { bound } = createBoundModel({
      resource: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        refetchInterval: 30,
      }),
    })

    const res = bound.resource as unknown as BoundSingleResourceState<string | null>
    await res.query()
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Wait for at least one interval tick
    await flush(80)

    expect(fetchFn.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('does not poll when refetchInterval is false', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data')

    const { bound } = createBoundModel({
      resource: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        refetchInterval: false,
      }),
    })

    const res = bound.resource as unknown as BoundSingleResourceState<string | null>
    await res.query()
    expect(fetchFn).toHaveBeenCalledTimes(1)

    await flush(100)

    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('supports dynamic interval that can stop', async () => {
    let count = 0
    const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(`data-${++count}`))

    const { bound } = createBoundModel({
      resource: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        refetchInterval: (data: string | null) => {
          // Stop polling once we have data-2
          if (data === 'data-2') return false
          return 30
        },
      }),
    })

    const res = bound.resource as unknown as BoundSingleResourceState<string | null>
    await res.query()
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Wait for first interval tick
    await flush(60)
    expect(fetchFn).toHaveBeenCalledTimes(2)

    // After data-2, interval should stop
    await flush(120)

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('cleans up interval on new query', async () => {
    let count = 0
    const fetchFn = vi.fn().mockImplementation(() => Promise.resolve(`data-${++count}`))

    const { bound } = createBoundModel({
      resource: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        refetchInterval: 50,
      }),
    })

    const res = bound.resource as unknown as BoundSingleResourceState<string | null>
    await res.query()
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Re-query should clear old interval and set up new one
    await res.query({ force: true })
    expect(fetchFn).toHaveBeenCalledTimes(2)

    await flush(80)

    // Should only have one more call (not two intervals stacking)
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  it('passes error to dynamic interval function', async () => {
    let callCount = 0
    const fetchFn = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve('ok')
      return Promise.reject(new Error('fail'))
    })

    const intervalFn = vi.fn().mockImplementation((_data: unknown, error?: Error) => {
      if (error) return false
      return 30
    })

    const { bound } = createBoundModel({
      resource: query({
        initialData: null as string | null,
        queryFn: fetchFn,
        refetchInterval: intervalFn,
      }),
    })

    const res = bound.resource as unknown as BoundSingleResourceState<string | null>
    await res.query()
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Wait for interval tick that triggers failing refetch
    await flush(80)

    // intervalFn should have been called with error
    const lastCall = intervalFn.mock.calls[intervalFn.mock.calls.length - 1]
    expect(lastCall[1]).toBeInstanceOf(Error)
  })
})
