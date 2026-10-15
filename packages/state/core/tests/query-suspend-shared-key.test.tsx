// @vitest-environment happy-dom
import React, { Suspense, useLayoutEffect, useState } from 'react'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { action, ComwitProvider, create, model, query } from '../src'
import type { Model } from '../src/core/model'

type Category = { id: string; name: string }
type Product = { id: string; name: string; categoryId: string }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

/**
 * A storefront shape: the header reads `categories.suspend()` first and stays on its fallback.
 * A product detail mounts later from a state update inside an effect (a card click that seeds
 * `detail.set()` and then navigates). Its breadcrumb, inside its own Suspense, reads the same
 * pending `categories` key.
 *
 * With a thrown promise React 19 re-renders the suspended header forever once the second boundary
 * suspends (the render never settles and the tab freezes). `use()` tracks the thenable instead, so
 * both boundaries wait quietly and settle together.
 */
function setup() {
  const categories = deferred<Category[]>()
  // The seeded detail refetches in the background; keep that request open so the seeded name stays.
  const refetch = deferred<Product>()
  const findProduct = vi.fn((_id: string) => refetch.promise)
  const catalog = model({
    categories: query<Category[]>({ initialData: [], queryFn: () => categories.promise }),
    detail: query<Product | null, string>({ initialData: null, queryFn: findProduct }),
  })
  const catalogActions = action(({ state }) => ({
    open(product: Product) {
      state(catalog).detail.set(product, { arg: product.id })
    },
  }))
  const useCatalog = create<
    typeof catalog extends Model<infer T> ? T : never,
    { open(product: Product): void }
  >(catalog, { actions: [catalogActions] })

  const renders = { header: 0, detail: 0, crumb: 0 }
  /** Turns a render loop into a failure instead of a hung worker. */
  const count = (name: keyof typeof renders) => {
    renders[name]++
    if (renders[name] > 100) throw new Error(`${name} rendered ${renders[name]} times`)
  }

  function Header() {
    count('header')
    const list = useCatalog((state) => state.categories.suspend())
    return <nav>{list.data.map((category) => category.name).join(',') || 'no categories'}</nav>
  }

  function Crumb({ categoryId }: { categoryId: string }) {
    count('crumb')
    const list = useCatalog((state) => state.categories.suspend())
    return <em>{list.data.find((category) => category.id === categoryId)?.name ?? '?'}</em>
  }

  function Detail({ id }: { id: string }) {
    count('detail')
    const detail = useCatalog((state) => state.detail.suspend(id))
    if (!detail.data) return null
    return (
      <article>
        <h1>{detail.data.name}</h1>
        <Suspense fallback={<span>crumb…</span>}>
          <Crumb categoryId={detail.data.categoryId} />
        </Suspense>
      </article>
    )
  }

  /** Mimics a card click: fill the detail cache, then navigate into the detail route. */
  function SeedThenShow() {
    const catalogHook = useCatalog((state) => ({ actions: state.actions }))
    const [ready, setReady] = useState(false)
    useLayoutEffect(() => {
      catalogHook.actions.open({ id: 'p1', name: 'Seeded product', categoryId: 'c1' })
      setReady(true)
    }, [catalogHook.actions])
    if (!ready) return null
    return (
      <Suspense fallback={<p>detail…</p>}>
        <Detail id="p1" />
      </Suspense>
    )
  }

  function App({ showDetail }: { showDetail: boolean }) {
    return (
      <ComwitProvider>
        <Suspense fallback={<p>header…</p>}>
          <Header />
        </Suspense>
        {showDetail && <SeedThenShow />}
      </ComwitProvider>
    )
  }

  return { App, categories, findProduct, renders }
}

describe('selector .suspend() on a key another boundary is already waiting for', () => {
  test('a later boundary shows its own fallback and both settle when the key resolves', async () => {
    const { App, categories, findProduct, renders } = setup()

    let rerender!: (ui: React.ReactElement) => void
    await act(async () => {
      rerender = render(<App showDetail={false} />).rerender
    })
    expect(screen.getByText('header…')).toBeTruthy()

    await act(async () => {
      rerender(<App showDetail />)
    })

    // The seeded body renders at once; only the pieces that need categories wait.
    expect(await screen.findByRole('heading', { name: 'Seeded product' })).toBeTruthy()
    expect(screen.getByText('crumb…')).toBeTruthy()
    expect(screen.getByText('header…')).toBeTruthy()
    expect(renders.header + renders.detail + renders.crumb).toBeLessThan(40)

    await act(async () => {
      categories.resolve([{ id: 'c1', name: 'Tea' }])
    })

    await waitFor(() => {
      expect(screen.getByRole('navigation').textContent).toBe('Tea')
      expect(screen.getByRole('article').textContent).toContain('Tea')
    })
    expect(renders.header + renders.detail + renders.crumb).toBeLessThan(40)
    // The seeded detail refreshes in the background exactly once.
    await waitFor(() => expect(findProduct).toHaveBeenCalledTimes(1))
  })

  test('a second boundary that suspends from an effect does not re-render the first forever', async () => {
    const pending = new Promise<never>(() => {})
    const catalog = model({
      list: query<string[]>({ initialData: [], queryFn: () => pending }),
    })
    const useCatalog = create(catalog, { actions: [] })
    let headerRenders = 0

    function Header() {
      headerRenders++
      if (headerRenders > 100) throw new Error(`header rendered ${headerRenders} times`)
      return <nav>{useCatalog((state) => state.list.suspend()).data.length}</nav>
    }
    function Second() {
      return <em>{useCatalog((state) => state.list.suspend()).data.length}</em>
    }
    function MountFromEffect() {
      const [ready, setReady] = useState(false)
      useLayoutEffect(() => setReady(true), [])
      return ready ? (
        <Suspense fallback={<p>second…</p>}>
          <Second />
        </Suspense>
      ) : null
    }
    function App({ second }: { second: boolean }) {
      return (
        <ComwitProvider>
          <Suspense fallback={<p>header…</p>}>
            <Header />
          </Suspense>
          {second && <MountFromEffect />}
        </ComwitProvider>
      )
    }

    let rerender!: (ui: React.ReactElement) => void
    await act(async () => {
      rerender = render(<App second={false} />).rerender
    })
    await act(async () => {
      rerender(<App second />)
    })
    expect(screen.getByText('header…')).toBeTruthy()
    expect(screen.getByText('second…')).toBeTruthy()
    expect(headerRenders).toBeLessThan(10)
  })
})
