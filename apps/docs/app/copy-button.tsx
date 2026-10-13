'use client'

import { useCopy } from '@/i18n/copy'

import { Button } from '@comwit/ui-templates/button'
import { useEffect, useRef, useState } from 'react'

export function CopyButton({
  text,
  children,
  className = '',
  label,
}: {
  text: string
  children: React.ReactNode
  className?: string
  label?: string
}) {
  const localize = useCopy()

  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current)
    },
    []
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <Button
      variant="plain"
      size="none"
      type="button"
      onClick={copy}
      className={className}
      aria-label={label ? localize(label) : undefined}
    >
      <span aria-hidden={status !== 'idle'}>
        {status === 'copied'
          ? localize('Copied!')
          : status === 'error'
            ? localize('Try again')
            : children}
      </span>
      <span className="sr-only" role="status">
        {status === 'copied'
          ? localize('Copied to clipboard')
          : status === 'error'
            ? localize('Could not copy. Try again.')
            : ''}
      </span>
    </Button>
  )
}
