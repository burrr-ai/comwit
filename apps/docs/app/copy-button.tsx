'use client'

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
    <button type="button" onClick={copy} className={className} aria-label={label}>
      <span aria-hidden={status !== 'idle'}>
        {status === 'copied' ? 'Copied!' : status === 'error' ? 'Try again' : children}
      </span>
      <span className="sr-only" role="status">
        {status === 'copied'
          ? 'Copied to clipboard'
          : status === 'error'
            ? 'Could not copy. Try again.'
            : ''}
      </span>
    </button>
  )
}
