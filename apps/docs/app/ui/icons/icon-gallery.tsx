'use client'

import { Copy, useCopy } from '@/i18n/copy'
import { useTranslations } from 'next-intl'

import { Button } from '@comwit/ui-templates/button'
import { Input } from '@comwit/ui-templates/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comwit/ui-templates/select'
import * as React from 'react'
import { Icon, SearchIcon } from '@comwit/ui/icons'
import { AnimatedIcon } from '@comwit/ui/icons/animated'
import { iconCatalog } from '@comwit/ui/icons/catalog'
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
  const copyText = useTranslations('Copy')
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
      <Button
        variant="plain"
        size="none"
        type="button"
        className="icons-small-button"
        onClick={copy}
      >
        <Copy text={status === 'copied' ? 'Copied' : label} />
      </Button>
      <span className={status === 'error' ? 'icons-copy-error' : 'sr-only'} role="status">
        {status === 'copied'
          ? copyText('copiedLabel', { label })
          : status === 'error'
            ? copyText('dynamic157')
            : ''}
      </span>
    </span>
  )
}

function CodeSnippet({ code, label }: { code: string; label: string }) {
  const localize = useCopy()

  return (
    <div className="icons-code-block">
      <div className="icons-code-heading">
        <CopyButton key={code} text={code} label={localize(label)} />
      </div>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function IconGallery() {
  const localize = useCopy()

  const copy = useTranslations('Copy')

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
  const importCode = `import { ${componentName} } from '@comwit/ui/icons${mode === 'motion' ? '/animated' : ''}'`
  const usageCode = `<${componentName}\n  size={${size}}${color !== 'currentColor' ? `\n  color="${color}"` : ''}${mode === 'motion' ? '\n  animateOn="hover"' : ''}\n/>`

  return (
    <div className="icons-page">
      <header className="icons-header">
        <h1 className="text-display-lg">
          <Copy id="text137" />
        </h1>
      </header>

      <section aria-label={copy('text138')} className="icons-browser">
        <div className="icons-search">
          <SearchIcon size={21} />
          <Input
            bare
            ref={searchRef}
            type="search"
            aria-label={copy('text139')}
            placeholder={copy('text140')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <Button
              variant="plain"
              size="none"
              type="button"
              className="icons-clear"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              aria-label={copy('text141')}
            >
              <Copy id="text142" />{' '}
            </Button>
          )}
        </div>

        <div className="icons-toolbar">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label={copy('text143')} className="icons-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <Copy id="text144" />
              </SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  <Copy text={categoryLabel(item)} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="icons-preview-controls">
            <Select value={String(size)} onValueChange={(value) => setSize(Number(value))}>
              <SelectTrigger aria-label={copy('text145')} className="icons-select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[24, 32, 40, 48].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="icons-colors" role="group" aria-label={copy('text147')}>
              {colors.map((item) => (
                <Button
                  variant="plain"
                  size="none"
                  key={item.name}
                  type="button"
                  title={localize(item.name)}
                  aria-label={copy('iconColor', { color: localize(item.name) })}
                  aria-pressed={color === item.value}
                  className="icons-color"
                  style={{ '--icon-swatch': item.value } as React.CSSProperties}
                  onClick={() => setColor(item.value)}
                >
                  <span />
                </Button>
              ))}
            </div>
            <div className="icons-mode" role="group" aria-label={copy('text148')}>
              <Button
                variant="plain"
                size="none"
                type="button"
                aria-pressed={mode === 'static'}
                onClick={() => setMode('static')}
              >
                <Copy id="text149" />{' '}
              </Button>
              <Button
                variant="plain"
                size="none"
                type="button"
                aria-pressed={mode === 'motion'}
                onClick={() => setMode('motion')}
              >
                <Copy id="text150" />{' '}
              </Button>
            </div>
          </div>
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          {copy('iconCount', { count: visible.length })}
        </span>

        {visible.length ? (
          <ul className="icons-grid">
            {visible.map((definition) => (
              <li key={definition.name}>
                <Button
                  variant="plain"
                  size="none"
                  type="button"
                  data-icon-trigger
                  className="icons-card"
                  aria-label={copy('previewIcon', { name: labelFor(definition.name) })}
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
                        className="size-(--preview-icon-size)"
                        style={{ '--preview-icon-size': `${size}px` } as React.CSSProperties}
                        definition={definition}
                        size={size}
                        color={color}
                        animateOn="hover"
                      />
                    ) : (
                      <Icon
                        className="size-(--preview-icon-size)"
                        style={{ '--preview-icon-size': `${size}px` } as React.CSSProperties}
                        definition={definition}
                        size={size}
                        color={color}
                      />
                    )}
                  </span>
                  <span className="icons-card-name">{labelFor(definition.name)}</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="icons-empty">
            <p>
              <Copy id="text151" />
            </p>
            <Button
              variant="plain"
              size="none"
              className="icons-small-button"
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('all')
                searchRef.current?.focus()
              }}
            >
              <Copy id="text152" />{' '}
            </Button>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeLabel={copy('closeOverlay')}
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
                  <Copy text={categoryLabel(selected.category)} /> ·{' '}
                  <Copy text={mode === 'motion' ? 'Animated' : 'Static'} />{' '}
                  <Copy id="text153" />{' '}
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
                  <Button
                    variant="plain"
                    size="none"
                    className="icons-replay"
                    type="button"
                    onClick={() => setReplayKey((key) => key + 1)}
                    aria-label={copy('replayIcon', { name: labelFor(selected.name) })}
                  >
                    <Copy id="text154" />{' '}
                  </Button>
                )}
              </div>
              <CodeSnippet code={`${importCode}\n\n${usageCode}`} label={copy('text155')} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
