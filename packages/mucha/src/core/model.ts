import { isResourceDescriptor, ResourceDescriptorMap } from './query'

export function model<T extends object>(initial: T): Model<T> {
    const resources: ResourceDescriptorMap = new Map()
    const template = normalize(initial as Record<string, unknown>, '', resources)

    return {
        key: Symbol(),
        resources,
        instance() {
            return structuredClone(template) as T
        }
    }
}

export type Model<T extends object> = {
    key: symbol
    resources: ResourceDescriptorMap
    instance(): T
}

function normalize(value: unknown, path: string, resources: ResourceDescriptorMap): unknown {
    if (isResourceDescriptor(value)) {
        if (!path) throw new Error('query() entry must be assigned to a model field')
        resources.set(path, value)
        return value.initialState
    }

    if (!value || typeof value !== 'object') return value

    if (Array.isArray(value)) {
        return value.map((item, index) => normalize(item, `${path}[${index}]`, resources))
    }

    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value)) {
        const nextPath = path ? `${path}.${key}` : key
        out[key] = normalize((value as Record<string, unknown>)[key], nextPath, resources)
    }

    return out
}
