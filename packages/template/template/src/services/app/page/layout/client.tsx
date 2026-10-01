'use client'

import { useUser, type User } from '@/services/app/state/user'

/**
 * AppLayoutClient Component
 *
 * App 서비스 클라이언트 레이아웃:
 * - 서버에서 기다린 기본 사용자 정보를 첫 상태 읽기 전에 hydrate
 * - App UI (헤더, 네비게이션 등)
 *
 * TODO: 헤더, 사이드바, 푸터 등 App UI 컴포넌트 추가
 */
export function AppLayoutClient({ children, initialUser }: {
  children: React.ReactNode
  initialUser: User | null
}) {
  // 이 adapter에는 사용자 상태 구독을 추가하지 않는다. 구독/UI는 자식에서 처리한다.
  // null도 비로그인으로 확정된 성공 결과이므로 hydrate(null)로 생략하지 않는다.
  useUser.hydrate({ me: { data: initialUser } })

  return <>{children}</>
}
