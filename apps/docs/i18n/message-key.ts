import english from '../messages/en.json'

const keys = new Map(
  Object.entries(english).flatMap(([namespace, messages]) =>
    Object.entries(messages).map(([key, value]) => [value, `${namespace}.${key}`] as const)
  )
)

/** Resolve copy shared by data-driven catalogs without translating API names or code. */
export function messageKey(text: string) {
  return keys.get(text)
}
