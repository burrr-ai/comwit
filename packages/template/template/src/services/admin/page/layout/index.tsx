import { adminUser } from '@/services/admin/api/user'
import { AdminLayoutClient } from './client'

/**
 * 상위 app-router의 Suspense(fallback=null) 아래에서 관리자 기본 정보를 기다린다.
 * TODO(auth-setup): getMe mock을 Better Auth 세션/기본 프로필 조회로 교체하고
 * 보호 라우트에 서버 세션 guard를 연결한다. 별도 테이블 데이터는 지연 로드한다.
 */
export async function AdminLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await adminUser.getMe()
  return <AdminLayoutClient initialUser={initialUser}>{children}</AdminLayoutClient>
}
