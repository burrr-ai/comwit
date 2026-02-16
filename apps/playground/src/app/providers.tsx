'use client'

import { MuchaProvider } from 'muchajs'
import { useRouter } from 'next/navigation'

export function Providers({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    return (
        <MuchaProvider
            actionContext={{
                router,
            }}
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
