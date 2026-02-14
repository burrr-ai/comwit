'use client'

import { StateProvider } from 'muchajs'

export function Providers({ children }: { children: React.ReactNode }) {
    return <StateProvider>{children}</StateProvider>
}
