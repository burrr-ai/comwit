// @vitest-environment happy-dom
import React, { Suspense, startTransition, useEffect, useState } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import {
  action,
  ComwitProvider,
  model,
  useAction,
  useModel,
  useSearchParam,
  type SearchParamBinding,
} from '../src'

const roots: Root[] = []
function serverRender(tree: React.ReactNode) {
  const browser = window
  vi.stubGlobal('window', undefined)
  try {
    return renderToString(tree)
  } finally {
    vi.stubGlobal('window', browser)
  }
}
function fixture(search?: string | null) {
  const location = model({ thread: null as string | null })
  const main = model({ name: 'shared session' })
  const nextRouter = { push: vi.fn() }
  const getter =
    search === undefined
      ? undefined
      : vi.fn(() => {
          if (typeof window !== 'undefined') throw new Error('server getter called in browser')
          return search
        })
  const reads: Array<{
    ready: boolean
    value: string | null
    selected: string | null
    revision: number
  }> = []
  const loads: Array<string | null> = []
  let binding!: SearchParamBinding<string | null>
  let proxy!: { thread: string | null }
  let actions!: { getProxy(): { thread: string | null }; read(): string | null }
  const factory = action(({ state }) => {
    const captured = state(location)
    return { getProxy: () => captured, read: () => captured.thread }
  })
  function View() {
    useModel(main, (s) => s.name)
    actions = useAction([factory])
    proxy = actions.getProxy()
    const rendered = useSearchParam(location, 'thread', { key: 'thread', defaultValue: null })
    binding = rendered
    if (typeof window === 'undefined') expect(actions.read()).toBe(rendered.value)
    const selected = useModel(location, (s) => s.thread)
    reads.push({ ready: binding.ready, value: binding.value, selected, revision: binding.revision })
    useEffect(() => {
      const current = rendered.getSnapshot()
      if (!current.ready || current.revision !== rendered.revision) return
      loads.push(current.value)
    }, [binding.ready, binding.value, binding.revision, binding.getSnapshot])
    return (
      <span data-selection="">
        {String(binding.ready)}:{selected ?? 'none'}
      </span>
    )
  }
  return {
    getter,
    reads,
    loads,
    location,
    nextRouter,
    tree: (getServerSearchParams = getter) => (
      <ComwitProvider
        context={{ router: nextRouter }}
        getServerSearchParams={getServerSearchParams}
      >
        <View />
      </ComwitProvider>
    ),
    get binding() {
      return binding
    },
    get proxy() {
      return proxy
    },
    get actions() {
      return actions
    },
  }
}
async function hydrate(tree: React.ReactNode, container: Element) {
  const errors: unknown[] = []
  await act(async () => {
    roots.push(hydrateRoot(container, tree, { onRecoverableError: (error) => errors.push(error) }))
  })
  return errors
}
afterEach(() => {
  roots.splice(0).forEach((root) => act(() => root.unmount()))
  cleanup()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

test('getter SSR seeds the hook, following model selector and an earlier action proxy without changing identity', () => {
  const current = fixture('?thread=server')
  const html = serverRender(current.tree())
  expect(html.replaceAll('<!-- -->', '')).toContain('<span data-selection="">true:server</span>')
  expect(current.reads).toEqual([{ ready: true, value: 'server', selected: 'server', revision: 0 }])
  expect(current.getter).toHaveBeenCalledTimes(1)
  // The same action facade remains usable; browser live state has not been seeded during render.
  expect(current.actions.getProxy()).toBe(current.proxy)
  expect(current.actions.read()).toBe(null)
  expect(current.binding.set('during-render')).toBe(false)
})

for (const search of [undefined, null]) {
  test(`getter ${search === null ? 'null' : 'absent'} keeps server/default hydration equal before reading the browser URL`, async () => {
    const current = fixture(search)
    const host = document.body.appendChild(document.createElement('div'))
    host.innerHTML = serverRender(current.tree())
    expect(host.querySelector('[data-selection]')?.textContent).toBe('false:none')
    window.history.replaceState(null, '', '/chat?thread=browser&other=keep#message')
    const errors = await hydrate(current.tree(), host)
    expect(errors).toEqual([])
    expect(current.reads[0]).toEqual({ ready: false, value: null, selected: null, revision: 0 })
    expect(current.reads[1]).toEqual(current.reads[0])
    expect(current.binding.value).toBe('browser')
    expect(current.loads).toEqual(['browser'])
    expect(current.getter?.mock.calls.length ?? 0).toBe(search === null ? 1 : 0)
    expect(window.location.search).toBe('?thread=browser&other=keep')
  })
}

test('an empty server search is available and hydrates as ready without rewriting the URL', async () => {
  const current = fixture('')
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  window.history.replaceState(null, '', '/chat#message')
  const errors = await hydrate(current.tree(), host)
  expect(errors).toEqual([])
  expect(current.reads[0]).toEqual({ ready: true, value: null, selected: null, revision: 0 })
  expect(current.reads[1]).toEqual(current.reads[0])
  expect(current.binding.revision).toBe(0)
  expect(current.loads).toEqual([null])
  expect(window.location.href.endsWith('/chat#message')).toBe(true)
})

test('server A matches the first hydration snapshot, then browser B alone starts loading', async () => {
  const current = fixture('?thread=server')
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  window.history.replaceState(null, '', '/chat?thread=browser#message')
  expect(await hydrate(current.tree(), host)).toEqual([])
  expect(current.reads[1]).toEqual(current.reads[0])
  expect(current.binding.value).toBe('browser')
  expect(current.binding.revision).toBe(1)
  expect(current.loads).toEqual(['browser'])
  const proxy = current.proxy
  const length = window.history.length
  act(() => current.binding.set('selected'))
  expect(current.proxy).toBe(proxy)
  expect(current.actions.getProxy()).toBe(proxy)
  expect(proxy.thread).toBe('selected')
  expect(window.history.length).toBe(length)
  expect(current.nextRouter.push).not.toHaveBeenCalled()
  expect(current.getter).toHaveBeenCalledTimes(1)
})

test('matching selection with browser-only query/hash keeps revision zero and loads once', async () => {
  const current = fixture('?thread=one')
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  window.history.replaceState(null, '', '/chat?thread=one&other=keep#message')
  expect(await hydrate(current.tree(), host)).toEqual([])
  expect(current.binding.revision).toBe(0)
  expect(current.loads).toEqual(['one'])
  await act(async () => {
    window.history.replaceState(null, '', '/chat?thread=one&other=changed#next')
    await Promise.resolve()
  })
  expect(current.binding.revision).toBe(0)
  expect(current.loads).toEqual(['one'])
  act(() => current.binding.set('two'))
  expect(window.location.search + window.location.hash).toBe('?thread=two&other=changed#next')
})

test('internal JSON transfer escapes script delimiters and Unicode and round-trips through hydration', async () => {
  const dangerous = '</script><script>injected()</script>\u2028\u2029'
  const search = `?thread=${dangerous}&other=<tag>`
  const current = fixture(search)
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  const scripts = host.querySelectorAll('script')
  expect(scripts).toHaveLength(1)
  expect(scripts[0].type).toBe('application/json')
  expect(scripts[0].textContent).not.toContain('<')
  expect(scripts[0].textContent).not.toContain('\u2028')
  expect(scripts[0].textContent).not.toContain('\u2029')
  expect(JSON.parse(scripts[0].textContent!)).toBe(search)
  window.history.replaceState(
    null,
    '',
    `/chat?${new URLSearchParams({ thread: dangerous, other: '<tag>' })}`
  )
  expect(await hydrate(current.tree(), host)).toEqual([])
  expect(current.binding.value).toBe(dangerous)
})

test('later Provider renders never call the browser getter or replay old server values', async () => {
  const current = fixture('?thread=one')
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  window.history.replaceState(null, '', '/chat?thread=one')
  await hydrate(current.tree(), host)
  act(() => current.binding.set('chosen'))
  const replacement = vi.fn(() => {
    throw new Error('browser getter invoked')
  })
  await act(async () => roots[0].render(current.tree(replacement)))
  expect(replacement).not.toHaveBeenCalled()
  expect(current.binding.value).toBe('chosen')
  expect(current.getter).toHaveBeenCalledTimes(1)
})

test('an abandoned client binding leaves an already observed model and captured action proxy untouched', () => {
  window.history.replaceState(null, '', '/chat?thread=url')
  const location = model({ thread: 'existing' as string | null })
  const never = new Promise(() => {})
  const originalHistory = window.history.replaceState
  let show!: () => void
  let captured!: { thread: string | null }
  let attempted!: SearchParamBinding<string | null>
  const actions = action(({ state }) => {
    captured = state(location)
    return {}
  })
  function Abandoned() {
    attempted = useSearchParam(location, 'thread', { key: 'thread', defaultValue: null })
    throw never
  }
  function View() {
    const [pending, setPending] = useState(false)
    show = () => startTransition(() => setPending(true))
    useAction([actions])
    const selected = useModel(location, (s) => s.thread)
    return (
      <>
        <span>{selected}</span>
        <Suspense fallback="waiting">{pending && <Abandoned />}</Suspense>
      </>
    )
  }
  render(
    <ComwitProvider>
      <View />
    </ComwitProvider>
  )
  const original = captured
  act(() => show())
  expect(captured).toBe(original)
  expect(captured.thread).toBe('existing')
  expect(screen.getByText('existing')).toBeTruthy()
  expect(attempted.set('leaked')).toBe(false)
  expect(window.history.replaceState).toBe(originalHistory)
})

test('a server model already read before binding stays consistent and defers URL initialization', () => {
  const location = model({ thread: 'default' as string | null })
  function View() {
    const before = useModel(location, (s) => s.thread)
    const binding = useSearchParam(location, 'thread', { key: 'thread', defaultValue: null })
    const after = useModel(location, (s) => s.thread)
    return (
      <span>
        {before}:{String(binding.ready)}:{after}
      </span>
    )
  }
  const html = serverRender(
    <ComwitProvider getServerSearchParams={() => '?thread=url'}>
      <View />
    </ComwitProvider>
  )
  expect(html.replaceAll('<!-- -->', '')).toContain('<span>default:false:default</span>')
})

test('ordinary model hooks install no browser history subscriptions', () => {
  const domain = model({ name: 'plain' })
  const originalPush = window.history.pushState
  const add = vi.spyOn(window, 'addEventListener')
  function View() {
    return <span>{useModel(domain, (s) => s.name)}</span>
  }
  const getter = vi.fn(() => {
    throw new Error('browser getter invoked')
  })
  render(
    <ComwitProvider getServerSearchParams={getter}>
      <View />
    </ComwitProvider>
  )
  expect(getter).not.toHaveBeenCalled()
  expect(window.history.pushState).toBe(originalPush)
  expect(add.mock.calls.filter(([type]) => type === 'popstate' || type === 'hashchange')).toEqual(
    []
  )
})

test('the automatic transfer element preserves existing model observers when siblings change', () => {
  const observe = vi.fn(() => vi.fn())
  const domain = model({ name: 'plain' }, { onObserve: observe })
  const getter = () => null
  function View() {
    return <span>{useModel(domain, (s) => s.name)}</span>
  }
  const current = render(
    <ComwitProvider getServerSearchParams={getter}>
      <View />
    </ComwitProvider>
  )
  const stop = observe.mock.results[0].value
  current.rerender(
    <ComwitProvider getServerSearchParams={getter}>
      <View />
      <View />
    </ComwitProvider>
  )
  expect(observe).toHaveBeenCalledTimes(1)
  expect(stop).not.toHaveBeenCalled()
  current.rerender(
    <ComwitProvider getServerSearchParams={getter}>
      <View />
    </ComwitProvider>
  )
  expect(observe).toHaveBeenCalledTimes(1)
  expect(stop).not.toHaveBeenCalled()
})

test('Provider transfer IDs isolate the same model under multiple providers', async () => {
  const location = model({ thread: null as string | null })
  const initial: Array<[string, string | null]> = []
  function View({ name }: { name: string }) {
    const binding = useSearchParam(location, 'thread', { key: 'thread', defaultValue: null })
    initial.push([name, binding.value])
    return (
      <span>
        {name}:{binding.value}
      </span>
    )
  }
  const first = vi.fn(() => '?thread=one')
  const second = vi.fn(() => '?thread=two')
  const tree = (
    <>
      <ComwitProvider getServerSearchParams={first}>
        <View name="first" />
      </ComwitProvider>
      <ComwitProvider getServerSearchParams={second}>
        <View name="second" />
      </ComwitProvider>
    </>
  )
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(tree)
  const scripts = host.querySelectorAll('script')
  expect(scripts).toHaveLength(2)
  expect(scripts[0].id).not.toBe(scripts[1].id)
  window.history.replaceState(null, '', '/chat?thread=live')
  expect(await hydrate(tree, host)).toEqual([])
  expect(initial.slice(0, 4)).toEqual([
    ['first', 'one'],
    ['second', 'two'],
    ['first', 'one'],
    ['second', 'two'],
  ])
  expect(first).toHaveBeenCalledTimes(1)
  expect(second).toHaveBeenCalledTimes(1)
})

test('a delayed hydration child keeps its server model snapshot after a sibling reconciles', async () => {
  const location = model({ thread: null as string | null })
  let blocked = false
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  function Binding() {
    useSearchParam(location, 'thread', { key: 'thread', defaultValue: null })
    return null
  }
  function Delayed() {
    const selected = useModel(location, (s) => s.thread)
    if (blocked) throw pending
    return <span>{selected}</span>
  }
  const tree = (
    <ComwitProvider getServerSearchParams={() => '?thread=server'}>
      <Binding />
      <Suspense fallback="waiting">
        <Delayed />
      </Suspense>
    </ComwitProvider>
  )
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(tree)
  window.history.replaceState(null, '', '/chat?thread=browser')
  blocked = true
  const errors = await hydrate(tree, host)
  expect(host.querySelector('span')?.textContent).toBe('server')
  await act(async () => {
    blocked = false
    release()
    await pending
  })
  expect(host.querySelector('span')?.textContent).toBe('browser')
  expect(errors).toEqual([])
})

test('a binding first mounted after hydration loads once even when it matches the retained server search', async () => {
  const location = model({ thread: null as string | null })
  const loads: Array<string | null> = []
  function Bound() {
    const binding = useSearchParam(location, 'thread', { key: 'thread', defaultValue: null })
    useEffect(() => {
      const current = binding.getSnapshot()
      if (current.ready && current.revision === binding.revision) loads.push(current.value)
    }, [binding.ready, binding.value, binding.revision, binding.getSnapshot])
    return <span>{binding.value}</span>
  }
  function View() {
    const [show, setShow] = useState(false)
    return (
      <>
        <button onClick={() => setShow(true)}>mount binding</button>
        {show && <Bound />}
      </>
    )
  }
  const tree = (
    <ComwitProvider getServerSearchParams={() => '?thread=one'}>
      <View />
    </ComwitProvider>
  )
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(tree)
  window.history.replaceState(null, '', '/chat?thread=one')
  expect(await hydrate(tree, host)).toEqual([])
  act(() => host.querySelector('button')!.click())
  expect(loads).toEqual(['one'])
})

test('an abandoned late binding cannot seed an unread action-captured proxy from retained server data', async () => {
  const location = model({ thread: null as string | null })
  let captured!: { thread: string | null }
  let stage!: () => void
  const never = new Promise(() => {})
  const actions = action(({ state }) => {
    captured = state(location)
    return {}
  })
  function Abandoned() {
    useSearchParam(location, 'thread', { key: 'thread', defaultValue: null })
    throw never
  }
  function View() {
    useAction([actions])
    const [pending, setPending] = useState(false)
    stage = () => startTransition(() => setPending(true))
    return <Suspense fallback="waiting">{pending ? <Abandoned /> : <span>idle</span>}</Suspense>
  }
  const tree = (
    <ComwitProvider getServerSearchParams={() => '?thread=server'}>
      <View />
    </ComwitProvider>
  )
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(tree)
  window.history.replaceState(null, '', '/chat?thread=browser')
  expect(await hydrate(tree, host)).toEqual([])
  const original = captured
  act(() => stage())
  expect(captured).toBe(original)
  expect(captured.thread).toBe(null)
  expect(host.textContent).toContain('idle')
})
