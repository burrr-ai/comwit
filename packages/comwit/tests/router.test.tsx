// @vitest-environment happy-dom
import React, { StrictMode, Suspense } from 'react'
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  action,
  ComwitProvider,
  createBrowserRouterAdapter,
  model,
  useAction,
  useModel,
  useSearchParam,
  type RouterAdapter,
  type RouterHistory,
  type RouterNavigateOptions,
  type SearchParamBinding,
} from '../src'

function memoryRouter(initial: string | null) {
  let href = initial
  const listeners = new Set<() => void>()
  const entries = [initial]
  let index = 0
  const publish = () => listeners.forEach((listener) => listener())
  const navigate = vi.fn((next: string, { history }: RouterNavigateOptions) => {
    href = next
    if (history === 'push') entries.splice(++index, entries.length, next)
    else entries[index] = next
    publish()
  })
  return {
    getSnapshot: () => href,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    navigate,
    external(next: string | null, notify = true) {
      href = next
      if (notify) publish()
    },
    back() {
      if (index > 0) href = entries[--index]
      publish()
    },
    forward() {
      if (index < entries.length - 1) href = entries[++index]
      publish()
    },
    get listeners() {
      return listeners.size
    },
    get length() {
      return entries.length
    },
  }
}

function setup(
  router = memoryRouter('/chat?thread=url&other=keep#message'),
  strict = false,
  history?: RouterHistory
) {
  const domain = model({ thread: null as string | null, other: 0 })
  const actions = action(({ state }) => {
    const current = state(domain)
    return {
      select(value: string | null) {
        current.thread = value
      },
      unrelated() {
        current.other++
      },
    }
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ComwitProvider router={router}>
      {strict ? <StrictMode>{children}</StrictMode> : children}
    </ComwitProvider>
  )
  const hook = renderHook(
    () => ({
      binding: useSearchParam(domain, 'thread', { key: 'thread', defaultValue: null, history }),
      state: useModel(domain, (s) => s.thread),
      actions: useAction([actions]),
    }),
    { wrapper }
  )
  return { ...hook, router, domain }
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

describe('Provider search parameter binding', () => {
  test('URL initializes the model before write-back, including Strict Mode replay', async () => {
    const { result, router, unmount } = setup(undefined, true)
    expect(result.current.state).toBe('url')
    expect(result.current.binding.ready).toBe(true)
    await flush()
    expect(router.navigate).not.toHaveBeenCalled()
    expect(router.listeners).toBe(1)
    unmount()
    expect(router.listeners).toBe(0)
  })

  test('defaults to replace for both model actions and set without adding history entries', async () => {
    const { result, router } = setup()
    act(() => result.current.actions.select('first'))
    await flush()
    act(() => result.current.actions.select('second'))
    await flush()
    act(() => result.current.binding.set('third'))
    expect(router.navigate).toHaveBeenCalledTimes(3)
    expect(router.navigate.mock.calls.map(([, options]) => options.history)).toEqual([
      'replace',
      'replace',
      'replace',
    ])
    expect(router.length).toBe(1)
    expect(router.getSnapshot()).toBe('/chat?thread=third&other=keep#message')
  })

  test('set can opt into push for one write without changing the replace default', async () => {
    const { result, router } = setup()
    act(() => result.current.binding.set('pushed', { history: 'push' }))
    expect(router.navigate).toHaveBeenLastCalledWith('/chat?thread=pushed&other=keep#message', {
      history: 'push',
    })
    act(() => result.current.binding.set('replaced'))
    expect(router.navigate).toHaveBeenLastCalledWith('/chat?thread=replaced&other=keep#message', {
      history: 'replace',
    })
    expect(router.length).toBe(2)
    act(() => router.back())
    expect(result.current.binding.value).toBe('url')
    await flush()
    expect(router.navigate).toHaveBeenCalledTimes(2)
  })

  test('explicit push bindings support replace overrides and back/forward without echoes', async () => {
    const { result, router } = setup(memoryRouter('/chat?other=keep#message'), false, 'push')
    expect(result.current.binding.value).toBe(null)
    act(() => result.current.binding.set('latest', { history: 'replace' }))
    expect(router.navigate).toHaveBeenLastCalledWith('/chat?other=keep&thread=latest#message', {
      history: 'replace',
    })
    act(() => result.current.actions.select('selected'))
    await flush()
    expect(router.navigate).toHaveBeenLastCalledWith('/chat?other=keep&thread=selected#message', {
      history: 'push',
    })
    act(() => router.back())
    expect(result.current.state).toBe('latest')
    act(() => router.forward())
    expect(result.current.state).toBe('selected')
    await flush()
    expect(router.navigate).toHaveBeenCalledTimes(2)
  })

  test('ignores unrelated model changes and stable no-op sets', async () => {
    const { result, router, rerender } = setup()
    const original = result.current.binding
    rerender()
    expect(result.current.binding).toBe(original)
    act(() => result.current.actions.unrelated())
    act(() => result.current.binding.set('url'))
    await flush()
    expect(result.current.binding).toBe(original)
    expect(router.navigate).not.toHaveBeenCalled()
    act(() => result.current.binding.set('new'))
    expect(result.current.binding.set).toBe(original.set)
    expect(result.current.binding.getSnapshot).toBe(original.getSnapshot)
  })

  test('waits for an unavailable router and gives its first URL priority', async () => {
    const { result, router } = setup(memoryRouter(null))
    expect(result.current.binding.ready).toBe(false)
    expect(result.current.binding.set('premature')).toBe(false)
    act(() => result.current.actions.select('default'))
    await flush()
    expect(router.navigate).not.toHaveBeenCalled()
    act(() => router.external('/chat?thread=restored'))
    expect(result.current.binding.ready).toBe(true)
    expect(result.current.state).toBe('restored')
    act(() => router.external(null))
    expect(result.current.binding.ready).toBe(false)
  })

  test('external navigation cancels a queued obsolete write even before notification', async () => {
    const { result, router } = setup()
    act(() => {
      result.current.actions.select('obsolete')
      router.external('/project/new?thread=external&filter=x#anchor', false)
    })
    await flush()
    expect(result.current.state).toBe('external')
    expect(router.getSnapshot()).toBe('/project/new?thread=external&filter=x#anchor')
    expect(router.navigate).not.toHaveBeenCalled()
  })

  test('rebases a queued write on unrelated URL changes', async () => {
    const { result, router } = setup()
    act(() => {
      result.current.actions.select('selected')
      router.external('/chat?thread=url&other=updated&tag=a&tag=b#new', false)
    })
    await flush()
    expect(router.getSnapshot()).toBe('/chat?thread=selected&other=updated&tag=a&tag=b#new')
    expect(result.current.state).toBe('selected')
  })

  test('stale async normalization cannot overwrite a newer URL or user choice', async () => {
    const { result, router } = setup()
    const first = result.current.binding.getSnapshot().revision
    act(() => router.external('/chat?thread=external'))
    let accepted = true
    act(() => {
      accepted = result.current.binding.set('late-fallback', {
        history: 'replace',
        ifRevision: first,
      })
    })
    expect(accepted).toBe(false)
    const second = result.current.binding.getSnapshot().revision
    act(() => result.current.actions.select('user'))
    act(() => {
      accepted = result.current.binding.set('late-fallback', { ifRevision: second })
    })
    expect(accepted).toBe(false)
    await flush()
    expect(router.getSnapshot()).toBe('/chat?thread=user')
    const third = result.current.binding.getSnapshot().revision
    router.external('/chat?thread=unnotified', false)
    act(() => {
      accepted = result.current.binding.set('stale', { ifRevision: third })
    })
    expect(accepted).toBe(false)
    expect(result.current.state).toBe('unnotified')
  })

  test('removing the parameter restores its default without an echo', async () => {
    const { result, router } = setup()
    act(() => router.external('/chat?other=keep#message'))
    expect(result.current.state).toBe(null)
    await flush()
    expect(router.navigate).not.toHaveBeenCalled()
    act(() => result.current.binding.set('new'))
    act(() => result.current.binding.set(null, { history: 'replace' }))
    expect(router.getSnapshot()).toBe('/chat?other=keep#message')
  })

  test('cleanup cancels writes and makes disposed callbacks inert', async () => {
    const { result, router, unmount } = setup()
    const binding = result.current.binding
    act(() => result.current.actions.select('queued'))
    unmount()
    expect(binding.set('late')).toBe(false)
    await flush()
    expect(router.navigate).not.toHaveBeenCalled()
    expect(router.listeners).toBe(0)
  })

  test('a keyed boundary reinitializes a shared model and disposes the previous project', async () => {
    const router = memoryRouter('/project/a?thread=a')
    const domain = model({ thread: null as string | null })
    let binding!: SearchParamBinding<string | null>
    function Boundary() {
      binding = useSearchParam(domain, 'thread', { key: 'thread', defaultValue: null })
      return <span>{useModel(domain, (s) => s.thread)}</span>
    }
    const tree = (key: string) => (
      <ComwitProvider router={router}>
        <Boundary key={key} />
      </ComwitProvider>
    )
    const { rerender } = render(tree('a'))
    const previous = binding
    router.external('/project/b?thread=b', false)
    rerender(tree('b'))
    expect(binding.value).toBe('b')
    expect(screen.getByText('b')).toBeTruthy()
    expect(previous.set('late-a')).toBe(false)
    await flush()
    expect(router.navigate).not.toHaveBeenCalled()
    expect(router.listeners).toBe(1)
  })

  test('separate Providers isolate bindings to the same model and key', () => {
    const domain = model({ thread: null as string | null })
    const firstRouter = memoryRouter('/a?thread=one')
    const secondRouter = memoryRouter('/b?thread=two')
    const values: SearchParamBinding<string | null>[] = []
    function Boundary({ index }: { index: number }) {
      values[index] = useSearchParam(domain, 'thread', { key: 'thread', defaultValue: null })
      return null
    }
    render(
      <ComwitProvider router={firstRouter}>
        <Boundary index={0} />
        <ComwitProvider router={secondRouter}>
          <Boundary index={1} />
        </ComwitProvider>
      </ComwitProvider>
    )
    act(() => values[0].set('changed'))
    expect(values[0].value).toBe('changed')
    expect(values[1].value).toBe('two')
    expect(secondRouter.navigate).not.toHaveBeenCalled()
  })

  test('multiple query bindings preserve each other during a batched model action', async () => {
    const domain = model({ thread: null as string | null, tab: null as string | null })
    const actions = action(({ state }) => ({
      both() {
        state(domain).thread = 'one'
        state(domain).tab = 'code'
      },
    }))
    const router = memoryRouter('/chat?unrelated=keep#hash')
    const { result } = renderHook(
      () => {
        useSearchParam(domain, 'thread', { key: 'thread', defaultValue: null })
        useSearchParam(domain, 'tab', { key: 'tab', defaultValue: null })
        return useAction([actions])
      },
      { wrapper: ({ children }) => <ComwitProvider router={router}>{children}</ComwitProvider> }
    )
    act(() => result.current.both())
    await flush()
    expect(router.getSnapshot()).toBe('/chat?unrelated=keep&thread=one&tab=code#hash')
  })

  test('custom codecs validate malformed values and explicitly canonicalize with replace', () => {
    const domain = model({ page: 1 })
    const parse = (raw: string | null) => (/^[1-9]\d*$/.test(raw ?? '') ? Number(raw) : 1)
    const serialize = (value: number) => (value === 1 ? null : String(value))
    const router = memoryRouter('/list?page=invalid&filter=all')
    const { result } = renderHook(
      () => useSearchParam(domain, 'page', { key: 'page', defaultValue: 1, parse, serialize }),
      { wrapper: ({ children }) => <ComwitProvider router={router}>{children}</ComwitProvider> }
    )
    expect(result.current.value).toBe(1)
    expect(router.navigate).not.toHaveBeenCalled()
    act(() => result.current.set(1, { history: 'replace' }))
    expect(router.getSnapshot()).toBe('/list?filter=all')
    act(() => result.current.set(2))
    expect(router.getSnapshot()).toBe('/list?filter=all&page=2')
  })

  test('an abandoned render never initializes state or installs a binding', async () => {
    const router = memoryRouter('/chat?thread=url')
    const domain = model({ thread: 'default' as string | null })
    const never = new Promise(() => {})
    function Abandoned() {
      useSearchParam(domain, 'thread', { key: 'thread', defaultValue: null })
      throw never
    }
    function Observer() {
      return <span>{useModel(domain, (s) => s.thread)}</span>
    }
    render(
      <ComwitProvider router={router}>
        <Observer />
        <Suspense fallback="waiting">
          <Abandoned />
        </Suspense>
      </ComwitProvider>
    )
    await flush()
    expect(screen.getByText('default')).toBeTruthy()
    expect(router.listeners).toBe(0)
    expect(router.navigate).not.toHaveBeenCalled()
  })

  test('SSR and hydration use a passive default snapshot before committing the URL', async () => {
    const router = memoryRouter('/chat?thread=url')
    const domain = model({ thread: null as string | null })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const renders: Array<{ ready: boolean; value: string | null }> = []
    function Boundary() {
      const binding = useSearchParam(domain, 'thread', { key: 'thread', defaultValue: null })
      renders.push({ ready: binding.ready, value: binding.value })
      return <span>{binding.ready ? binding.value : 'loading'}</span>
    }
    const tree = (
      <ComwitProvider router={router}>
        <Boundary />
      </ComwitProvider>
    )
    const container = document.createElement('div')
    container.innerHTML = renderToString(tree)
    document.body.append(container)
    expect(container.textContent).toBe('loading')
    expect(router.listeners).toBe(0)
    let root!: ReturnType<typeof hydrateRoot>
    await act(async () => {
      root = hydrateRoot(container, tree)
    })
    expect(renders[0]).toEqual({ ready: false, value: null })
    expect(renders[1]).toEqual({ ready: false, value: null })
    expect(container.textContent).toBe('url')
    expect(error).not.toHaveBeenCalled()
    expect(router.navigate).not.toHaveBeenCalled()
    act(() => root.unmount())
    container.remove()
  })
})

describe('native browser router adapter', () => {
  test('default selections keep native history length and explicit push adds one entry', () => {
    window.history.replaceState(null, '', '/chat?thread=initial&other=keep#message')
    const router = createBrowserRouterAdapter()
    const domain = model({ thread: null as string | null })
    const { result } = renderHook(
      () => useSearchParam(domain, 'thread', { key: 'thread', defaultValue: null }),
      { wrapper: ({ children }) => <ComwitProvider router={router}>{children}</ComwitProvider> }
    )
    const initialLength = window.history.length
    act(() => result.current.set('one'))
    act(() => result.current.set('two'))
    expect(window.history.length).toBe(initialLength)
    expect(router.getSnapshot()).toBe('/chat?thread=two&other=keep#message')
    act(() => result.current.set('three', { history: 'push' }))
    expect(window.history.length).toBe(initialLength + 1)
    act(() => result.current.set('four'))
    expect(window.history.length).toBe(initialLength + 1)
    expect(router.getSnapshot()).toBe('/chat?thread=four&other=keep#message')
  })

  test('observes native push/replace, back/forward events and hash changes, then restores methods', async () => {
    const originalPush = window.history.pushState
    const originalReplace = window.history.replaceState
    const adapter = createBrowserRouterAdapter()
    const listener = vi.fn()
    const stop = adapter.subscribe(listener)
    window.history.pushState(null, '', '/chat?thread=one#hash')
    await flush()
    expect(adapter.getSnapshot()).toBe('/chat?thread=one#hash')
    expect(listener).toHaveBeenCalledTimes(1)
    window.history.replaceState(null, '', '/chat?thread=two#next')
    await flush()
    expect(listener).toHaveBeenCalledTimes(2)
    originalReplace.call(window.history, null, '', '/chat?thread=back#next')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await flush()
    originalReplace.call(window.history, null, '', '/chat?thread=back#hash')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await flush()
    expect(listener).toHaveBeenCalledTimes(4)
    stop()
    expect(window.history.pushState).toBe(originalPush)
    expect(window.history.replaceState).toBe(originalReplace)
  })

  test('shares only the event transport and cleans up in either unsubscribe order', async () => {
    const originalPush = window.history.pushState
    const first = createBrowserRouterAdapter()
    const second = createBrowserRouterAdapter()
    const firstListener = vi.fn()
    const secondListener = vi.fn()
    const stopFirst = first.subscribe(firstListener)
    const stopSecond = second.subscribe(secondListener)
    stopFirst()
    second.navigate('/chat?thread=two', { history: 'push' })
    await flush()
    expect(firstListener).not.toHaveBeenCalled()
    expect(secondListener).toHaveBeenCalledOnce()
    stopSecond()
    expect(window.history.pushState).toBe(originalPush)
  })

  test('coalesces browser notifications outside the caller and preserves newer framework wrappers', async () => {
    const originalPush = window.history.pushState
    const adapter = createBrowserRouterAdapter()
    const listener = vi.fn()
    const stop = adapter.subscribe(listener)
    const wrapped = window.history.pushState
    const framework = vi.fn((...args: Parameters<History['pushState']>) =>
      wrapped.apply(window.history, args)
    )
    window.history.pushState = framework
    adapter.navigate('/chat?thread=one', { history: 'push' })
    adapter.navigate('/chat?thread=two', { history: 'push' })
    expect(adapter.getSnapshot()).toBe('/chat?thread=two')
    expect(listener).not.toHaveBeenCalled()
    await flush()
    expect(listener).toHaveBeenCalledOnce()
    stop()
    expect(window.history.pushState).toBe(framework)
    window.history.pushState = originalPush
  })
})
