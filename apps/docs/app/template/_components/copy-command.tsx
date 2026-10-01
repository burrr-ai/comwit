'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'

/** The install line with a copy button. Local to Template so the section imports nothing from UI. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1400)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <div className="tp-command">
      <code>
        <span className="tp-command-prompt" aria-hidden="true">
          $
        </span>
        {command}
      </code>
      <button
        type="button"
        aria-label={copied ? 'Copied' : 'Copy command'}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command)
            setCopied(true)
          } catch {
            /* clipboard 가 막힌 환경은 무시 */
          }
        }}
      >
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        <span className="sr-only" role="status">
          {copied ? 'Copied to clipboard' : ''}
        </span>
      </button>
    </div>
  )
}
