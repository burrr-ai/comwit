import { createContext, useContext, useRef, type ReactNode } from 'react';
import { wrapReactive } from './reactive';

export type StateFactory<TState> = () => TState;

export type ReactiveRecord<TState> = {
  proxy: TState;
  subscribe(listener: () => void): () => void;
  getSnapshot(): TState;
};

export const STATE_FACTORY_KEY = Symbol('yoshi.stateFactory');

export class Registry {
  private instances = new Map<Function, ReactiveRecord<unknown>>();

  resolve<TState extends object>(factory: StateFactory<TState>): ReactiveRecord<TState> {
    const cached = this.instances.get(factory);
    if (cached) {
      return cached as ReactiveRecord<TState>;
    }

    const record = wrapReactive(factory());
    this.instances.set(factory, record);
    return record as ReactiveRecord<TState>;
  }
}

export const RegistryContext = createContext<Registry | null>(null);

export function useRegistry() {
  const registry = useContext(RegistryContext);
  if (!registry) {
    throw new Error('StateProvider is required in the React tree.');
  }
  return registry;
}

export function StateProvider({ children }: { children: ReactNode }) {
  const registry = useRef(new Registry()).current;

  return <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>;
}
