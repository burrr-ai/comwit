import 'server-only'

export type PageRequest = {
  page: number
  limit: number
}

export type Pageable<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
