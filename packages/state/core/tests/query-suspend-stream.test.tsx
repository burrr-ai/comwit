// @vitest-environment happy-dom
import React, { Suspense, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToReadableStream, renderToStaticMarkup } from 'react-dom/server'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { action, ComwitProvider, create, model, query, useAction } from '../src'

type ServerInsertedHTMLHook = NonNullable<
  React.ComponentProps<typeof ComwitProvider>['useServerInsertedHTML']
>

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

/**
 * Mimics Next.js: `useServerInsertedHTML` registers callbacks during the server render, and the
 * stream transform renders every callback ahead of each flushed chunk.
 */
function createInsertedHTMLStrategy() {
  const callbacks: Array<() => ReactNode> = []
  const useServerInsertedHTML: ServerInsertedHTMLHook = (callback) => {
    callbacks.push(callback)
  }
  return {
    useServerInsertedHTML,
    callbacks,
    flush: () =>
      renderToStaticMarkup(
        <>
          {callbacks.map((callback, index) => (
            <React.Fragment key={index}>{callback()}</React.Fragment>
          ))}
        </>
      ),
  }
}

/** Runs a server pass the way Next.js does for client components: no window or document. */
async function onServer<T>(run: () => Promise<T>): Promise<T> {
  vi.stubGlobal('window', undefined)
  vi.stubGlobal('document', undefined)
  try {
    return await run()
  } finally {
    vi.unstubAllGlobals()
  }
}

async function readStream(stream: ReadableStream<Uint8Array>) {
  await stream.allReady
  return new Response(stream).text()
}

const roots: Root[] = []

afterEach(async () => {
  cleanup()
  for (const root of roots.splice(0)) {
    await act(async () => root.unmount())
  }
  document.body.innerHTML = ''
})

