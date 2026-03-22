// @vitest-environment happy-dom
import { describe, test, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { model, action, useAction, useModelInput, ComwitProvider } from '../src'

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ComwitProvider>{children}</ComwitProvider>
  }
}

describe('useModelInput', () => {
  test('returns initial value from model', () => {
    const form = model({ name: 'hello' })
    const wrapper = createWrapper()

    const { result } = renderHook(() => useModelInput(form, 'name'), { wrapper })

    expect(result.current.value).toBe('hello')
  })

  test('onChange updates local value synchronously', async () => {
    const form = model({ name: '' })

    function TestInput() {
      const nameProps = useModelInput(form, 'name')
      return <input data-testid="input" {...nameProps} />
    }

    render(
      <ComwitProvider>
        <TestInput />
      </ComwitProvider>
    )

    const input = screen.getByTestId('input') as HTMLInputElement

    fireEvent.change(input, { target: { value: '가' } })

    // Local state updates synchronously — no microtask delay
    expect(input.value).toBe('가')
  })

  test('external proxy mutation syncs to local value', async () => {
    const form = model({ name: '' })
    const formActions = action(({ state }) => ({
      setName(v: string) {
        state(form).name = v
      },
    }))

    function TestInput() {
      const nameProps = useModelInput(form, 'name')
      const actions = useAction<{ setName: (v: string) => void }>([formActions])
      return (
        <>
          <input data-testid="input" {...nameProps} />
          <button data-testid="btn" onClick={() => actions.setName('외부값')}>
            set
          </button>
        </>
      )
    }

    render(
      <ComwitProvider>
        <TestInput />
      </ComwitProvider>
    )

    const input = screen.getByTestId('input') as HTMLInputElement
    const btn = screen.getByTestId('btn')

    await act(async () => {
      fireEvent.click(btn)
    })

    expect(input.value).toBe('외부값')
  })

  test('proxy sync is paused during IME composition', async () => {
    const form = model({ name: '' })
    const formActions = action(({ state }) => ({
      setName(v: string) {
        state(form).name = v
      },
    }))

    function TestInput() {
      const nameProps = useModelInput(form, 'name')
      const actions = useAction<{ setName: (v: string) => void }>([formActions])
      return (
        <>
          <input data-testid="input" {...nameProps} />
          <button data-testid="btn" onClick={() => actions.setName('replaced')}>
            set
          </button>
        </>
      )
    }

    render(
      <ComwitProvider>
        <TestInput />
      </ComwitProvider>
    )

    const input = screen.getByTestId('input') as HTMLInputElement

    // Start IME composition
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: 'ㅎ' } })

    expect(input.value).toBe('ㅎ')

    // External update during composition should NOT overwrite composing value
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn'))
    })

    expect(input.value).toBe('ㅎ')

    // End composition — local value persists, proxy gets the composed result
    fireEvent.compositionEnd(input, { target: { value: '한' } } as any)

    // After composition ends, proxy→local sync resumes
    await act(async () => {})

    // The compositionEnd handler sets the final composed value
    expect(input.value).toBe('한')
  })

  test('handles null/undefined field gracefully', () => {
    const form = model({ name: null as string | null })
    const wrapper = createWrapper()

    const { result } = renderHook(() => useModelInput(form, 'name'), { wrapper })

    expect(result.current.value).toBe('')
  })

  test('returns stable callback references', () => {
    const form = model({ name: '' })
    const wrapper = createWrapper()

    const { result, rerender } = renderHook(() => useModelInput(form, 'name'), { wrapper })

    const firstOnChange = result.current.onChange
    const firstOnCompositionStart = result.current.onCompositionStart
    const firstOnCompositionEnd = result.current.onCompositionEnd

    rerender()

    expect(result.current.onChange).toBe(firstOnChange)
    expect(result.current.onCompositionStart).toBe(firstOnCompositionStart)
    expect(result.current.onCompositionEnd).toBe(firstOnCompositionEnd)
  })
})
