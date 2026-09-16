// @vitest-environment happy-dom
import React, { StrictMode, Suspense, startTransition, useEffect, useState } from 'react'
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import {
  action,
  ComwitProvider,
  ComwitRouterProvider,
  create,
  createBrowserRouterAdapter,
  createRouterSnapshot,
  model,
  query,
  searchParamBinding,
  useAction,
  useModel,
  useSearchParam,
  type RouterAdapter,
  type RouterAdapterFactory,
  type SearchParamBinding,
} from '../src'

function memoryRouter(initial: string | null) {
  let href = initial
  const listeners = new Set<() => void>()
  const adapter = {
    getSnapshot: vi.fn(() => href),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }),
    navigate: vi.fn((next: string) => {
      href = next
      listeners.forEach((listener) => listener())
    }),
    external(next: string) {
      href = next
      listeners.forEach((listener) => listener())
    },
    get listeners() {
      return listeners.size
    },
  }
  return adapter
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('serializes framework search records, repeats, empty values and fragments without React', () => {
  expect(
    createRouterSnapshot({
      pathname: '/project/a',
      searchParams: { thread: 'a & b', tag: ['one', 'two'], empty: '', omitted: undefined },
      hash: 'message',
    })
  ).toBe('/project/a?thread=a+%26+b&tag=one&tag=two&empty=#message')
  expect(createRouterSnapshot({ pathname: '/a', searchParams: '?thread=one' })).toBe(
    '/a?thread=one'
  )
  expect(
    createRouterSnapshot({ pathname: '/a', searchParams: new URLSearchParams('tag=a&tag=b') })
  ).toBe('/a?tag=a&tag=b')
})

test('first server render seeds selectors before the hook, action state, derived values and history', () => {
  const location = model(
    { thread: null as string | null },
    {
      history: true,
      derive: (state) => ({ label: () => `thread:${state.thread}` }),
    }
  )
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const router = memoryRouter(null)
  const factory = vi.fn(({ initialSnapshot }: { initialSnapshot: string | null }) => ({
    ...router,
    getServerSnapshot: () => initialSnapshot,
  }))
  const reads = action(({ state }) => ({ read: () => state(location).thread }))
  function View() {
    const selected = useModel(location, (s) => s.thread)
    const label = useModel(location, (s) => s.label)
    const history = useModel(location, (s) => s.$history.canUndo)
    const actions = useAction<{ read(): string | null }>([reads])
    const binding = useSearchParam(definition)
    expect([binding.ready, binding.value, selected, actions.read(), label, history]).toEqual([
      true,
      'server',
      'server',
      'server',
      'thread:server',
      false,
    ])
    expect(binding.set('render-write')).toBe(false)
    return <span>{selected}</span>
  }
  const html = renderToString(
    <ComwitProvider>
      <ComwitRouterProvider
        initialSnapshot="/chat?thread=server"
        bindings={[definition]}
        createAdapter={factory}
      >
        <View />
      </ComwitRouterProvider>
    </ComwitProvider>
  )
  expect(html).toBe('<span>server</span>')
  expect(factory).toHaveBeenCalledWith({ initialSnapshot: '/chat?thread=server' })
  expect(router.getSnapshot).not.toHaveBeenCalled()
  expect(router.subscribe).not.toHaveBeenCalled()
  expect(router.navigate).not.toHaveBeenCalled()
})

test('SSR requests use separate seeded instances of the same declared model', () => {
  const location = model({ thread: null as string | null })
  const binding = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  function View() {
    return <span>{useModel(location, (s) => s.thread)}</span>
  }
  const tree = (value: string) => (
    <ComwitProvider>
      <ComwitRouterProvider initialSnapshot={`/chat?thread=${value}`} bindings={[binding]}>
        <View />
      </ComwitRouterProvider>
    </ComwitProvider>
  )
  expect(renderToString(tree('one'))).toBe('<span>one</span>')
  expect(renderToString(tree('two'))).toBe('<span>two</span>')
  expect(location.instance().proxy.thread).toBe(null)
})

