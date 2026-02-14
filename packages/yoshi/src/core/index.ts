import { useRef, useSyncExternalStore } from 'react';
import { Prettify, UnionToIntersection } from '../utils';
import { STATE_FACTORY_KEY, useRegistry } from './provider';

type StateWithActions<State, Actions> = State & { actions: Actions };

type ActionFactory<State extends object, ReturnActions> = (
  model: State,
  inject: <OtherState extends object, OtherActions>(
    hook: StateHook<OtherState, OtherActions>,
  ) => OtherState,
) => ReturnActions;

type MergeActions<Factories extends readonly ActionFactory<any, any>[]> =
  Prettify<
    UnionToIntersection<Factories[number] extends ActionFactory<any, infer Result> ? Result : never>
  >;

export type StateHook<State extends object, Actions> = {
  <Selected>(selector?: (state: StateWithActions<State, Actions>) => Selected): Selected;
} & { [STATE_FACTORY_KEY]: () => State };

export function create<State extends object, Factories extends readonly ActionFactory<State, any>[]>(config: {
  state: () => State;
  actions: Factories;
}): StateHook<State, MergeActions<Factories>> {
  const { state, actions } = config;

  const hook = ((selector?: (state: StateWithActions<State, MergeActions<Factories>>) => unknown) => {
    const registry = useRegistry();
    const { proxy, subscribe, getSnapshot } = registry.resolve(state);
    const actionRef = useRef<StateWithActions<State, MergeActions<Factories>>['actions'] | null>(null);

    if (!actionRef.current) {
      const inject = <OtherState extends object, OtherActions>(
        hook: StateHook<OtherState, OtherActions>,
      ): OtherState => {
        const stateFactory = (hook as { [STATE_FACTORY_KEY]: () => OtherState })[STATE_FACTORY_KEY];
        if (typeof stateFactory !== 'function') {
          throw new Error('inject() can only receive hooks created by create().');
        }

        return registry.resolve(stateFactory).proxy;
      };

      actionRef.current = Object.assign({}, ...actions.map((factory) => factory(proxy, inject)));
    }

    const actionsValue = actionRef.current;
    return useSyncExternalStore(
      subscribe,
      () => {
        const merged = { ...getSnapshot(), actions: actionsValue } as StateWithActions<
          State,
          MergeActions<Factories>
        >;
        return selector ? selector(merged) : (merged as never);
      },
      () => {
        const merged = { ...getSnapshot(), actions: actionsValue } as StateWithActions<
          State,
          MergeActions<Factories>
        >;
        return selector ? selector(merged) : (merged as never);
      },
    ) as never;
  }) as StateHook<State, MergeActions<Factories>>;

  (hook as { [STATE_FACTORY_KEY]: () => State })[STATE_FACTORY_KEY] = state;
  return hook;
}
