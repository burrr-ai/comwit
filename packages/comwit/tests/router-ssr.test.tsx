// @vitest-environment node
import React from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import { ComwitProvider, createBrowserRouterAdapter, model, useSearchParam } from '../src'

test('the browser adapter and binding are inert without window', () => {
  const adapter = createBrowserRouterAdapter()
  expect(adapter.getSnapshot()).toBe(null)
  const unsubscribe = adapter.subscribe(() => {
    throw new Error('unexpected notification')
  })
  adapter.navigate('/chat?thread=one', { history: 'push' })
  unsubscribe()
  const domain = model({ thread: null as string | null })
  function Boundary() {
    const binding = useSearchParam(domain, 'thread', { key: 'thread', defaultValue: null })
    expect(binding.ready).toBe(false)
    expect(binding.set('ignored')).toBe(false)
    return <span>{binding.value ?? 'loading'}</span>
  }
  expect(
    renderToString(
      <ComwitProvider router={adapter}>
        <Boundary />
      </ComwitProvider>
    )
  ).toBe('<span>loading</span>')
})