test('hydration matches server A before reconciling browser B and guards stale passive effects', async () => {
  const location = model({ thread: null as string | null })
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const router = memoryRouter('/chat?thread=server')
  const captures: Array<[boolean, string | null, string | null, number]> = []
  const loads: Array<string | null> = []
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  function View() {
    const binding = useSearchParam(definition)
    const selected = useModel(location, (s) => s.thread)
    captures.push([binding.ready, binding.value, selected, binding.revision])
    useEffect(() => {
      const current = binding.getSnapshot()
      if (!current.ready || current.revision !== binding.revision) return
      loads.push(current.value)
    }, [binding.ready, binding.value, binding.revision, binding.getSnapshot])
    return <span>{selected}</span>
  }
  const tree = (
    <ComwitProvider>
      <ComwitRouterProvider
        initialSnapshot="/chat?thread=server"
        bindings={[definition]}
        createAdapter={() => router}
      >
        <View />
      </ComwitRouterProvider>
    </ComwitProvider>
  )
  const container = document.createElement('div')
  container.innerHTML = renderToString(tree)
  document.body.append(container)
  router.external('/chat?thread=browser&other=keep#message')
  let root!: ReturnType<typeof hydrateRoot>
  await act(async () => {
    root = hydrateRoot(container, tree)
  })
  expect(captures[0]).toEqual([true, 'server', 'server', 0])
  expect(captures[1]).toEqual([true, 'server', 'server', 0])
  expect(captures.at(-1)?.slice(0, 3)).toEqual([true, 'browser', 'browser'])
  expect(container.textContent).toBe('browser')
  expect(loads).toEqual(['browser'])
  expect(router.navigate).not.toHaveBeenCalled()
  expect(errors).not.toHaveBeenCalled()
  act(() => root.unmount())
  container.remove()
})

test('same selection with extra query/hash keeps the bootstrap revision and loads once', async () => {
  const location = model({ thread: null as string | null })
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const router = memoryRouter('/chat?thread=one&other=keep#message')
  const effects = vi.fn()
  let latest!: SearchParamBinding<string | null>
  function View() {
    latest = useSearchParam(definition)
    useEffect(() => {
      effects(latest.value)
    }, [latest.ready, latest.value, latest.revision])
    return null
  }
  render(
    <ComwitProvider>
      <ComwitRouterProvider
        initialSnapshot="/chat?thread=one"
        bindings={[definition]}
        createAdapter={() => router}
      >
        <View />
      </ComwitRouterProvider>
    </ComwitProvider>
  )
  expect(latest.revision).toBe(0)
  expect(effects).toHaveBeenCalledTimes(1)
  const first = latest
  act(() => router.external('/chat?thread=one&other=changed#next'))
  expect(latest).toBe(first)
  expect(effects).toHaveBeenCalledTimes(1)
  act(() => latest.set('two'))
  expect(router.navigate).toHaveBeenLastCalledWith('/chat?thread=two&other=changed#next', {
    history: 'replace',
  })
  expect(latest.revision).toBe(1)
  expect(effects).toHaveBeenCalledTimes(2)
})

test('a delayed hydration boundary reads the fixed model seed after an earlier sibling reconciles', async () => {
  const location = model({ thread: null as string | null })
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const router = memoryRouter('/chat?thread=server')
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  let blocked = false
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  function Live() {
    useSearchParam(definition)
    return null
  }
  function Delayed() {
    const selected = useModel(location, (s) => s.thread)
    if (blocked) throw pending
    return <span>{selected}</span>
  }
  const tree = (
    <ComwitProvider>
      <ComwitRouterProvider
        initialSnapshot="/chat?thread=server"
        bindings={[definition]}
        createAdapter={() => router}
      >
        <Live />
        <Suspense fallback="waiting">
          <Delayed />
        </Suspense>
      </ComwitRouterProvider>
    </ComwitProvider>
  )
  const container = document.createElement('div')
  container.innerHTML = renderToString(tree)
  document.body.append(container)
  blocked = true
  router.external('/chat?thread=browser')
  let root!: ReturnType<typeof hydrateRoot>
  await act(async () => {
    root = hydrateRoot(container, tree)
  })
  expect(container.textContent).toBe('server')
  await act(async () => {
    blocked = false
    release()
    await pending
  })
  expect(container.textContent).toBe('browser')
  expect(errors).not.toHaveBeenCalled()
  act(() => root.unmount())
  container.remove()
})

