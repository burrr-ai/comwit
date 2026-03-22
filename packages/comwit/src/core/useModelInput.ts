import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
} from 'react'
import type { Model } from './model'
import { useStoreRegistry } from './provider'

type InputElement = HTMLInputElement | HTMLTextAreaElement

type UseModelInputReturn = {
  value: string
  onChange: (e: ChangeEvent<InputElement>) => void
  onCompositionStart: () => void
  onCompositionEnd: (e: CompositionEvent<InputElement>) => void
}

/**
 * React hook that binds a model's string field to an input element,
 * handling IME composition (Korean, Japanese, Chinese) correctly.
 *
 * Proxy notifications are batched via microtask and can arrive after
 * React re-renders the input, which breaks IME composition.
 * This hook keeps a local state buffer that updates synchronously,
 * while still writing to the proxy on every change.
 * During IME composition, proxy→local sync is paused so the
 * composing text is never overwritten by a stale snapshot.
 */
export function useModelInput<T extends object>(
  m: Model<T>,
  field: keyof T & string
): UseModelInputReturn {
  const registry = useStoreRegistry()
  const store = registry.get(m)

  const [localValue, setLocalValue] = useState(() => {
    const v = (store.proxy as Record<string, unknown>)[field]
    return v == null ? '' : String(v)
  })

  const composingRef = useRef(false)

  // Sync proxy → local when not composing
  useEffect(() => {
    return store.subscribe(() => {
      if (!composingRef.current) {
        const snap = store.getSnapshot()
        const next = (snap as Record<string, unknown>)[field]
        setLocalValue(next == null ? '' : String(next))
      }
    })
  }, [store, field])

  const onChange = useCallback(
    (e: ChangeEvent<InputElement>) => {
      const val = e.target.value
      setLocalValue(val)
      ;(store.proxy as Record<string, unknown>)[field] = val
    },
    [store, field]
  )

  const onCompositionStart = useCallback(() => {
    composingRef.current = true
  }, [])

  const onCompositionEnd = useCallback(
    (e: CompositionEvent<InputElement>) => {
      composingRef.current = false
      const val = (e.target as InputElement).value
      setLocalValue(val)
      ;(store.proxy as Record<string, unknown>)[field] = val
    },
    [store, field]
  )

  return { value: localValue, onChange, onCompositionStart, onCompositionEnd }
}
