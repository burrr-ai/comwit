'use client'

import * as React from 'react'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import { cn } from '@comwit/ui-templates/lib/utils'
import { CopyButton } from './copy-button'

hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)

export function CodeBlock({
  code,
  language = 'tsx',
  className,
}: {
  code: string
  language?: 'tsx' | 'css'
  className?: string
}) {
  const html = React.useMemo(() => hljs.highlight(code, { language }).value, [code, language])
  return (
    <div className={cn('ui-code relative overflow-hidden rounded-control', className)}>
      <pre className="max-h-[480px] overflow-auto p-4 pr-12 font-mono text-[12.5px] leading-relaxed">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
      <div className="absolute top-1.5 right-1.5">
        <CopyButton text={code} label="Copy code" />
      </div>
    </div>
  )
}
