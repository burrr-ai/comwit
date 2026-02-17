import { Query } from 'comwit'

export type DemoUser = {
  id: string
  username: string
  displayName: string
  email: string
  organization: string
  role: 'owner' | 'member'
  joinedAt: string
}

export type UserState = {
  me: Query<DemoUser>
  collaborators: Query<
    {
      data: DemoUser[]
      page: number
      totalPage: number
      totalCount: number
    },
    { page?: number }
  >
}

export type UserActions = {
  bootstrap(): Promise<void>
  loadFirstCollaborators(): Promise<void>
  loadNextCollaborators(): Promise<void>
  reloadUser(): Promise<void>
  refreshMe(): Promise<void>
}
