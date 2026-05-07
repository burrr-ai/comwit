import { snapshot, subscribeOps, type Path, type ProxyOp } from './proxy'

export type HistoryOptions = {
  limit?: number
}

export type HistoryConfig = boolean | HistoryOptions

export type HistoryApi = {
  canUndo: boolean
  canRedo: boolean
  isPaused: boolean
  undo(steps?: number): void
  redo(steps?: number): void
  clear(): void
  pause(): void
  resume(): void
  ignore<T>(fn: () => T): T
  transaction<T>(fn: () => T): T
  transaction<T>(label: string, fn: () => T): T
}

type HistoryPatch =
  | {
      op: 'set'
      path: Path
      value: unknown
      arrayLength?: number
    }
  | {
      op: 'delete'
      path: Path
      arrayLength?: number
    }

type HistoryEntry = {
  label?: string
  patches: HistoryPatch[]
  inversePatches: HistoryPatch[]
}

type HistoryTransaction = {
  label?: string
  entries: Map<HistoryController, ProxyOp[]>
}

let ignoreDepth = 0
const transactions: HistoryTransaction[] = []

export function normalizeHistoryOptions(config: HistoryConfig | undefined): HistoryOptions | null {
  if (!config) return null
  if (config === true) return {}
  return config
}

export function runHistoryTransaction<T>(label: string | undefined, fn: () => T): T {
  const tx: HistoryTransaction = { label, entries: new Map() }
  transactions.push(tx)

  let result: T
  try {
    result = fn()
  } catch (error) {
    transactions.pop()
    throw error
  }

  if (isThenable(result)) {
    return result.then(
      (value) => {
        finishTransaction(tx, true)
        return value
      },
      (error) => {
        finishTransaction(tx, false)
        throw error
      }
    ) as T
  }

  finishTransaction(tx, true)
  return result
}

export function runHistoryIgnored<T>(fn: () => T): T {
  ignoreDepth++
  try {
    return fn()
  } finally {
    ignoreDepth--
  }
}

export function recordHistoryOp(controller: HistoryController, op: ProxyOp | undefined): void {
  if (!op || ignoreDepth > 0 || controller.isApplying || controller.isPaused) return
  const tx = transactions[transactions.length - 1]
  if (!tx) return

  const ops = tx.entries.get(controller)
  if (ops) {
    ops.push(cloneProxyOp(op))
  } else {
    tx.entries.set(controller, [cloneProxyOp(op)])
  }
}

function finishTransaction(tx: HistoryTransaction, shouldCommit: boolean): void {
  const top = transactions.pop()
  if (top !== tx) {
    throw new Error('[comwit] history transaction stack is corrupted')
  }

  if (!shouldCommit) return

  const parent = transactions[transactions.length - 1]
  if (parent) {
    for (const [controller, ops] of tx.entries) {
      const existing = parent.entries.get(controller)
      if (existing) existing.push(...ops)
      else parent.entries.set(controller, ops)
    }
    return
  }

  for (const [controller, ops] of tx.entries) {
    controller.commit(ops, tx.label)
  }
}

function isThenable<T>(value: unknown): value is PromiseLike<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as PromiseLike<T>).then === 'function'
  )
}

export class HistoryController {
  readonly apiMethods: Omit<HistoryApi, 'canUndo' | 'canRedo' | 'isPaused'>

  private past: HistoryEntry[] = []
  private future: HistoryEntry[] = []
  private listeners = new Set<() => void>()
  private cleanup: (() => void) | null = null
  private paused = false
  private applying = false
  private readonly limit: number | null

