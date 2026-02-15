'use client'

import { MuchaProvider } from 'muchajs'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <MuchaProvider
            defaultOptions={{
                query: {
                    staleTime: 60_000,
                },
            }}
        >
            {children}
        </MuchaProvider>
    )
}
