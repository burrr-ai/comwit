'use client'

import { StateProvider } from '@meursyphus/yoshi'

export function Providers({ children }: { children: React.ReactNode }) {
    return <StateProvider>{children}</StateProvider>
}
