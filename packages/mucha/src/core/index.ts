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
    const actions = useAction<A>(options.actions)

    if (selector) {
      return useModel(m, (state: S) => selector({ ...state, actions } as S & { actions: A })) as R
    }

    return useModel(m, (state: S) => ({ ...state, actions }) as S & { actions: A })
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
