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
  searchParam,
  useAction,
  useModel,
  type SearchParamSnapshot,
} from '../src'
import { useStoreRegistry } from '../src/core/provider'

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
  const location = model({ thread: searchParam({ key: 'thread' }) })
  const main = model({ name: 'shared session' })
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
  let meta!: SearchParamSnapshot<string | null>
  let actions: any
  const factory = action(({ state }) => {
    const current = state(location)
    return {
      getProxy: () => current,
      read: () => searchParam.getSnapshot(current, 'thread'),
      set: (value: string | null, options?: { ifRevision?: number }) =>
        searchParam.set(current, 'thread', value, options),
      select(value: string | null) {
        current.thread = value
      },
    }
  })
  function View() {
    useModel(main, (s) => s.name)
    actions = useAction([factory])
    // The first ordinary selector already knows the declaration and server value.
    const selected = useModel(location, (s) => s.thread)
    const rendered = useModel(location, (s) => searchParam.getSnapshot(s, 'thread'))
    meta = rendered
    reads.push({ ...rendered, selected })
    useEffect(() => {
      const current = actions.read()
      if (!current.ready || current.revision !== rendered.revision) return
      loads.push(current.value)
    }, [rendered.ready, rendered.value, rendered.revision])
    return <span data-selection="">{`${rendered.ready}:${selected ?? 'none'}`}</span>
  }
  return {
    getter,
    reads,
    loads,
    location,
    tree: (getServerSearchParams = getter) => (
      <ComwitProvider context={{ router: {} }} getServerSearchParams={getServerSearchParams}>
        <View />
      </ComwitProvider>
    ),
    get meta() {
      return meta
    },
    get actions() {
      return actions
    },
  }
}
async function hydrate(tree: React.ReactNode, host: Element) {
  const errors: unknown[] = []
  await act(async () =>
    roots.push(hydrateRoot(host, tree, { onRecoverableError: (error) => errors.push(error) }))
  )
  return errors
}
afterEach(() => {
  roots.splice(0).forEach((root) => act(() => root.unmount()))
  cleanup()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

test('a descriptor seeds the first SSR selector and an earlier action proxy without a connection hook', () => {
  const current = fixture('?thread=server')
  const html = serverRender(current.tree())
  expect(html).toContain('<span data-selection="">true:server</span>')
  expect(current.reads).toEqual([{ ready: true, value: 'server', selected: 'server', revision: 0 }])
  expect(current.actions.getProxy().thread).toBe('server')
  expect(current.getter).toHaveBeenCalledTimes(1)
})

for (const search of [undefined, null]) {
  test(`getter ${search === null ? 'null' : 'absent'} matches defaults during hydration before the browser URL initializes state`, async () => {
    const current = fixture(search)
    const host = document.body.appendChild(document.createElement('div'))
    host.innerHTML = serverRender(current.tree())
    expect(host.querySelector('span')?.textContent).toBe('false:none')
    window.history.replaceState(null, '', '/chat?thread=browser&other=keep#message')
    expect(await hydrate(current.tree(), host)).toEqual([])
    expect(current.reads[1]).toEqual(current.reads[0])
    expect(current.meta).toMatchObject({ value: 'browser', ready: true })
    expect(current.loads).toEqual(['browser'])
    expect(current.getter?.mock.calls.length ?? 0).toBe(search === null ? 1 : 0)
  })
}

test('empty server search is available while omitted defaultValue resolves to null', async () => {
  const current = fixture('')
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  window.history.replaceState(null, '', '/chat#message')
  expect(await hydrate(current.tree(), host)).toEqual([])
  expect(current.reads[0]).toEqual({ ready: true, value: null, selected: null, revision: 0 })
  expect(current.meta.revision).toBe(0)
  expect(current.loads).toEqual([null])
  expect(window.location.search).toBe('')
})

test('server A matches hydration before browser B alone starts loading', async () => {
  const current = fixture('?thread=server')
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  window.history.replaceState(null, '', '/chat?thread=browser#message')
  expect(await hydrate(current.tree(), host)).toEqual([])
  expect(current.reads[1]).toEqual(current.reads[0])
  expect(current.meta).toMatchObject({ value: 'browser', revision: 1 })
  expect(current.loads).toEqual(['browser'])
  const proxy = current.actions.getProxy(),
    length = window.history.length
  act(() => current.actions.select('selected'))
  await act(async () => {
    await Promise.resolve()
  })
  expect(current.actions.getProxy()).toBe(proxy)
  expect(proxy.thread).toBe('selected')
  expect(window.history.length).toBe(length)
})

test('matching values with unrelated query/hash do not increment revision or duplicate loads', async () => {
  const current = fixture('?thread=one')
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  window.history.replaceState(null, '', '/chat?thread=one&keep=x#hash')
  expect(await hydrate(current.tree(), host)).toEqual([])
  expect(current.meta.revision).toBe(0)
  expect(current.loads).toEqual(['one'])
  await act(async () => {
    window.history.replaceState(null, '', '/chat?thread=one&keep=y#next')
    await Promise.resolve()
  })
  expect(current.meta.revision).toBe(0)
  expect(current.loads).toEqual(['one'])
})

test('automatic transfer escapes script delimiters and Unicode and round-trips safely', async () => {
  const value = '</script><script>injected()</script>\u2028\u2029'
  const source = `?thread=${value}&other=<tag>`
  const current = fixture(source)
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  const scripts = host.querySelectorAll('script')
  expect(scripts).toHaveLength(1)
  expect(scripts[0].textContent).not.toContain('<')
  expect(scripts[0].textContent).not.toContain('\u2028')
  expect(scripts[0].textContent).not.toContain('\u2029')
  expect(JSON.parse(scripts[0].textContent!)).toBe(source)
  window.history.replaceState(
    null,
    '',
    `/chat?${new URLSearchParams({ thread: value, other: '<tag>' })}`
  )
  expect(await hydrate(current.tree(), host)).toEqual([])
  expect(current.meta.value).toBe(value)
})

test('Provider rerenders never replay initial values or call the getter in the browser', async () => {
  const current = fixture('?thread=one')
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(current.tree())
  window.history.replaceState(null, '', '/chat?thread=one')
  await hydrate(current.tree(), host)
  act(() => current.actions.set('chosen'))
  const replacement = vi.fn(() => {
    throw new Error('browser getter invoked')
  })
  await act(async () => roots[0].render(current.tree(replacement)))
  expect(replacement).not.toHaveBeenCalled()
  expect(current.meta.value).toBe('chosen')
  expect(current.getter).toHaveBeenCalledTimes(1)
})

test('an abandoned consumer does not initialize an existing unused client store or subscribe', () => {
  const domain = model({ thread: searchParam({ key: 'thread' }) })
  window.history.replaceState(null, '', '/chat?thread=url')
  let proxy: any, stage!: () => void
  const never = new Promise(() => {})
  const originalHistory = window.history.replaceState
  function Abandoned() {
    useModel(domain, (s) => s.thread)
    throw never
  }
  function View() {
    proxy = useStoreRegistry().get(domain).proxy
    const [show, setShow] = useState(false)
    stage = () => startTransition(() => setShow(true))
    return <Suspense fallback="waiting">{show ? <Abandoned /> : <span>idle</span>}</Suspense>
  }
  render(
    <ComwitProvider>
      <View />
    </ComwitProvider>
  )
  const original = proxy
  act(() => stage())
  expect(proxy).toBe(original)
  expect(proxy.thread).toBe(null)
  expect(window.history.replaceState).toBe(originalHistory)
  expect(screen.getByText('idle')).toBeTruthy()
})

test('an abandoned action-only consumer also leaves browser state untouched', async () => {
  const domain = model({ thread: searchParam({ key: 'thread' }) })
  let captured: any, stage!: () => void
  const never = new Promise(() => {})
  const factory = action(({ state }) => {
    captured = state(domain)
    return {}
  })
  function Abandoned() {
    useAction([factory])
    throw never
  }
  function View() {
    const [show, setShow] = useState(false)
    stage = () => startTransition(() => setShow(true))
    return <Suspense fallback="waiting">{show ? <Abandoned /> : <span>idle</span>}</Suspense>
  }
  const tree = (
    <ComwitProvider getServerSearchParams={() => '?thread=server'}>
      <View />
    </ComwitProvider>
  )
  const host = document.body.appendChild(document.createElement('div'))
  host.innerHTML = serverRender(tree)
  window.history.replaceState(null, '', '/chat?thread=browser')
  await hydrate(tree, host)
  act(() => stage())
  expect(captured.thread).toBe(null)
  expect(host.textContent).toContain('idle')
})

test('ordinary models install no browser history subscriptions', () => {
  const domain = model({ name: 'plain' })
  const original = window.history.pushState
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
  expect(window.history.pushState).toBe(original)
  expect(add.mock.calls.filter(([type]) => type === 'popstate' || type === 'hashchange')).toEqual(
    []
  )
})

test('transfer markup preserves ordinary observer lifetime as siblings change', () => {
  const observe = vi.fn(() => vi.fn())
  const domain = model({ value: 1 }, { onObserve: observe })
  const getter = () => null
  function View() {
    useModel(domain, (s) => s.value)
    return null
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
  current.rerender(
    <ComwitProvider getServerSearchParams={getter}>
      <View />
    </ComwitProvider>
  )
  expect(observe).toHaveBeenCalledTimes(1)
  expect(stop).not.toHaveBeenCalled()
})

test('a model first consumed after hydration loads once and uses the live URL', async () => {
  const domain = model({ thread: searchParam({ key: 'thread' }) })
  const loads: Array<string | null> = []
  const factory = action(({ state }) => {
    const data = state(domain)
    return { read: () => searchParam.getSnapshot(data, 'thread') }
  })
  function Consumer() {
    const actions = useAction<ReturnType<typeof factory>>([factory])
    const meta = useModel(domain, (s) => searchParam.getSnapshot(s, 'thread'))
    useEffect(() => {
      const current = actions.read()
      if (current.ready && current.revision === meta.revision) loads.push(current.value)
    }, [meta.ready, meta.value, meta.revision])
    return <span>{meta.value}</span>
  }
  function View() {
    const [show, setShow] = useState(false)
    return (
      <>
        <button onClick={() => setShow(true)}>mount</button>
        {show && <Consumer />}
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
  await hydrate(tree, host)
  act(() => host.querySelector('button')!.click())
  expect(loads).toEqual(['one'])
})

test('delayed hydration still sees the original server model snapshot after another consumer reconciles', async () => {
  const domain = model({ thread: searchParam({ key: 'thread' }) })
  let blocked = false,
    release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  function Live() {
    useModel(domain, (s) => s.thread)
    return null
  }
  function Delayed() {
    const value = useModel(domain, (s) => s.thread)
    if (blocked) throw pending
    return <span>{value}</span>
  }
  const tree = (
    <ComwitProvider getServerSearchParams={() => '?thread=server'}>
      <Live />
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

test('nested number and boolean declarations are parsed before the first SSR read', () => {
  const domain = model({
    filters: {
      page: searchParam({ key: 'page', type: 'number', defaultValue: 1 }),
      enabled: searchParam({ key: 'enabled', type: 'boolean' }),
    },
  })
  function View() {
    return <span>{useModel(domain, (s) => `${s.filters.page}:${s.filters.enabled}`)}</span>
  }
  const html = serverRender(
    <ComwitProvider getServerSearchParams={() => '?page=0&enabled=false'}>
      <View />
    </ComwitProvider>
  )
  expect(html).toContain('<span>0:false</span>')
})
