'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@comwit/ui-templates/lib/utils'

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1400)
    return () => clearTimeout(timer)
  }, [copied])
  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
        } catch {
          /* clipboard 가 막힌 환경은 무시 */
        }
      }}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-current opacity-60 transition-[opacity,background-color] duration-fast outline-none hover:bg-white/10 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span className="sr-only" role="status">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  )
}
