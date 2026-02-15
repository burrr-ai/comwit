'use server'

import type { DemoUser } from '@/state/user/types'

type CollaboratorsInput = {
    page?: number
    pageSize?: number
    forceFail?: boolean
}

const DEMO_ME: DemoUser = {
    id: 'u-001',
    username: 'daeseung',
    displayName: 'daeseung',
    email: 'tmdeoans@snu.ac.kr',
    organization: 'SNU',
    role: 'owner',
    joinedAt: '2024-04-01',
}

const DEMO_COLLABORATORS: DemoUser[] = new Array(11).fill(null).map((_, index) => ({
    id: `c-${index + 1}`,
    username: `member${index + 1}`,
    displayName: `Collaborator ${index + 1}`,
    email: `member${index + 1}@example.com`,
    organization: index % 2 === 0 ? 'Mucha Labs' : 'Freelance',
    role: index % 3 === 0 ? 'owner' : 'member',
    joinedAt: `2024-12-${String((index % 28) + 1).padStart(2, '0')}`,
}))

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function randomDelay() {
    return wait(1900 + Math.random() * 300)
}

function clone<T>(value: T): T {
    return structuredClone(value)
}

function maybeFail(action: string, forceFail?: boolean) {
    if (forceFail) {
        throw new Error(`[mock server error] ${action}`)
    }
}

export async function getCurrentUser(forceFail?: boolean): Promise<DemoUser> {
    await randomDelay()
    maybeFail('getCurrentUser', forceFail)
    return clone(DEMO_ME)
}

export async function getCollaborators(input: CollaboratorsInput = {}): Promise<{
    data: DemoUser[]
    page: number
    totalPage: number
    totalCount: number
}> {
    const page = Math.max(1, input.page ?? 1)
    const pageSize = Math.max(1, input.pageSize ?? 4)

    await randomDelay()
    maybeFail('getCollaborators', input.forceFail)

    const start = (page - 1) * pageSize
    const data = DEMO_COLLABORATORS.slice(start, start + pageSize)

    return clone({
        data,
        page,
        totalPage: Math.ceil(DEMO_COLLABORATORS.length / pageSize),
        totalCount: DEMO_COLLABORATORS.length,
    })
}
