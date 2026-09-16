export type RouterSnapshotInput = {
  pathname: string
  searchParams?:
    | string
    | URLSearchParams
    | Readonly<Record<string, string | readonly string[] | undefined>>
  hash?: string
}

/** Pure serializer suitable for Server Components and framework route loaders. */
export function createRouterSnapshot({
  pathname,
  searchParams,
  hash,
}: RouterSnapshotInput): string {
  const url = new URL(pathname, 'https://comwit.invalid')
  if (searchParams !== undefined) {
    if (typeof searchParams === 'string' || searchParams instanceof URLSearchParams) {
      url.search = new URLSearchParams(searchParams).toString()
    } else {
      const params = new URLSearchParams()
      for (const [key, values] of Object.entries(searchParams)) {
        if (typeof values === 'string') params.append(key, values)
        else for (const value of values ?? []) params.append(key, value)
      }
      url.search = params.toString()
    }
  }
  if (hash !== undefined) url.hash = hash
  return `${url.pathname}${url.search}${url.hash}`
}
