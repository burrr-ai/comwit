import { registerPlugin, type FieldPlugin, type PluginBag } from '../plugin'
import { isResourceDescriptor } from './descriptor'
import { bindResourceState } from './bind'
import { checkSuspense } from './suspense'
import { createQueryBindingRegistry } from './registry'
import type {
  AnyResourceDescriptor,
  QueryBindingRegistry,
  QueryDefaultOptions,
  ResourceDescriptorMap,
} from './types'

export const QUERY_PLUGIN_NAME = 'query'

export const queryPlugin: FieldPlugin = {
  name: QUERY_PLUGIN_NAME,

  detect(value: unknown, path: string, bag: PluginBag) {
    if (!isResourceDescriptor(value)) return null
    if (!path) throw new Error('query() entry must be assigned to a model field')
    bag.set(path, value)
    return { initialValue: value.initialState }
  },

  createRegistryState(_defaults?: Record<string, unknown>): QueryBindingRegistry {
    return createQueryBindingRegistry()
  },

  bindState(
    proxy: object,
    bag: PluginBag,
    registryState: unknown,
    defaults?: Record<string, unknown>
  ): object {
    if (bag.size === 0) return proxy
    const descriptors = bag as ResourceDescriptorMap
    return bindResourceState(
      proxy as any,
      descriptors,
      defaults as QueryDefaultOptions | undefined,
      registryState as QueryBindingRegistry
    )
  },

  onRender(bag: PluginBag, registryState: unknown): void {
    if (bag.size === 0) return
    const descriptors = bag as ResourceDescriptorMap
    checkSuspense(descriptors, registryState as QueryBindingRegistry)
  },
}

// Registration is done explicitly by model.ts to avoid side-effect import issues