describe('query selector suspend streaming hydration', () => {
  test('streams server-resolved keys ahead of their HTML and hydrates without a client query', async () => {
    const queryFn = vi.fn(async (id: string) => ({ id, title: `</script><b>${id}</b>` }))
    const pageFn = vi.fn(async () => ({ data: ['a', 'b'], cursor: 'next', hasMore: true }))
    const posts = model({
      detail: query<{ id: string; title: string } | null, string>({
        initialData: null,
        staleTime: 60_000,
        queryFn,
      }),
      pages: query.infinite<string[]>({ initialData: [], queryFn: pageFn }),
    })
    const postActions = action(({ state }) => ({
      refetch() {
        return state(posts).detail.refetch()
      },
    }))
    const usePosts = create<
      typeof posts extends import('../src/core/model').Model<infer T> ? T : never,
      { refetch(): Promise<unknown> }
    >(posts, { actions: [postActions] })

    function Detail() {
      const detail = usePosts((state) => state.detail.suspend('one'))
      const pages = usePosts((state) => state.pages.suspend())
      return (
        <>
          <strong>{detail.data?.title}</strong>
          <em>
            {pages.data.join(',')}:{pages.cursor}:{String(pages.hasMore)}
          </em>
        </>
      )
    }

    function Reader() {
      const title = usePosts((state) => state.detail.suspend('one').data?.title)
      const actions = useAction<{ refetch(): Promise<unknown> }>([postActions])
      return <button onClick={() => void actions.refetch()}>{title}</button>
    }

    function App({
      strategy,
      reader = false,
    }: {
      strategy: ServerInsertedHTMLHook
      reader?: boolean
    }) {
      return (
        <ComwitProvider useServerInsertedHTML={strategy}>
          <Detail />
          {reader && <Reader />}
        </ComwitProvider>
      )
    }

    const server = createInsertedHTMLStrategy()
    const { html, script } = await onServer(async () => {
      const stream = await renderToReadableStream(<App strategy={server.useServerInsertedHTML} />)
      const html = await readStream(stream)
      return { html, script: server.flush() }
    })

    expect(queryFn).toHaveBeenCalledOnce()
    expect(pageFn).toHaveBeenCalledOnce()
    expect(html).toContain('&lt;/script&gt;&lt;b&gt;one&lt;/b&gt;')
    expect(html).toContain('a,b<!-- -->:<!-- -->next<!-- -->:<!-- -->true')
    expect(script).toMatch(/^<script type="application\/json" data-comwit-suspend="[^"]+">/)
    expect(script).toContain('"p":"detail"')
    expect(script).toContain('"p":"pages"')
    expect(script).toContain('\\u003c/script>')
    expect(script).not.toContain('</script><b>')
    // A later flush has nothing new to insert.
    expect(server.flush()).toBe('')

    // Browser: Next.js places the inserted script before the chunk that rendered the data.
    document.body.innerHTML = `${script}<div id="root">${html}</div>`
    const container = document.getElementById('root')!
    const recoverableError = vi.fn()
    const browser = createInsertedHTMLStrategy()

    let root!: Root
    await act(async () => {
      root = hydrateRoot(container, <App strategy={browser.useServerInsertedHTML} />, {
        onRecoverableError: recoverableError,
      })
      roots.push(root)
    })

    expect(recoverableError).not.toHaveBeenCalled()
    expect(queryFn).toHaveBeenCalledOnce()
    expect(pageFn).toHaveBeenCalledOnce()
    expect(container.querySelector('strong')!.textContent).toBe('</script><b>one</b>')
    expect(container.querySelector('em')!.textContent).toBe('a,b:next:true')

    // The committed key is the active resource, so a later reader hits the cache and actions
    // refetch the same argument.
    await act(async () => root.render(<App strategy={browser.useServerInsertedHTML} reader />))
    expect(queryFn).toHaveBeenCalledOnce()
    expect(container.querySelector('button')!.textContent).toBe('</script><b>one</b>')

    await act(async () => container.querySelector('button')!.click())
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(queryFn).toHaveBeenLastCalledWith('one', expect.anything())
  })

  test('flushes nothing while a Suspense boundary is still pending on the server', async () => {
    const request = deferred<string>()
    const greeting = model({
      message: query<string>({ initialData: '', queryFn: () => request.promise }),
    })
    const useGreeting = create(greeting, { actions: [] })

    function View() {
      const message = useGreeting((state) => state.message.suspend())
      return <p>{message.data}</p>
    }

    const server = createInsertedHTMLStrategy()
    await onServer(async () => {
      const stream = await renderToReadableStream(
        <ComwitProvider useServerInsertedHTML={server.useServerInsertedHTML}>
          <Suspense fallback={<p>loading</p>}>
            <View />
          </Suspense>
        </ComwitProvider>
      )
      // The shell is ready; the boundary has not resolved yet.
      expect(server.callbacks).toHaveLength(1)
      expect(server.flush()).toBe('')

      request.resolve('streamed')
      const html = await readStream(stream)
      expect(html).toContain('streamed')
      expect(server.flush()).toContain('"r":"streamed"')
    })
  })

  test('ignores streamed results recorded for another provider or selector position', async () => {
    const queryFn = vi.fn(async () => 'client')
    const resource = model({ value: query<string>({ initialData: '', queryFn }) })
    const useResource = create(resource, { actions: [] })

    function View() {
      const value = useResource((state) => state.value.suspend())
      return <span data-testid="value">{value.data}</span>
    }

    const foreign = JSON.stringify([
      { i: ':other:', p: 'value', k: '__undefined__', t: 1, r: 'foreign' },
    ])
    document.body.innerHTML =
      `<script type="application/json" data-comwit-suspend=":other-provider:">${foreign}</script>` +
      `<div id="root"></div>`
    const container = document.getElementById('root')!
    const browser = createInsertedHTMLStrategy()

    const root = createRoot(container)
    roots.push(root)
    await act(async () => {
      root.render(
        <ComwitProvider useServerInsertedHTML={browser.useServerInsertedHTML}>
          <Suspense fallback={<span>loading</span>}>
            <View />
          </Suspense>
        </ComwitProvider>
      )
    })

    await vi.waitFor(() => expect(container.textContent).toBe('client'))
    expect(queryFn).toHaveBeenCalledOnce()
  })

  test('does not read the document without a provider strategy', async () => {
    const queryFn = vi.fn(async () => 'fetched')
    const resource = model({ value: query<string>({ initialData: '', queryFn }) })
    const useResource = create(resource, { actions: [] })
    const querySelectorAll = vi.spyOn(document, 'querySelectorAll')

    function View() {
      const value = useResource((state) => state.value.suspend())
      return <span>{value.data}</span>
    }

    render(
      <ComwitProvider>
        <Suspense fallback={<span>loading</span>}>
          <View />
        </Suspense>
      </ComwitProvider>
    )

    await waitFor(() => expect(screen.getByText('fetched')).toBeDefined())
    expect(querySelectorAll).not.toHaveBeenCalled()
    querySelectorAll.mockRestore()
  })
})
