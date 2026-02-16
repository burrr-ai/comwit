import { isEqual } from '../utils'
import { useRef } from 'react'
import { model, Model, useModel } from './model'
import { action, ActionFactory, useAction } from './action'
import { MuchaProvider } from './provider'
import { silent } from './silent'
import {
  keepPreviousData,
  PlaceholderData,
  Query,
  QueryDefaultOptions,
  QueryQueryOptions,
  query,
} from './query'

function create<S extends object, A>(
  m: Model<S>,
  options: { actions: ActionFactory<Partial<A>, any>[] }
) {
  function useStore(): S & { actions: A }
  function useStore<R>(selector: (state: S & { actions: A }) => R): R
  function useStore<R>(selector?: (state: S & { actions: A }) => R) {
    const state = useModel(m)
    const actions = useAction<A>(options.actions)

    const prevRef = useRef<unknown>(null)
    const full = { ...state, actions } as S & { actions: A }
    const next = selector ? selector(full) : full

    if (prevRef.current !== null && isEqual(prevRef.current, next)) {
      return prevRef.current as R
    }

    prevRef.current = next
    return next as R
  }

  return useStore
}

export {
  model,
  action,
  useAction,
  useModel,
  create,
  silent,
  MuchaProvider,
  query,
  keepPreviousData,
}

export type { Query, PlaceholderData, QueryDefaultOptions, QueryQueryOptions }
