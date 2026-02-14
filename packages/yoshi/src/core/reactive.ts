import { produce } from 'immer';

type Listener = () => void;
type Path = ReadonlyArray<PropertyKey>;

type ReactiveRecord<TState> = {
  proxy: TState;
  subscribe(listener: Listener): () => void;
  getSnapshot(): TState;
};

const isObject = (value: unknown): value is Record<string | symbol, unknown> | any[] => {
  return typeof value === 'object' && value !== null;
};

export function wrapReactive<TState extends object>(initialState: TState): ReactiveRecord<TState> {
  let snapshot: TState = initialState;
  const mutableState: TState = structuredClone(initialState);
  const listeners = new Set<Listener>();

  const proxyByTarget = new WeakMap<object, any>();
  const rawByProxy = new WeakMap<object, object>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  const toRaw = (value: unknown) => {
    if (!isObject(value)) {
      return value;
    }

    return rawByProxy.get(value as object) ?? value;
  };

  const updateMutablePath = (path: Path, key: PropertyKey, value: unknown, target: object) => {
    (target as Record<PropertyKey, unknown>)[key] = value;
  };

  const updateSnapshotPath = (path: Path, key: PropertyKey, value: unknown) => {
    return produce(snapshot, (draft: any) => {
      let target = draft as any;
      for (const segment of path) {
        target = target[segment];
      }
      target[key] = value;
    });
  };

  const createProxy = (target: object, path: Path): any => {
    const cached = proxyByTarget.get(target);
    if (cached) {
      return cached;
    }

    const proxy = new Proxy(target, {
      get(targetValue, key, receiver) {
        const value = Reflect.get(targetValue, key, receiver);
        if (!isObject(value) || typeof key === 'symbol') {
          return value;
        }

        return createProxy(value as object, [...path, key]);
      },
      set(targetValue, key, value) {
        const rawValue = toRaw(value);
        const nextSnapshot = updateSnapshotPath(path, key, rawValue);

        if (Object.is(snapshot, nextSnapshot)) {
          return true;
        }

        updateMutablePath(path, key, rawValue, targetValue);
        snapshot = nextSnapshot;
        notify();
        return true;
      },
      deleteProperty(targetValue, key) {
        if (!(key in targetValue)) {
          return true;
        }

        const nextSnapshot = produce(snapshot, (draft: any) => {
          let target = draft as any;
          for (const segment of path) {
            target = target[segment];
          }
          delete target[key];
        });

        if (Object.is(snapshot, nextSnapshot)) {
          return true;
        }

        delete (targetValue as Record<PropertyKey, unknown>)[key];
        snapshot = nextSnapshot;
        notify();
        return true;
      },
    });

    rawByProxy.set(proxy, target);
    proxyByTarget.set(target, proxy);
    return proxy;
  };

  return {
    proxy: createProxy(mutableState, []),
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
  };
}
