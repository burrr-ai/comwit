import { model, Model, useModel, type ModelOptions, type ValidationState } from './model'
import { action, ActionFactory, useAction } from './action'
import { ComwitProvider, type RegistryDefaults } from './provider'
import { silent } from './silent'
import { snapshot, isProxy, type Snapshotable } from './proxy'
import {
  keepPreviousData,
  PlaceholderData,
  Query,
  QueryDefaultOptions,
  QueryQueryOptions,
  SelectableResourceState,
  query,
} from './query'

// Plugin system
import { registerPlugin } from './plugin'
import { queryPlugin } from './query/plugin'
export { registerPlugin, getPlugins } from './plugin'
export type { FieldPlugin, PluginBag } from './plugin'

import { persistPlugin } from './persist'
import { persist, type PersistAdapter, type PersistOptions, type PersistDefaults } from './persist'
import { initDevTools } from './devtools'
import type { HistoryApi, HistoryOptions, HistoryConfig } from './history'

import { computedPlugin } from './computed'
import { computed } from './computed'

// Register built-in plugins
registerPlugin(queryPlugin)
registerPlugin(persistPlugin)
registerPlugin(computedPlugin)

function create<S extends object, A>(
  m: Model<S>,
  options: { actions: ActionFactory<Partial<A>, any>[] }
) {
  type SelectableState = SelectableResourceState<S>

  function useStore(): S & { actions: A }
  function useStore<R>(selector: (state: SelectableState & { actions: A }) => R): R
  function useStore<R>(selector?: (state: SelectableState & { actions: A }) => R) {
    const actions = useAction<A>(options.actions)
    const withActions = (state: SelectableState): SelectableState & { actions: A } => ({
      ...state,
      actions,
    })

    const finalSelector = selector
      ? (state: SelectableState) => selector(withActions(state))
      : (state: SelectableState) => withActions(state) as unknown as R

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
  persist,
  computed,
  initDevTools,
  snapshot,
  isProxy,
}

export type {
  Query,
  PlaceholderData,
  QueryDefaultOptions,
  QueryQueryOptions,
  SelectableResourceState,
  RegistryDefaults,
  ModelOptions,
  ValidationState,
  PersistAdapter,
  PersistOptions,
  PersistDefaults,
  Snapshotable,
  HistoryApi,
  HistoryOptions,
  HistoryConfig,
}
