'use client'

import * as React from 'react'
import { Icon, SearchIcon } from '@comwit/icons'
import { AnimatedIcon } from '@comwit/icons/animated'
import { iconCatalog } from '@comwit/icons/catalog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@comwit/ui-templates/dialog'

type Definition = (typeof iconCatalog)[number]
type Mode = 'motion' | 'static'

const colors = [
  { name: 'Ink', value: 'currentColor' },
  { name: 'Blue', value: '#0b68ba' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Coral', value: '#dc6548' },
] as const
const categories = [...new Set(iconCatalog.map((icon) => icon.category))].sort()
const labelFor = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const categoryLabel = (category: string) =>
  category.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = React.useState<'idle' | 'copied' | 'error'>('idle')
  const request = React.useRef(0)

  React.useEffect(() => {
    return () => {
      request.current += 1
    }
  }, [])

  async function copy() {
    const id = ++request.current
    try {
      await navigator.clipboard.writeText(text)
      if (id === request.current) setStatus('copied')
    } catch {
      if (id === request.current) setStatus('error')
    }
  }

  return (
    <span className="icons-copy-control">
      <button type="button" className="icons-small-button" onClick={copy}>
        {status === 'copied' ? 'Copied' : label}
      </button>
      <span className={status === 'error' ? 'icons-copy-error' : 'sr-only'} role="status">
        {status === 'copied'
          ? `${label} copied to clipboard.`
          : status === 'error'
            ? 'Could not copy. Select the code to copy it manually.'
            : ''}
      </span>
    </span>
  )
}

function CodeSnippet({ code, label }: { code: string; label: string }) {
  return (
    <div className="icons-code-block">
      <div className="icons-code-heading">
        <CopyButton key={code} text={code} label={label} />
      </div>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function IconGallery() {
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const [size, setSize] = React.useState(40)
  const [color, setColor] = React.useState<string>('currentColor')
  const [mode, setMode] = React.useState<Mode>('motion')
  const [selected, setSelected] = React.useState<Definition | null>(null)
  const [open, setOpen] = React.useState(false)
  const [replayKey, setReplayKey] = React.useState(0)
  const lastTrigger = React.useRef<HTMLButtonElement | null>(null)
  const searchRef = React.useRef<HTMLInputElement | null>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visible = iconCatalog.filter((icon) => {
    const searchable =
      `${icon.name} ${labelFor(icon.name)} ${icon.category} ${icon.tags.join(' ')}`.toLocaleLowerCase()
    return (
      (category === 'all' || icon.category === category) &&
      normalizedQuery.split(/\s+/).every((word) => searchable.includes(word))
    )
  })
  const componentName = selected ? `${mode === 'motion' ? 'Animated' : ''}${selected.name}Icon` : ''
  const importCode = `import { ${componentName} } from '@comwit/icons${mode === 'motion' ? '/animated' : ''}'`
  const usageCode = `<${componentName}\n  size={${size}}${color !== 'currentColor' ? `\n  color="${color}"` : ''}${mode === 'motion' ? '\n  animateOn="hover"' : ''}\n/>`

  return (
    <div className="icons-page">
      <header className="icons-header">
        <h1 className="text-display-lg">Icons</h1>
      </header>

      <section aria-label="Browse icons" className="icons-browser">
        <div className="icons-search">
          <SearchIcon size={21} />
          <input
            ref={searchRef}
            type="search"
            aria-label="Search icons by name or keyword"
            placeholder="Search icons…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              className="icons-clear"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              aria-label="Clear icon search"
            >
              Clear
            </button>
          )}
        </div>

        <div className="icons-toolbar">
          <label className="icons-select-label">
            <span className="sr-only">Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All icons</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {categoryLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <div className="icons-preview-controls">
            <label className="icons-select-label">
              <span className="sr-only">Size</span>
              <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
                {[24, 32, 40, 48].map((value) => (
                  <option key={value} value={value}>
                    {value}px
                  </option>
                ))}
              </select>
            </label>
            <div className="icons-colors" role="group" aria-label="Icon color">
              {colors.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  title={item.name}
                  aria-label={`${item.name} icons`}
                  aria-pressed={color === item.value}
                  className="icons-color"
                  style={{ '--icon-swatch': item.value } as React.CSSProperties}
                  onClick={() => setColor(item.value)}
                >
                  <span />
                </button>
              ))}
            </div>
            <div className="icons-mode" role="group" aria-label="Preview mode">
              <button
                type="button"
                aria-pressed={mode === 'static'}
                onClick={() => setMode('static')}
              >
                Static
              </button>
              <button
                type="button"
                aria-pressed={mode === 'motion'}
                onClick={() => setMode('motion')}
              >
                Motion
              </button>
            </div>
          </div>
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'icon' : 'icons'}
        </span>

        {visible.length ? (
          <ul className="icons-grid">
            {visible.map((definition) => (
              <li key={definition.name}>
                <button
                  type="button"
                  data-icon-trigger
                  className="icons-card"
                  aria-label={`Preview ${labelFor(definition.name)} icon`}
                  aria-haspopup="dialog"
                  onClick={(event) => {
                    lastTrigger.current = event.currentTarget
                    setSelected(definition)
                    setReplayKey((key) => key + 1)
                    setOpen(true)
                  }}
                >
                  <span className="icons-card-stage">
                    {mode === 'motion' ? (
                      <AnimatedIcon
                        definition={definition}
                        size={size}
                        color={color}
                        animateOn="hover"
                      />
                    ) : (
                      <Icon definition={definition} size={size} color={color} />
                    )}
                  </span>
                  <span className="icons-card-name">{labelFor(definition.name)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="icons-empty">
            <p>No icons found.</p>
            <button
              className="icons-small-button"
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('all')
                searchRef.current?.focus()
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="icons-detail"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            lastTrigger.current?.focus()
          }}
        >
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{labelFor(selected.name)}</DialogTitle>
                <DialogDescription className="sr-only">
                  {categoryLabel(selected.category)} · {mode === 'motion' ? 'Animated' : 'Static'}{' '}
                  icon
                </DialogDescription>
              </DialogHeader>
              <div className="icons-detail-stage">
                {mode === 'motion' ? (
                  <AnimatedIcon
                    definition={selected}
                    size={64}
                    color={color}
                    animateOn="mount"
                    replayKey={replayKey}
                  />
                ) : (
                  <Icon definition={selected} size={64} color={color} />
                )}
                {mode === 'motion' && (
                  <button
                    className="icons-replay"
                    type="button"
                    onClick={() => setReplayKey((key) => key + 1)}
                    aria-label={`Replay ${labelFor(selected.name)} animation`}
                  >
                    ↻ Replay
                  </button>
                )}
              </div>
              <CodeSnippet code={`${importCode}\n\n${usageCode}`} label="Copy code" />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
