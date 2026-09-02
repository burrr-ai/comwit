import { useLayoutEffect, useRef, type DependencyList } from 'react'

function dependenciesEqual(previous: DependencyList, next: DependencyList): boolean {
  return (
    previous.length === next.length &&
    previous.every((value, index) => Object.is(value, next[index]))
  )
}

/**
 * Synchronize server-provided values into a mounted store during React's
 * commit phase. The callback runs once for each dependency tuple, including
 * when Strict Mode replays effects in development.
 */
export function useHydrate(hydrate: () => void, dependencies: DependencyList): void {
  const hydrateRef = useRef(hydrate)
  const hydratedDependenciesRef = useRef<DependencyList | null>(null)
  hydrateRef.current = hydrate

  useLayoutEffect(() => {
    const previous = hydratedDependenciesRef.current
    if (previous !== null && dependenciesEqual(previous, dependencies)) return

    hydratedDependenciesRef.current = [...dependencies]
    hydrateRef.current()
  }, dependencies)
}
