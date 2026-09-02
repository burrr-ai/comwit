// @vitest-environment happy-dom
import React, { StrictMode, act, useSyncExternalStore } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { cleanup, render, waitFor } from '@testing-library/react'
import { ComwitProvider, action, create, model, query, silent, useHydrate } from '../src'
import { isSilent } from '../src/core/silent'

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

describe('silent() and React external-store consistency', () => {
  test('keeps the outer silent scope active after a nested call', () => {
    const counter = model({ count: 0 })
    const store = counter.instance()
    const listener = vi.fn()
    store.subscribe(listener)

    silent(() => {
      store.proxy.count = 1
      silent(() => {
        store.proxy.count = 2
      })

      expect(isSilent()).toBe(true)
      store.proxy.count = 3
    })

    expect(isSilent()).toBe(false)
    expect(listener).not.toHaveBeenCalled()
    expect(store.getSnapshot().count).toBe(3)
  })

  test('restores a nested silent scope after an exception', () => {
    silent(() => {
      expect(() =>
        silent(() => {
          throw new Error('nested failure')
        })
      ).toThrow('nested failure')
      expect(isSilent()).toBe(true)
    })

    expect(isSilent()).toBe(false)
  })

  test('cannot hide a render-time mutation from React snapshot checks', async () => {
    const counter = model({ count: 0 })
    const store = counter.instance()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    let renders = 0

    function RenderTimeInitializer() {
      const count = useSyncExternalStore(
        store.subscribe,
        () => store.getSnapshot().count,
        () => store.getSnapshot().count
      )
      renders++

      if (count === 0) {
        silent(() => {
          store.proxy.count = 1
        })
      }

      return <span>{count}</span>
    }

    render(<RenderTimeInitializer />)

    await waitFor(() => expect(document.body.textContent).toBe('1'))
    expect(listener).not.toHaveBeenCalled()
    expect(renders).toBe(2)
    unsubscribe()
  })
})

describe('useHydrate()', () => {
  test('hydrates a query after commit once per dependency tuple', async () => {
    type Post = { slug: string; title: string }

    const updates = model({
      detail: query<Post | null, string>({
        initialData: null,
        queryFn: async () => null,
      }),
    })
    const hydrationCalls: Post[] = []
    const updateActions = action(({ state }) => ({
      initDetail(post: Post) {
        hydrationCalls.push(post)
        state(updates).detail.set(post, { arg: post.slug })
      },
    }))
    const useUpdates = create(updates, { actions: [updateActions] })
    const firstPost = { slug: 'release', title: 'Release notes' }
    const secondPost = { slug: 'follow-up', title: 'Follow-up' }

    function DetailInitializer({ post }: { post: Post }) {
      const selected = useUpdates((state) => ({ actions: state.actions }))
      useHydrate(() => selected.actions.initDetail(post), [post, selected.actions])
      return null
    }

    function Detail() {
      const detail = useUpdates((state) => state.detail.data)
      return <article>{detail?.title ?? 'empty'}</article>
    }

    function App({ post }: { post: Post }) {
      return (
        <StrictMode>
          <ComwitProvider>
            <DetailInitializer post={post} />
            <Detail />
          </ComwitProvider>
        </StrictMode>
      )
    }

    const serverHtml = renderToString(<App post={firstPost} />)
    expect(serverHtml).toContain('empty')
    expect(hydrationCalls).toHaveLength(0)

    const container = document.createElement('div')
    container.innerHTML = serverHtml
    document.body.append(container)

    let root: Root
    await act(async () => {
      root = hydrateRoot(container, <App post={firstPost} />)
    })

    await waitFor(() => expect(container.textContent).toBe('Release notes'))
    expect(hydrationCalls).toEqual([firstPost])

    await act(async () => root!.render(<App post={firstPost} />))
    expect(hydrationCalls).toEqual([firstPost])

    await act(async () => root!.render(<App post={secondPost} />))
    await waitFor(() => expect(container.textContent).toBe('Follow-up'))
    expect(hydrationCalls).toEqual([firstPost, secondPost])

    await act(async () => root!.unmount())
  })
})
