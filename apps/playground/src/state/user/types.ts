import { Resource } from 'muchajs'

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
    me: Resource.Single<DemoUser>
    collaborators: Resource.Page<DemoUser[]>
}

export type UserActions = {
    bootstrap(): Promise<void>
    loadFirstCollaborators(): Promise<void>
    loadNextCollaborators(): Promise<void>
    reloadUser(): Promise<void>
    refreshMe(): Promise<void>
}