test('parent models, query registry, actions and changing context remain shared with a child URL scope', () => {
  const location = model({ thread: 'parent' as string | null })
  const user = model({ name: 'Alice' })
  const session = model({ detail: query<string>({ initialData: 'empty', queryFn: vi.fn() }) })
  const useSession = create(session, { actions: [] })
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const router = memoryRouter('/chat?thread=scoped')
  const mutate = action(({ state, context }) => ({
    read: () => [state(location).thread, state(user).name, (context as any).token],
    change() {
      state(location).thread = 'selected'
      state(user).name = 'Bob'
      state(session).detail.set('shared-query')
    },
  }))
  let actions!: { read(): unknown[]; change(): void }
  function RootSeed() {
    useSession.hydrate({ detail: { data: 'hydrated' } })
    return null
  }
  function RootView() {
    const thread = useModel(location, (s) => s.thread)
    const name = useModel(user, (s) => s.name)
    const detail = useModel(session, (s) => s.detail.data)
    return (
      <div data-testid="parent">
        {thread}:{name}:{detail}
      </div>
    )
  }
  function ChildView() {
    useSearchParam(definition)
    actions = useAction([mutate])
    const detail = useModel(session, (s) => s.detail.data)
    return <div data-testid="child-query">{detail}</div>
  }
  const tree = (token: string) => (
    <ComwitProvider context={{ token }}>
      <RootSeed />
      <RootView />
      <ComwitRouterProvider
        initialSnapshot="/chat?thread=scoped"
        bindings={[definition]}
        createAdapter={() => router}
      >
        <ChildView />
      </ComwitRouterProvider>
    </ComwitProvider>
  )
  const view = render(tree('first'))
  expect(actions.read()).toEqual(['scoped', 'Alice', 'first'])
  expect(screen.getByTestId('child-query').textContent).toBe('hydrated')
  act(() => actions.change())
  expect(screen.getByTestId('parent').textContent).toBe('parent:Bob:shared-query')
  expect(screen.getByTestId('child-query').textContent).toBe('shared-query')
  const original = actions
  view.rerender(tree('updated'))
  expect(actions).toBe(original)
  expect(actions.read()).toEqual(['selected', 'Bob', 'updated'])
})

test('rerenders do not replay old bootstrap values or replace the adapter, including Strict Mode', () => {
  const location = model({ thread: null as string | null })
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const router = memoryRouter('/chat?thread=one')
  const createAdapter = vi.fn(() => router)
  let latest!: SearchParamBinding<string | null>
  function View() {
    latest = useSearchParam(definition)
    return <span>{useModel(location, (s) => s.thread)}</span>
  }
  const tree = (snapshot: string) => (
    <StrictMode>
      <ComwitProvider>
        <ComwitRouterProvider
          initialSnapshot={snapshot}
          bindings={[definition]}
          createAdapter={createAdapter}
        >
          <View />
        </ComwitRouterProvider>
      </ComwitProvider>
    </StrictMode>
  )
  const view = render(tree('/chat?thread=one'))
  act(() => latest.set('selected'))
  const calls = createAdapter.mock.calls.length
  view.rerender(tree('/chat?thread=obsolete'))
  expect(latest.value).toBe('selected')
  expect(screen.getByText('selected')).toBeTruthy()
  expect(createAdapter).toHaveBeenCalledTimes(calls)
  expect(router.listeners).toBe(1)
  const previous = latest
  view.unmount()
  expect(router.listeners).toBe(0)
  expect(previous.set('disposed')).toBe(false)
})

