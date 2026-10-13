'use client'

import * as React from 'react'

/**
 * Override Lab demonstrates consumer customization: the library ships tokens, and inline variable overrides on the wrapper restyle the entire page.
 */

type Overrides = {
  primary: string
  radiusScale: number
  borderWidth: number
  durationBase: number
}

const DEFAULTS: Overrides = {
  primary: '#1d1d1f',
  radiusScale: 1,
  borderWidth: 1,
  durationBase: 200,
}

type Ctx = {
  ov: Overrides
  set: <K extends keyof Overrides>(k: K, v: Overrides[K]) => void
  reset: () => void
  dark: boolean
  setDark: (d: boolean) => void
}

const OverrideLabContext = React.createContext<Ctx | null>(null)

function useOverrideLab() {
  const ctx = React.useContext(OverrideLabContext)
  if (!ctx) throw new Error('useOverrideLab must be used inside <OverrideLab>')
  return ctx
}

/** Export the current configuration as copyable CSS for consumers. */
function toCss(ov: Overrides, dark: boolean) {
  const lines: string[] = []
  if (ov.primary !== DEFAULTS.primary) lines.push(`  --primary: ${ov.primary};`)
  if (ov.radiusScale !== DEFAULTS.radiusScale) lines.push(`  --radius-scale: ${ov.radiusScale};`)
  if (ov.borderWidth !== DEFAULTS.borderWidth) lines.push(`  --border-width: ${ov.borderWidth}px;`)
  if (ov.durationBase !== DEFAULTS.durationBase)
    lines.push(`  --duration-base: ${ov.durationBase}ms;`)

  const body = lines.length ? lines.join('\n') : '  /* Keep the defaults. */'
  return [
    `/* app/globals.css — place after imports; later declarations win with equal specificity. */`,
    `@import "@comwit/ui-templates/styles.css";`,
    ``,
    `:root {`,
    body,
    `}`,
    ...(dark ? [``, `/* Dark mode is a switch → <html class="dark"> */`] : []),
  ].join('\n')
}

const btn =
  'rounded-pill border border-border px-3 py-1.5 text-caption font-medium transition-colors data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-accent data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground'

const PRIMARY_PRESETS: [string, string][] = [
  ['#1d1d1f', 'Ink (default)'],
  ['#0b68ba', 'Blue'],
  ['#6b5bd6', 'Violet'],
  ['#ff2dd9', 'Magenta'],
]

function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  suffix,
  onChange,
}: {
  id: string
  label: string
  min: number
  max: number
  step: number
  value: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-36 shrink-0 font-mono text-caption text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-40 cursor-pointer appearance-none rounded-pill bg-border accent-primary"
      />
      <span className="w-16 font-mono text-caption tabular-nums text-foreground">
        {value}
        {suffix}
      </span>
    </div>
  )
}

/** Control bar at the top of section 01. */
export function OverrideLabControls() {
  const { ov, set, reset, dark, setDark } = useOverrideLab()
  const touched =
    ov.primary !== DEFAULTS.primary ||
    ov.radiusScale !== DEFAULTS.radiusScale ||
    ov.borderWidth !== DEFAULTS.borderWidth ||
    ov.durationBase !== DEFAULTS.durationBase

  return (
    <div className="sticky top-4 z-sticky space-y-4 rounded-xl border border-border bg-surface-glass p-4 shadow-card backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-caption text-muted-foreground">--primary</span>
        {PRIMARY_PRESETS.map(([hex, name]) => (
          <button
            key={hex}
            type="button"
            onClick={() => set('primary', hex)}
            data-active={ov.primary === hex}
            className={btn}
          >
            <span
              className="mr-1.5 inline-block size-2.5 rounded-full align-middle"
              style={{ background: hex }}
            />
            {name}
          </button>
        ))}

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <button type="button" onClick={() => setDark(!dark)} data-active={dark} className={btn}>
          {dark ? 'Dark' : 'Light'}
        </button>

        {touched && (
          <button type="button" onClick={reset} data-active={false} className={btn}>
            Reset
          </button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Slider
          id="ov-radius"
          label="--radius-scale"
          min={0}
          max={2.6}
          step={0.1}
          value={ov.radiusScale}
          onChange={(v) => set('radiusScale', v)}
        />
        <Slider
          id="ov-border"
          label="--border-width"
          min={1}
          max={4}
          step={1}
          value={ov.borderWidth}
          suffix="px"
          onChange={(v) => set('borderWidth', v)}
        />
        <Slider
          id="ov-duration"
          label="--duration-base"
          min={0}
          max={600}
          step={20}
          value={ov.durationBase}
          suffix="ms"
          onChange={(v) => set('durationBase', v)}
        />
      </div>

      <div>
        <p className="mb-2 text-caption text-muted-foreground">
          The library ships no themes.{' '}
          <strong className="font-semibold text-foreground">
            It provides tokens for consumers to override.
          </strong>{' '}
          Paste the CSS below to reproduce this appearance without changing component code.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-caption text-foreground">
          {toCss(ov, dark)}
        </pre>
      </div>
    </div>
  )
}

/** Wrap every section with inline CSS variables, equivalent to consumer :root overrides. */
export function OverrideLab({ children }: { children: React.ReactNode }) {
  const [ov, setOv] = React.useState<Overrides>(DEFAULTS)
  const [dark, setDark] = React.useState(false)

  const set = React.useCallback(
    <K extends keyof Overrides>(k: K, v: Overrides[K]) => setOv((p) => ({ ...p, [k]: v })),
    []
  )
  const reset = React.useCallback(() => setOv(DEFAULTS), [])

  const value = React.useMemo(() => ({ ov, set, reset, dark, setDark }), [ov, set, reset, dark])

  /*
   * --primary is semantic; the remaining values are L0 controls. var() references resolve on this wrapper, just as they would on a consumer's :root.
   */
  const style = {
    '--primary': ov.primary,
    '--radius-scale': ov.radiusScale,
    '--border-width': `${ov.borderWidth}px`,
    '--duration-base': `${ov.durationBase}ms`,
  } as React.CSSProperties

  return (
    <OverrideLabContext.Provider value={value}>
      <div
        style={style}
        className={dark ? 'dark bg-background text-foreground' : 'bg-background text-foreground'}
      >
        {children}
      </div>
    </OverrideLabContext.Provider>
  )
}
