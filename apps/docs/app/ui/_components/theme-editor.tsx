'use client'

import { Copy, useCopy } from '@/i18n/copy'
import { useTranslations } from 'next-intl'

import * as React from 'react'
import { MoonIcon, SunIcon } from '@comwit/ui/icons'
import { cn } from '@comwit/ui-templates/lib/utils'
import { Button } from '@comwit/ui-templates/button'
import { Chip } from '@comwit/ui-templates/chip'
import { Switch } from '@comwit/ui-templates/switch'
import { Checkbox } from '@comwit/ui-templates/checkbox'
import { Input } from '@comwit/ui-templates/input'
import { Label } from '@comwit/ui-templates/label'
import { SegmentedControl } from '@comwit/ui-templates/segmented-control'
import { Alert, AlertTitle, AlertDescription } from '@comwit/ui-templates/alert'
import { Badge } from '@comwit/ui-templates/badge'
import { Glass } from '@comwit/ui-templates/glass'
import { tokens, tokenMap, byName } from '../_generated/catalog'
import { CodeBlock } from './code-block'

/** Consumer-facing L0 overrides: palette colors, shape, and motion controls. */
const COLOR_GROUPS = ['Palette', 'Status'] as const
const KNOBS = [
  { name: 'radius-scale', label: 'Corner radius', min: 0, max: 2, step: 0.1, unit: '' },
  { name: 'pill-radius', label: 'Pill radius', min: 0, max: 40, step: 1, unit: 'px' },
  { name: 'text-scale', label: 'Type scale', min: 0.85, max: 1.2, step: 0.01, unit: '' },
  { name: 'border-width', label: 'Border width', min: 1, max: 3, step: 0.5, unit: 'px' },
  { name: 'duration-base', label: 'Motion', min: 0, max: 600, step: 25, unit: 'ms' },
] as const

