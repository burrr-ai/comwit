import { describe, test, expect, vi, beforeEach } from 'vitest'

/**
 * Regression: importing the provider module must not call React.createContext
 * at module-evaluation time. Eager top-level createContext() crashes when the
 * module is loaded inside a React Server Components bundle (the RSC-vendored
 * React build does not export createContext), even if only the pure proxy
 * utilities are referenced from the import site.
 */
describe('provider module-level safety', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('createContext is not invoked at provider module load', async () => {
    const createContextSpy = vi.fn(() => ({
      Provider: () => null,
      Consumer: () => null,
      displayName: 'MockedContext',
    }))

    vi.doMock('react', async () => {
      const actual = await vi.importActual<typeof import('react')>('react')
      return { ...actual, default: actual, createContext: createContextSpy }
    })

    await import('../src/core/provider')

    expect(createContextSpy).not.toHaveBeenCalled()

    vi.doUnmock('react')
  })
})
