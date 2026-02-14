'use client'

import { StateProvider } from 'mucha'

export function Providers({ children }: { children: React.ReactNode }) {
    return <StateProvider>{children}</StateProvider>
}
