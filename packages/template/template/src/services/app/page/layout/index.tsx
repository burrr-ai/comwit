import { user } from '@/services/app/api/user'
import { AppLayoutClient } from './client'

/**
 * 상위 app-router의 Suspense(fallback=null) 아래에서 기본 사용자 정보를 기다린다.
 * TODO(auth-setup): getMe mock을 Better Auth 세션/기본 프로필 조회로 교체한다.
 * 별도 회원/업무 테이블 데이터는 여기서 기다리지 않고 별도 query로 지연 로드한다.
 */
export async function AppLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await user.getMe()
  return <AppLayoutClient initialUser={initialUser}>{children}</AppLayoutClient>
}
