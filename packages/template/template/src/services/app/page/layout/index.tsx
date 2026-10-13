import { user } from '@/services/app/api/user'
import { AppLayoutClient } from './client'

/**
 * Await basic user data below the parent App Router Suspense(fallback=null).
 * TODO(auth-setup): Replace the getMe mock with Better Auth session/basic profile reads.
 * Load separate member/business tables lazily through separate queries, without awaiting them here.
 */
export async function AppLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await user.getMe()
  return <AppLayoutClient initialUser={initialUser}>{children}</AppLayoutClient>
}
