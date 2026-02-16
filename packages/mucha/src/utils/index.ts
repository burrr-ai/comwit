export { isEqual } from 'es-toolkit'
export { debounce, type DebounceOptions, type DebouncedFunction } from 'es-toolkit'
export { throttle, type ThrottleOptions, type ThrottledFunction } from 'es-toolkit'
export { flow as pipe, flowRight as compose } from 'es-toolkit'

export type ArrayElement<T extends readonly unknown[]> = T[number]

export type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (
  arg: infer I
) => void
  ? I
  : never

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
