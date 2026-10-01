'use client'

import { useEffect } from 'react'

import { ServiceUnavailable } from '@/lib/components/service-unavailable'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error] unhandled render error', error)
  }, [error])

  return (
    <html lang="ko">
      <body>
        <ServiceUnavailable onRetry={reset} />
      </body>
    </html>
  )
}
