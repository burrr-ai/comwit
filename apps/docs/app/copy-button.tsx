'use client'

import { useEffect, useRef, useState } from 'react'

export function CopyButton({
  text,
  children,
  className = '',
}: {
  text: string
  children: React.ReactNode
  className?: string
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
    <button type="button" onClick={copy} className={className}>
      {children}
      <span className="copy-status" aria-live="polite">
        {status === 'copied' ? 'Copied!' : status === 'error' ? 'Could not copy' : 'Copy'}
      </span>
    </button>
  )
}
