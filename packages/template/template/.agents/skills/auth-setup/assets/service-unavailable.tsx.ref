'use client'

import { RefreshCw, ServerCrash } from 'lucide-react'

import { Button } from '@/lib/components/ui/button'

type ServiceUnavailableProps = {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ServiceUnavailable({
  title = '서비스를 불러오지 못했어요',
  description = '일시적인 연결 문제일 수 있습니다. 잠시 후 다시 시도해주세요.',
  onRetry,
}: ServiceUnavailableProps) {
  const handleRetry = onRetry ?? (() => window.location.reload())

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12 text-foreground">
      <section
        aria-live="assertive"
        className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card"
        role="alert"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive-surface text-destructive-surface-foreground">
          <ServerCrash aria-hidden="true" className="size-6" />
        </div>
        <h1 className="mt-5 text-title-lg font-semibold text-balance">{title}</h1>
        <p className="mt-2 text-body text-soft-foreground text-balance">
          {description}
        </p>
        <Button className="mt-6" onClick={handleRetry} type="button">
          <RefreshCw aria-hidden="true" />
          다시 시도
        </Button>
      </section>
    </main>
  )
}