  constructor(
    private readonly proxy: object,
    options: HistoryOptions = {}
  ) {
    this.limit = typeof options.limit === 'number' && options.limit >= 0 ? options.limit : null
    this.apiMethods = {
      undo: (steps) => this.undo(steps),
      redo: (steps) => this.redo(steps),
      clear: () => this.clear(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      ignore: (fn) => runHistoryIgnored(fn),
      transaction: ((labelOrFn: string | (() => unknown), maybeFn?: () => unknown) => {
        const label = typeof labelOrFn === 'string' ? labelOrFn : undefined
        const fn = typeof labelOrFn === 'string' ? maybeFn! : labelOrFn
        return runHistoryTransaction(label, fn)
      }) as HistoryApi['transaction'],
    }

    this.cleanup = subscribeOps(proxy, (op) => recordHistoryOp(this, op))
  }

  get isApplying(): boolean {
    return this.applying
  }

  get isPaused(): boolean {
    return this.paused
  }

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  getApi(): HistoryApi {
    return {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      isPaused: this.isPaused,
      ...this.apiMethods,
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  destroy(): void {
    this.cleanup?.()
    this.cleanup = null
    this.listeners.clear()
  }

  commit(ops: ProxyOp[], label?: string): void {
    const entry = createHistoryEntry(ops, label)
    if (!entry) return

    this.past.push(entry)
    if (this.limit !== null && this.past.length > this.limit) {
      this.past.splice(0, this.past.length - this.limit)
    }
    this.future = []
    this.notify()
  }

  undo(steps = 1): void {
    const count = normalizeStepCount(steps)
    for (let i = 0; i < count; i++) {
      const entry = this.past.pop()
      if (!entry) break
      this.apply(entry.inversePatches)
      this.future.push(entry)
    }
    this.notify()
  }

  redo(steps = 1): void {
    const count = normalizeStepCount(steps)
    for (let i = 0; i < count; i++) {
      const entry = this.future.pop()
      if (!entry) break
      this.apply(entry.patches)
      this.past.push(entry)
    }
    this.notify()
  }

  clear(): void {
    if (!this.past.length && !this.future.length) return
    this.past = []
    this.future = []
    this.notify()
  }

  pause(): void {
    if (this.paused) return
    this.paused = true
    this.notify()
  }

  resume(): void {
    if (!this.paused) return
    this.paused = false
    this.notify()
  }

  private apply(patches: HistoryPatch[]): void {
    this.applying = true
    try {
      for (const patch of patches) {
        applyPatch(this.proxy, patch)
      }
    } finally {
      this.applying = false
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener())
  }
}

export function createHistoryController(proxy: object, options: HistoryOptions): HistoryController {
  return new HistoryController(proxy, options)
}

function createHistoryEntry(ops: ProxyOp[], label?: string): HistoryEntry | null {
  const patches: HistoryPatch[] = []
  const inversePatches: HistoryPatch[] = []

  for (const op of ops) {
    const patch = toPatch(op)
    if (!patch) continue
    patches.push(patch.patch)
    inversePatches.unshift(patch.inversePatch)
  }

  if (!patches.length) return null
  return { label, patches, inversePatches }
}

function toPatch(op: ProxyOp): { patch: HistoryPatch; inversePatch: HistoryPatch } | null {
  if (op[0] === 'set') {
    const [, path, value, prevValue, hadPrevValue, meta] = op
    const patch: HistoryPatch = {
      op: 'set',
      path: [...path],
      value: cloneHistoryValue(value),
      arrayLength: meta?.nextLength,
    }
    const inversePatch: HistoryPatch = hadPrevValue
      ? {
          op: 'set',
          path: [...path],
          value: cloneHistoryValue(prevValue),
          arrayLength: meta?.prevLength,
        }
      : {
          op: 'delete',
          path: [...path],
          arrayLength: meta?.prevLength,
        }
    return { patch, inversePatch }
  }

  const [, path, prevValue, hadPrevValue] = op
  if (!hadPrevValue) return null
  return {
    patch: { op: 'delete', path: [...path] },
    inversePatch: { op: 'set', path: [...path], value: cloneHistoryValue(prevValue) },
  }
}

function applyPatch(root: object, patch: HistoryPatch): void {
  const parent = getPatchParent(root, patch.path)
  if (!parent) return

  const key = patch.path[patch.path.length - 1]
  if (patch.op === 'set') {
    Reflect.set(parent, key, cloneHistoryValue(patch.value))
  } else {
    Reflect.deleteProperty(parent, key)
  }

  if (typeof patch.arrayLength === 'number' && Array.isArray(parent)) {
    parent.length = patch.arrayLength
  }
}

function getPatchParent(root: object, path: Path): any {
  if (!path.length) return null

  let current: any = root
  for (let i = 0; i < path.length - 1; i++) {
    current = current?.[path[i]]
    if (current === null || current === undefined) return null
  }
  return current
}

function cloneProxyOp(op: ProxyOp): ProxyOp {
  if (op[0] === 'set') {
    const [, path, value, prevValue, hadPrevValue, meta] = op
    return [
      'set',
      [...path],
      cloneHistoryValue(value),
      cloneHistoryValue(prevValue),
      hadPrevValue,
      meta ? { ...meta } : undefined,
    ]
  }

  const [, path, prevValue, hadPrevValue, meta] = op
  return [
    'delete',
    [...path],
    cloneHistoryValue(prevValue),
    hadPrevValue,
    meta ? { ...meta } : undefined,
  ]
}

function cloneHistoryValue(value: unknown): unknown {
  if (value && typeof value === 'object') {
    try {
      return structuredClone(snapshot(value as object))
    } catch {}
    try {
      return structuredClone(value)
    } catch {
      return value
    }
  }
  return value
}

function normalizeStepCount(steps: number): number {
  if (!Number.isFinite(steps)) return 1
  return Math.max(0, Math.floor(steps))
}
