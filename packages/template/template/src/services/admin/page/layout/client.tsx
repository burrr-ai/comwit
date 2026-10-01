'use client'

import { useAdminUser, type User } from '@/services/admin/state/user'
import { AdminLayoutContent } from './content'

export function AdminLayoutClient({ children, initialUser }: {
  children: React.ReactNode
  initialUser: User | null
}) {
  // 이 adapter는 사용자 상태를 구독하지 않는다. 구독/UI는 자식에서 처리한다.
  // 로그아웃 시 리렌더되며 오래된 서버 seed를 다시 주입하는 경로를 피한다.
  useAdminUser.hydrate({ me: { data: initialUser } })
  return <AdminLayoutContent>{children}</AdminLayoutContent>
}
