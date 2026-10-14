import { adminUser } from '@/services/admin/api/user'
import { AdminLayoutClient } from './client'

/**
 * Await basic admin data below the parent App Router Suspense(fallback=null).
 * TODO(auth-setup): Replace the getMe mock with Better Auth session/basic profile reads
 * and add server session guards to protected routes. Load separate tables lazily.
 */
export async function AdminLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await adminUser.getMe()
  return <AdminLayoutClient initialUser={initialUser}>{children}</AdminLayoutClient>
}
