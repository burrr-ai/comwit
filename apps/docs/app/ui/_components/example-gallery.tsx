'use client'

import { useState } from 'react'
import { EXAMPLES } from '../_generated/examples'
import { CodeBlock } from './code-block'

export function ExampleGallery({ name }: { name: string }) {
  const examples = EXAMPLES[name] ?? []
  const [mode, setMode] = useState<'preview' | 'code'>('preview')
  if (!examples.length)
    return <p className="text-body-sm text-muted-foreground">See the source below for usage.</p>
  return (
    <div className="ui-examples">
      <div className="preview-controls" role="group" aria-label="Example display">
        <button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>
          Preview
        </button>
        <button aria-pressed={mode === 'code'} onClick={() => setMode('code')}>
          Code
        </button>
      </div>
      {examples.map((ex) => (
        <section key={ex.name} className="ui-example">
          <h3>{ex.name}</h3>
          {ex.description && <p className="text-body-sm text-muted-foreground">{ex.description}</p>}
          {mode === 'preview' ? (
            <div className="component-preview">
              <ex.Render />
            </div>
          ) : (
            <CodeBlock code={ex.code} />
          )}
        </section>
      ))}
    </div>
  )
}
