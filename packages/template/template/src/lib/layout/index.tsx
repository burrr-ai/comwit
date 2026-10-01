import { RootLayoutClient } from './client'

/**
 * RootLayout Component (Server Component)
 *
 * Global root layout for the entire application.
 * Handles only global concerns (providers, toasts, etc.)
 * User authentication is handled in each service's layout.
 */
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayoutClient>
      {children}
    </RootLayoutClient>
  )
}
