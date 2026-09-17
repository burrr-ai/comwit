// @vitest-environment happy-dom
import React, { StrictMode } from 'react'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  action,
  ComwitProvider,
  create,
  model,
  query,
  searchParam,
  useAction,
  useModel,
} from '../src'
import {
  createBrowserRouterAdapter,
  type RouterAdapter,
  type RouterHistory,
  type RouterNavigateOptions,
} from '../src/core/router'
import { useStoreRegistry } from '../src/core/provider'

function memoryRouter(initial: string | null) {
  let href = initial
  let index = 0
  const entries = [initial]
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  return {
    getSnapshot: () => href,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    navigate: vi.fn((next: string, { history }: RouterNavigateOptions) => {
      href = next
      if (history === 'push') entries.splice(++index, entries.length, next)
      else entries[index] = next
      emit()
    }),
    external(next: string | null, notify = true) {
      href = next
      if (notify) emit()
    },
    back() {
      if (index > 0) href = entries[--index]
      emit()
    },
    forward() {
      if (index < entries.length - 1) href = entries[++index]
      emit()
    },
    get listeners() {
      return listeners.size
    },
    get length() {
      return entries.length
    },
  }
}
function Transport({ router, children }: { router: RouterAdapter; children: React.ReactNode }) {
  useStoreRegistry().router = router
  return <>{children}</>
}
function wrapper(router: RouterAdapter, strict = false) {
  return ({ children }: { children: React.ReactNode }) => {
    const tree = (
      <ComwitProvider>
        <Transport router={router}>{children}</Transport>
      </ComwitProvider>
    )
    return strict ? <StrictMode>{tree}</StrictMode> : tree
  }
}
function setup(
  router = memoryRouter('/chat?thread=url&other=keep#message'),
  history?: RouterHistory,
  strict = false
) {
  const domain = model({ thread: searchParam({ key: 'thread', history }), unrelated: 0 })
  const factory = action(({ state }) => {
    const current = state(domain)
    return {
      select(value: string | null) {
        current.thread = value
      },
      unrelated() {
        current.unrelated++
      },
      read() {
        return searchParam.getSnapshot(current, 'thread')
      },
      set(value: string | null, options?: { history?: RouterHistory; ifRevision?: number }) {
        return searchParam.set(current, 'thread', value, options)
      },
    }
  })
  const hook = renderHook(
    () => ({
      actions: useAction<ReturnType<typeof factory>>([factory]),
      value: useModel(domain, (s) => s.thread),
      meta: useModel(domain, (s) => searchParam.getSnapshot(s, 'thread')),
    }),
    { wrapper: wrapper(router, strict) }
  )
  return { ...hook, domain, router }
}
async function flush() {
  await act(async () => {
    await Promise.resolve()
  })
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

describe('declarative searchParam fields', () => {
  test('ordinary model access initializes from URL before write-back, including Strict Mode', async () => {
    const { result, router, unmount } = setup(undefined, undefined, true)
    expect(result.current.value).toBe('url')
    expect(result.current.meta.ready).toBe(true)
    expect(router.listeners).toBe(1)
    await flush()
    expect(router.navigate).not.toHaveBeenCalled()
    unmount()
    expect(router.listeners).toBe(0)
  })

  test('ordinary action assignments default to replace without growing history', async () => {
    const { result, router } = setup()
    act(() => result.current.actions.select('one'))
    await flush()
    act(() => result.current.actions.select('two'))
    await flush()
    expect(router.length).toBe(1)
    expect(router.navigate.mock.calls.map(([, options]) => options.history)).toEqual([
      'replace',
      'replace',
    ])
    expect(router.getSnapshot()).toBe('/chat?thread=two&other=keep#message')
  })

  test('explicit push supports back/forward and a per-write replace override', async () => {
    const { result, router } = setup(memoryRouter('/chat?other=keep#message'), 'push')
    act(() => result.current.actions.set('latest', { history: 'replace' }))
    act(() => result.current.actions.select('chosen'))
    await flush()
    expect(router.length).toBe(2)
    expect(router.navigate.mock.calls.map(([, options]) => options.history)).toEqual([
      'replace',
      'push',
    ])
    act(() => router.back())
    expect(result.current.value).toBe('latest')
    act(() => router.forward())
    expect(result.current.value).toBe('chosen')
    await flush()
    expect(router.navigate).toHaveBeenCalledTimes(2)
  })

  test('one push override does not change the default replace mode', () => {
    const { result, router } = setup()
    act(() => result.current.actions.set('pushed', { history: 'push' }))
    act(() => result.current.actions.set('replaced'))
    expect(router.length).toBe(2)
    expect(router.navigate.mock.calls.map(([, options]) => options.history)).toEqual([
      'push',
      'replace',
    ])
  })

  test('same values, unrelated fields, and unrelated query/hash changes cause no echo', async () => {
    const { result, router, rerender } = setup()
    const original = result.current.meta
    rerender()
    expect(result.current.meta).toBe(original)
    act(() => {
      result.current.actions.unrelated()
      result.current.actions.select('url')
      result.current.actions.set('url')
    })
    act(() => router.external('/chat?thread=url&other=changed#new'))
    await flush()
    expect(result.current.meta).toBe(original)
    expect(router.navigate).not.toHaveBeenCalled()
  })

  test('null before URL availability is distinct from ready with a missing query', () => {
    const { result, router } = setup(memoryRouter(null))
    expect(result.current.meta).toMatchObject({ value: null, ready: false })
    expect(result.current.actions.set('too-early')).toBe(false)
    act(() => router.external('/chat'))
    expect(result.current.meta).toMatchObject({ value: null, ready: true })
  })

  test('stale queued writes lose to external navigation even before notification', async () => {
    const { result, router } = setup()
    act(() => {
      result.current.actions.select('obsolete')
      router.external('/next?thread=external&keep=x#hash', false)
    })
    await flush()
    expect(result.current.value).toBe('external')
    expect(router.navigate).not.toHaveBeenCalled()
  })

  test('a queued write rebases on unrelated URL edits and preserves repeated query values', async () => {
    const { result, router } = setup()
    act(() => {
      result.current.actions.select('selected')
      router.external('/chat?thread=url&tag=a&tag=b#new', false)
    })
    await flush()
    expect(router.getSnapshot()).toBe('/chat?thread=selected&tag=a&tag=b#new')
  })

  test('ifRevision rejects late normalization after navigation or another model selection', async () => {
    const { result, router } = setup()
    const first = result.current.meta.revision
    act(() => router.external('/chat?thread=new'))
    let accepted = true
    act(() => {
      accepted = result.current.actions.set('old', { ifRevision: first })
    })
    expect(accepted).toBe(false)
    const second = result.current.meta.revision
    act(() => result.current.actions.select('user'))
    act(() => {
      accepted = result.current.actions.set('late', { ifRevision: second })
    })
    expect(accepted).toBe(false)
    await flush()
    expect(router.getSnapshot()).toBe('/chat?thread=user')
    const third = result.current.meta.revision
    router.external('/chat?thread=unnotified', false)
    act(() => {
      accepted = result.current.actions.set('stale', { ifRevision: third })
    })
    expect(accepted).toBe(false)
  })

  test('unmount cancels pending writes and makes captured setters inactive', async () => {
    const { result, router, unmount } = setup()
    const actions = result.current.actions
    act(() => actions.select('queued'))
    unmount()
    expect(actions.set('late')).toBe(false)
    await flush()
    expect(router.navigate).not.toHaveBeenCalled()
    expect(router.listeners).toBe(0)
  })

  test('metadata is available through create() and selector snapshots are read-only', () => {
    const domain = model({ thread: searchParam({ key: 'thread' }) })
    const useDomain = create(domain, { actions: [] })
    const router = memoryRouter('/chat')
    const { result } = renderHook(() => useDomain(), { wrapper: wrapper(router) })
    const meta = searchParam.getSnapshot(result.current, 'thread')
    expect(meta).toMatchObject({ ready: true, value: null })
    expect(Object.isFrozen(meta)).toBe(true)
    expect(() => searchParam.set(result.current as any, 'thread', 'bad')).toThrow('action state')
  })

  test('search metadata and action writes coexist with query plugin state through create()', async () => {
    const queryFn = vi.fn(async (page: number) => [`page:${page}`])
    const domain = model({
      page: searchParam({ key: 'page', type: 'number', defaultValue: 1 }),
      rows: query<string[], number>({ initialData: [], queryFn }),
    })
    const factory = action(({ state }) => {
      const current = state(domain)
      return {
        load: () => current.rows.query(current.page),
        next: () => searchParam.set(current, 'page', current.page + 1),
      }
    })
    const useDomain = create(domain, { actions: [factory] })
    const router = memoryRouter('/list?page=2')
    const { result } = renderHook(
      () =>
        useDomain((s) => ({
          meta: searchParam.getSnapshot(s, 'page'),
          rows: s.rows.data,
          actions: s.actions,
        })),
      { wrapper: wrapper(router) }
    )
    expect(result.current.meta).toMatchObject({ ready: true, value: 2 })
    await act(async () => {
      await result.current.actions.load()
    })
    expect(result.current.rows).toEqual(['page:2'])
    act(() => {
      result.current.actions.next()
    })
    expect(result.current.meta.value).toBe(3)
    expect(router.getSnapshot()).toBe('/list?page=3')
  })

  test('action-only consumers and models first accessed in an event initialize automatically', async () => {
    const domain = model({ page: searchParam({ key: 'page', type: 'number', defaultValue: 1 }) })
    const factory = action(({ state }) => ({
      increment() {
        state(domain).page++
      },
    }))
    const router = memoryRouter('/list?page=5')
    const { result, unmount } = renderHook(() => useAction<ReturnType<typeof factory>>([factory]), {
      wrapper: wrapper(router),
    })
    expect(router.listeners).toBe(0)
    act(() => result.current.increment())
    await flush()
    expect(router.getSnapshot()).toBe('/list?page=6')
    expect(router.listeners).toBe(1)
    unmount()
    expect(router.listeners).toBe(0)
  })

  test('reactivation rejects async revisions captured before disposal', () => {
    const domain = model({ thread: searchParam({ key: 'thread' }) })
    const router = memoryRouter('/chat?thread=one')
    let current: any
    const factory = action(({ state }) => {
      const data = state(domain)
      return {
        get: () => searchParam.getSnapshot(data, 'thread'),
        set: (v: string, r: number) => searchParam.set(data, 'thread', v, { ifRevision: r }),
      }
    })
    function Consumer() {
      current = useAction([factory])
      useModel(domain, (s) => s.thread)
      return null
    }
    const tree = (visible: boolean) => (
      <ComwitProvider>
        <Transport router={router}>{visible && <Consumer />}</Transport>
      </ComwitProvider>
    )
    const view = render(tree(true))
    const old = current,
      revision = old.get().revision
    view.rerender(tree(false))
    expect(old.set('disposed', revision)).toBe(false)
    view.rerender(tree(true))
    expect(current.get().revision).toBeGreaterThan(revision)
    expect(old.set('stale', revision)).toBe(false)
  })

  test('multiple consumers share one connection and Providers keep separate model instances', () => {
    const domain = model({ thread: searchParam({ key: 'thread' }) })
    const first = memoryRouter('/a?thread=one'),
      second = memoryRouter('/b?thread=two')
    const values: Array<string | null> = []
    function View({ index }: { index: number }) {
      values[index] = useModel(domain, (s) => s.thread)
      return null
    }
    const view = render(
      <>
        <ComwitProvider>
          <Transport router={first}>
            <View index={0} />
            <View index={1} />
          </Transport>
        </ComwitProvider>
        <ComwitProvider>
          <Transport router={second}>
            <View index={2} />
          </Transport>
        </ComwitProvider>
      </>
    )
    expect(values).toEqual(['one', 'one', 'two'])
    expect(first.listeners).toBe(1)
    expect(second.listeners).toBe(1)
    view.unmount()
    expect(first.listeners + second.listeners).toBe(0)
  })

  test('nested declarations and batched field actions preserve each query key', async () => {
    const domain = model({
      filters: { page: searchParam({ key: 'page', type: 'number', defaultValue: 1 }) },
      thread: searchParam({ key: 'thread' }),
    })
    const factory = action(({ state }) => {
      const data = state(domain)
      return {
        change() {
          data.filters.page = 3
          data.thread = 'chosen'
        },
      }
    })
    const router = memoryRouter('/chat?page=2&thread=one&keep=x#hash')
    const { result } = renderHook(
      () => ({
        actions: useAction<ReturnType<typeof factory>>([factory]),
        value: useModel(domain, (s) => s.filters.page),
      }),
      { wrapper: wrapper(router) }
    )
    expect(result.current.value).toBe(2)
    act(() => result.current.actions.change())
    await flush()
    expect(router.getSnapshot()).toBe('/chat?page=3&thread=chosen&keep=x#hash')
  })
})

describe('primitive parsing and default priority', () => {
  test.each([
    ['?text=&page=12&enabled=false', '', 12, false],
    ['?text=url&page=-1.5&enabled=1', 'url', -1.5, true],
    ['?page=1e2&enabled=0', null, 100, false],
    ['?page=&enabled=maybe', null, null, null],
    ['?page=NaN&enabled=', null, null, null],
    ['?page=Infinity', null, null, null],
    ['?page=12abc', null, null, null],
    ['?page=0x10', null, null, null],
  ])('parses %s without truthiness or NaN coercion', (search, text, page, enabled) => {
    const domain = model({
      text: searchParam({ key: 'text' }),
      page: searchParam({ key: 'page', type: 'number' }),
      enabled: searchParam({ key: 'enabled', type: 'boolean' }),
    })
    const router = memoryRouter(`/list${search}`)
    const { result } = renderHook(() => useModel(domain, (s) => [s.text, s.page, s.enabled]), {
      wrapper: wrapper(router),
    })
    expect(result.current).toEqual([text, page, enabled])
    expect(router.navigate).not.toHaveBeenCalled()
  })

  test('valid URL values win; defaults only handle absent or invalid values without automatic writes', () => {
    const domain = model({
      page: searchParam({ key: 'page', type: 'number', defaultValue: 1 }),
      enabled: searchParam({ key: 'enabled', type: 'boolean', defaultValue: true }),
    })
    const router = memoryRouter('/list?page=0&enabled=false')
    const { result } = renderHook(() => useModel(domain, (s) => [s.page, s.enabled]), {
      wrapper: wrapper(router),
    })
    expect(result.current).toEqual([0, false])
    act(() => router.external('/list?page=bad'))
    expect(result.current).toEqual([1, true])
    expect(router.navigate).not.toHaveBeenCalled()
  })

  test('custom primitive parsers override decoding and retain default serialization', async () => {
    const domain = model({
      text: searchParam({ key: 'text', parse: (raw) => raw.trim().toLowerCase() }),
      page: searchParam({ key: 'page', type: 'number', defaultValue: 1, parse: Number }),
      enabled: searchParam({
        key: 'enabled',
        type: 'boolean',
        parse: (raw) => raw === 'yes' || raw === 'true',
      }),
    })
    const factory = action(({ state }) => {
      const current = state(domain)
      return {
        update() {
          current.text = 'next'
          current.page = 32
          current.enabled = false
        },
      }
    })
    const router = memoryRouter('/list?text=URL%20&page=0x10&enabled=yes&keep=x#heading')
    const { result } = renderHook(
      () => ({
        value: useModel(domain, (s) => [s.text, s.page, s.enabled]),
        actions: useAction<ReturnType<typeof factory>>([factory]),
      }),
      { wrapper: wrapper(router) }
    )
    expect(result.current.value).toEqual(['url', 16, true])
    expect(router.navigate).not.toHaveBeenCalled()
    act(() => result.current.actions.update())
    await flush()
    expect(router.getSnapshot()).toBe('/list?text=next&page=32&enabled=false&keep=x#heading')
    expect(router.length).toBe(1)
    act(() => router.external('/list?page=NaN'))
    expect(result.current.value).toEqual([null, 1, null])
  })

  test('custom codecs use fallback on malformed input and can explicitly canonicalize it', () => {
    const domain = model({
      value: searchParam<{ tag: string }>({
        key: 'filter',
        defaultValue: { tag: 'all' },
        parse: JSON.parse,
        serialize: JSON.stringify,
      }),
    })
    const factory = action(({ state }) => {
      const data = state(domain)
      return {
        normalize() {
          searchParam.set(data, 'value', data.value)
        },
      }
    })
    const router = memoryRouter('/list?filter=broken&keep=x')
    const { result } = renderHook(
      () => ({
        value: useModel(domain, (s) => s.value),
        actions: useAction<ReturnType<typeof factory>>([factory]),
      }),
      { wrapper: wrapper(router) }
    )
    expect(result.current.value).toEqual({ tag: 'all' })
    expect(router.navigate).not.toHaveBeenCalled()
    act(() => result.current.actions.normalize())
    expect(new URL(router.getSnapshot()!, 'https://test.invalid').searchParams.get('filter')).toBe(
      '{"tag":"all"}'
    )
  })
})

describe('internal native History API transport', () => {
  test('observes push/replace and navigation events and restores its methods after cleanup', async () => {
    const push = window.history.pushState,
      replace = window.history.replaceState
    const adapter = createBrowserRouterAdapter(),
      listener = vi.fn()
    const stop = adapter.subscribe(listener)
    window.history.pushState(null, '', '/chat?thread=one')
    await flush()
    window.history.replaceState(null, '', '/chat?thread=two')
    await flush()
    replace.call(window.history, null, '', '/chat?thread=back#hash')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await flush()
    expect(listener).toHaveBeenCalledTimes(3)
    stop()
    expect(window.history.pushState).toBe(push)
    expect(window.history.replaceState).toBe(replace)
  })

  test('native model selection replaces by default and explicit push adds exactly one entry', () => {
    window.history.replaceState(null, '', '/chat?thread=one&keep=x#hash')
    const domain = model({ thread: searchParam({ key: 'thread' }) })
    const factory = action(({ state }) => {
      const data = state(domain)
      return {
        select(v: string) {
          data.thread = v
        },
        push(v: string) {
          searchParam.set(data, 'thread', v, { history: 'push' })
        },
      }
    })
    const { result } = renderHook(() => useAction<ReturnType<typeof factory>>([factory]), {
      wrapper: ({ children }) => <ComwitProvider>{children}</ComwitProvider>,
    })
    const length = window.history.length
    act(() => result.current.push('two'))
    expect(window.history.length).toBe(length + 1)
    expect(window.location.search + window.location.hash).toBe('?thread=two&keep=x#hash')
  })
})
