'use client'

import { Copy, useCopy } from '@/i18n/copy'

import { Button } from '@comwit/ui-templates/button'
import * as React from 'react'
import { CheckIcon, CopyIcon } from '@comwit/ui/icons'

/** The template install line with a shared UI copy button. */
export function CopyCommand({ command }: { command: string }) {
  const localize = useCopy()

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
      <Button
        variant="plain"
        size="none"
        type="button"
        aria-label={localize(copied ? 'Copied' : 'Copy command')}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command)
            setCopied(true)
          } catch {
            /* Ignore environments where clipboard access is unavailable. */
          }
        }}
      >
        {copied ? <CheckIcon size={16} aria-hidden /> : <CopyIcon size={16} aria-hidden />}
        <span className="sr-only" role="status">
          <Copy text={copied ? 'Copied to clipboard' : ''} />
        </span>
      </Button>
    </div>
  )
}
