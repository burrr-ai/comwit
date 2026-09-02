// @vitest-environment node
import React from 'react'
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
})