test('an abandoned initial boundary leaves an already mounted parent model unchanged', () => {
  const location = model({ thread: 'parent' as string | null })
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const router = memoryRouter('/chat?thread=live')
  const never = new Promise(() => {})
  const seen: unknown[] = []
  function Parent() {
    return <span>{useModel(location, (s) => s.thread)}</span>
  }
  function Abandoned() {
    const binding = useSearchParam(definition)
    seen.push([binding.value, useModel(location, (s) => s.thread)])
    throw never
  }
  render(
    <ComwitProvider>
      <Parent />
      <Suspense fallback="waiting">
        <ComwitRouterProvider
          initialSnapshot="/chat?thread=private"
          bindings={[definition]}
          createAdapter={() => router}
        >
          <Abandoned />
        </ComwitRouterProvider>
      </Suspense>
    </ComwitProvider>
  )
  expect(screen.getByText('parent')).toBeTruthy()
  expect(seen[0]).toEqual(['private', 'private'])
  expect(router.getSnapshot).not.toHaveBeenCalled()
  expect(router.listeners).toBe(0)
  expect(router.navigate).not.toHaveBeenCalled()
})

test('abandoned keyed transitions keep the committed scope and its selector snapshot', () => {
  const location = model({ thread: null as string | null })
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const router = memoryRouter('/chat?thread=one')
  const never = new Promise(() => {})
  let navigate!: (next: string) => void
  function View({ route }: { route: string }) {
    useSearchParam(definition)
    const selected = useModel(location, (s) => s.thread)
    if (route === 'pending') throw never
    return <span data-testid="selection">{selected}</span>
  }
  function App() {
    const [route, setRoute] = useState('one')
    navigate = (next) => startTransition(() => setRoute(next))
    return (
      <ComwitProvider>
        <Suspense fallback="pending">
          <ComwitRouterProvider
            key={route}
            initialSnapshot={`/chat?thread=${route}`}
            bindings={[definition]}
            createAdapter={() => router}
          >
            <View route={route} />
          </ComwitRouterProvider>
        </Suspense>
      </ComwitProvider>
    )
  }
  render(<App />)
  act(() => navigate('pending'))
  expect(screen.getByTestId('selection').textContent).toBe('one')
  act(() => navigate('one'))
  expect(screen.getByTestId('selection').textContent).toBe('one')
  expect(router.navigate).not.toHaveBeenCalled()
  expect(router.listeners).toBe(1)
})

test('adapter getServerSnapshot can provide the seed and an explicit snapshot takes precedence', () => {
  const location = model({ thread: null as string | null })
  const definition = searchParamBinding(location, 'thread', { key: 'thread', defaultValue: null })
  const createAdapter: RouterAdapterFactory = () => ({
    ...memoryRouter(null),
    getServerSnapshot: () => '/chat?thread=factory',
  })
  function View() {
    return <span>{useSearchParam(definition).value}</span>
  }
  const tree = (initialSnapshot?: string | null) => (
    <ComwitProvider>
      <ComwitRouterProvider
        initialSnapshot={initialSnapshot}
        bindings={[definition]}
        createAdapter={createAdapter}
      >
        <View />
      </ComwitRouterProvider>
    </ComwitProvider>
  )
  expect(renderToString(tree())).toBe('<span>factory</span>')
  expect(renderToString(tree('/chat?thread=prop'))).toBe('<span>prop</span>')
  expect(renderToString(tree(null))).toBe('<span></span>')
})

test('query hydration can still initialize an unobserved resource in an owned model', () => {
  const domain = model({
    thread: null as string | null,
    detail: query<string>({ initialData: 'empty', queryFn: vi.fn() }),
  })
  const definition = searchParamBinding(domain, 'thread', { key: 'thread', defaultValue: null })
  const useDomain = create(domain, { actions: [] })
  function View() {
    useDomain.hydrate({ detail: { data: 'seeded-data' } })
    return <span>{useModel(domain, (s) => `${s.thread}:${s.detail.data}`)}</span>
  }
  expect(
    renderToString(
      <ComwitProvider>
        <ComwitRouterProvider initialSnapshot="/chat?thread=one" bindings={[definition]}>
          <View />
        </ComwitRouterProvider>
      </ComwitProvider>
    )
  ).toBe('<span>one:seeded-data</span>')
})

test('browser adapter factory retains a server snapshot without reading window for it', () => {
  const adapter: RouterAdapter = createBrowserRouterAdapter({
    initialSnapshot: '/chat?thread=seed',
  })
  expect(adapter.getServerSnapshot?.()).toBe('/chat?thread=seed')
  expect(adapter.getSnapshot()).not.toBe('/chat?thread=seed')
})
