import { model, Model, useModel, type ModelOptions, type ValidationState } from './model'
import { action, ActionFactory, useAction } from './action'
import { ComwitProvider, type RegistryDefaults } from './provider'
import { silent } from './silent'
import {
  keepPreviousData,
  PlaceholderData,
  Query,
  QueryDefaultOptions,
  QueryQueryOptions,
  query,
} from './query'

// Plugin system
export { registerPlugin, getPlugins } from './plugin'
export type { FieldPlugin, PluginBag } from './plugin'

function create<S extends object, A>(
  m: Model<S>,
  options: { actions: ActionFactory<Partial<A>, any>[] }
) {
  function useStore(): S & { actions: A }
  function useStore<R>(selector: (state: S & { actions: A }) => R): R
  function useStore<R>(selector?: (state: S & { actions: A }) => R) {
    const actions = useAction<A>(options.actions)
    const withActions = (state: S): S & { actions: A } => ({
      ...state,
      actions,
    })

    const finalSelector = selector
      ? (state: S) => selector(withActions(state))
      : (state: S) => withActions(state) as unknown as R

    return useModel(m, finalSelector)
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
  ComwitProvider,
  query,
  keepPreviousData,
}

export type {
  Query,
  PlaceholderData,
  QueryDefaultOptions,
  QueryQueryOptions,
  RegistryDefaults,
  ModelOptions,
  ValidationState,
}
