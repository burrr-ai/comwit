// @vitest-environment node
import React, { Suspense } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import { ComwitProvider, model, query, useModel } from '../src'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('query selector suspend streaming SSR', () => {
  test('blocks at the root until data resolves when no Suspense boundary is present', async () => {
    const request = deferred<string>()
    const queryFn = vi.fn(() => request.promise)
    const greeting = model({
      message: query<string>({ initialData: '', queryFn }),
    })

    function View() {
      const message = useModel(greeting, (state) => state.message.suspend())
      return <strong>{message.data}</strong>
    }

    let streamResolved = false
    const streamPromise = renderToReadableStream(
      <ComwitProvider>
        <View />
      </ComwitProvider>
    ).then((stream) => {
      streamResolved = true
      return stream
    })

    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledOnce())
    expect(streamResolved).toBe(false)

    request.resolve('server value')
    const stream = await streamPromise
    const html = await new Response(stream).text()

    expect(html).toContain('<strong>server value</strong>')
    expect(queryFn).toHaveBeenCalledOnce()
  })

  test('passive readers in the same server render see the first resolved key', async () => {
    const queryFn = vi.fn(async () => ({ id: 'u1' }))
    const session = model({
      me: query<{ id: string } | null>({ initialData: null, queryFn }),
    })

    // A layout shell owns the request; siblings and nested boundaries read passively.
    function Shell({ children }: { children: React.ReactNode }) {
      useModel(session, (state) => state.me.suspend().isSuccess)
      return <>{children}</>
    }
    function Header() {
      const me = useModel(session, (state) => state.me.data)
      return <header>{me ? me.id : 'anonymous'}</header>
    }
    function Nav() {
      const me = useModel(session, (state) => state.me.data)
      return <nav>{me ? 'member' : 'guest'}</nav>
    }

    const stream = await renderToReadableStream(
      <ComwitProvider>
        <Suspense fallback={null}>
          <Shell>
            <Header />
            <Suspense fallback={<nav>pending</nav>}>
              <Nav />
            </Suspense>
          </Shell>
        </Suspense>
      </ComwitProvider>
    )
    await stream.allReady
    const html = await new Response(stream).text()

    expect(html).toContain('<header>u1</header>')
    expect(html).toContain('<nav>member</nav>')
    expect(html).not.toContain('anonymous')
    expect(html).not.toContain('guest')
    expect(queryFn).toHaveBeenCalledOnce()
  })
})
