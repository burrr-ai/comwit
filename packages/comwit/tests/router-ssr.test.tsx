// @vitest-environment node
import React from 'react'
import { AsyncLocalStorage } from 'node:async_hooks'
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import { ComwitProvider, model, useModel, searchParam } from '../src'

test('without a getter, SSR has only passive default state', () => {
  const domain = model({ thread: searchParam({ key: 'thread' }) })
  function View() {
    const binding = useModel(domain, (s) => searchParam.getSnapshot(s, 'thread'))
    expect(binding.ready).toBe(false)
    return <span>{binding.value ?? 'loading'}</span>
  }
  expect(
    renderToString(
      <ComwitProvider>
        <View />
      </ComwitProvider>
    )
  ).toBe('<span>loading</span>')
})

test('concurrent server requests keep getter data and model views isolated', async () => {
  const requests = new AsyncLocalStorage<string>()
  const domain = model({ thread: searchParam({ key: 'thread' }) })
  function View() {
    const binding = useModel(domain, (s) => searchParam.getSnapshot(s, 'thread'))
    const selected = useModel(domain, (s) => s.thread)
    expect(binding.ready).toBe(true)
    expect(binding.value).toBe(selected)
    return <span>{selected}</span>
  }
  const results = await Promise.all(
    Array.from({ length: 24 }, (_, index) =>
      requests.run(`?thread=request-${index}`, async () => {
        await new Promise((resolve) => setTimeout(resolve, index % 3))
        return renderToString(
          <ComwitProvider getServerSearchParams={() => requests.getStore() ?? null}>
            <View />
          </ComwitProvider>
        )
      })
    )
  )
  results.forEach((html, index) => expect(html).toContain(`<span>request-${index}</span>`))
  expect(domain.instance().proxy.thread).toBe(null)
})