const byToken = Object.fromEntries(tokens.map((t) => [t.name, t]))
const toHex = (v: string) => (/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#888888')

/** Primitive tokens, their semantic aliases, and the components using those aliases. */
function usersOf(name: string) {
  const semantic = tokens
    .filter((t) => t.layer === 'semantic' && t.raw.includes(`var(--${name})`))
    .map((t) => t.name)
  return [...new Set([...(tokenMap[name] ?? []), ...semantic.flatMap((s) => tokenMap[s] ?? [])])]
}

export function ThemeEditor() {
  const localize = useCopy()

  const copy = useTranslations('Copy')

  const [overrides, setOverrides] = React.useState<Record<string, string>>({})
  const [dark, setDark] = React.useState(false)
  const [active, setActive] = React.useState<string | null>(null)
  const [view, setView] = React.useState<'grid' | 'list'>('grid')

  function set(name: string, value: string) {
    document.documentElement.style.setProperty(`--${name}`, value)
    setOverrides((o) => ({ ...o, [name]: value }))
  }
  function reset() {
    for (const name of Object.keys(overrides))
      document.documentElement.style.removeProperty(`--${name}`)
    setOverrides({})
  }
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const colorTokens = tokens.filter(
    (t) => t.isColor && (COLOR_GROUPS as readonly string[]).includes(t.group)
  )
  const css = Object.keys(overrides).length
    ? `:root {\n${Object.entries(overrides)
        .map(([k, v]) => `  --${k}: ${v};`)
        .join('\n')}\n}`
    : '/* Change a value to see the CSS to paste after the token import. */'
  const users = active ? usersOf(active) : []

  return (
    <div className="grid gap-8 p-6 min-[760px]:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-body-sm text-soft-foreground">
            {Object.keys(overrides).length
              ? copy('changedCount', { count: Object.keys(overrides).length })
              : localize('Change any value. Everything on the right follows.')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              aria-label={localize(dark ? 'Light mode' : 'Dark mode')}
              aria-pressed={dark}
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={!Object.keys(overrides).length}
            >
              <Copy id="text215" />{' '}
            </Button>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-title-sm text-foreground">
            <Copy id="text216" />
          </h2>
          {KNOBS.map((k) => {
            const raw = overrides[k.name] ?? byToken[k.name]?.value ?? '0'
            const num = raw === '9999px' ? k.max : parseFloat(raw)
            return (
              <label
                key={k.name}
                className="grid grid-cols-[120px_minmax(0,1fr)_64px] items-center gap-3"
                onMouseEnter={() => setActive(k.name)}
              >
                <span className="text-label font-semibold text-foreground">
                  <Copy text={k.label} />
                </span>
                <Input
                  bare
                  type="range"
                  min={k.min}
                  max={k.max}
                  step={k.step}
                  value={num}
                  onChange={(e) => set(k.name, `${e.target.value}${k.unit}`)}
                  className="accent-primary"
                />
                <code className="text-right font-mono text-caption text-muted-foreground">
                  {raw}
                </code>
              </label>
            )
          })}
        </section>

        {COLOR_GROUPS.map((g) => (
          <section key={g} className="space-y-3">
            <h2 className="text-title-sm text-foreground">
              <Copy text={g === 'Palette' ? 'Palette' : 'Status colors'} />
            </h2>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {colorTokens
                .filter((t) => t.group === g)
                .map((t) => {
                  const value = overrides[t.name] ?? (dark ? t.dark : t.value)
                  return (
                    <div
                      key={t.name}
                      onMouseEnter={() => setActive(t.name)}
                      onFocus={() => setActive(t.name)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-control border border-border px-2.5 py-2 transition-shadow duration-fast',
                        active === t.name && 'ring-2 ring-ring'
                      )}
                    >
                      <label
                        className="relative size-7 shrink-0 overflow-hidden rounded-lg border border-border"
                        style={{ background: value }}
                      >
                        <Input
                          bare
                          type="color"
                          value={toHex(value)}
                          onChange={(e) => set(t.name, e.target.value)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                          aria-label={copy('tokenColor', { name: t.name })}
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-caption text-foreground">
                          --{t.name}
                        </p>
                        <Input
                          bare
                          type="text"
                          aria-label={copy('tokenValue', { name: t.name })}
                          value={value}
                          onChange={(e) => set(t.name, e.target.value)}
                          spellCheck={false}
                          className="w-full bg-transparent font-mono text-micro text-muted-foreground outline-none"
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-title-sm text-foreground">
            <Copy id="text217" />
          </h2>
          <CodeBlock code={css} language="css" />
        </section>
      </div>

      <div className="space-y-4 min-[760px]:sticky min-[760px]:top-6 min-[760px]:self-start">
        <div className="space-y-5 rounded-card border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">
              <Copy id="text218" />
            </Button>
            <Button size="sm" variant="secondary">
              <Copy id="text182" />{' '}
            </Button>
            <Button size="sm" variant="outline">
              <Copy id="text219" />{' '}
            </Button>
            <Button size="sm" variant="destructive">
              <Copy id="text220" />{' '}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip selected onClick={() => undefined}>
              <Copy id="text221" />{' '}
            </Chip>
            <Chip onClick={() => undefined}>
              <Copy id="text222" />
            </Chip>
            <Badge variant="success">
              <Copy id="text223" />
            </Badge>
            <Badge variant="warning">
              <Copy id="text224" />
            </Badge>
          </div>
          <SegmentedControl
            aria-label={copy('text225')}
            value={view}
            onValueChange={setView}
            options={[
              { label: localize('Grid'), value: 'grid' },
              { label: localize('List'), value: 'list' },
            ]}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="theme-email">
              <Copy id="text226" />
            </Label>
            <Input id="theme-email" placeholder="you@company.com" />
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <Checkbox id="theme-updates" defaultChecked />
              <Label htmlFor="theme-updates">
                <Copy id="text228" />
              </Label>
            </span>
            <Switch defaultChecked aria-label={copy('text166')} />
          </div>
          <Alert tone="info" className="flex-col gap-1">
            <AlertTitle>
              <Copy id="text229" />
            </AlertTitle>
            <AlertDescription>
              <Copy id="text230" />
            </AlertDescription>
          </Alert>
          <div data-tone="sunset" className="ui-photo relative h-24 rounded-card p-3">
            <div className="relative isolate z-raised flex h-full items-center justify-center rounded-pill">
              <Glass />
              <span className="relative z-raised text-label font-semibold text-foreground">
                <Copy id="text231" />{' '}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-border p-4">
          <p className="text-body-sm text-foreground">
            {active
              ? copy.rich('tokenUsage', {
                  token: `--${active}`,
                  code: (chunks) => <code className="font-mono">{chunks}</code>,
                })
              : localize('Hover a token to see where it lands.')}
          </p>
          {active && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {users.length ? (
                users.map((n) => (
                  <a
                    key={n}
                    href={`/ui/components#${n}`}
                    target="_top"
                    className="rounded-lg bg-muted px-2 py-0.5 text-caption text-foreground transition-colors duration-fast hover:bg-accent"
                  >
                    <Copy text={byName[n]?.title ?? n} />
                  </a>
                ))
              ) : (
                <span className="text-caption text-muted-foreground">
                  <Copy id="text233" />{' '}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
