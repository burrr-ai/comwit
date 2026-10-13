'use client'

import * as React from 'react'

import { Button } from '@comwit/ui-templates/button'
import { Switch } from '@comwit/ui-templates/switch'
import { Checkbox } from '@comwit/ui-templates/checkbox'
import { Input } from '@comwit/ui-templates/input'
import { Chip } from '@comwit/ui-templates/chip'

import { GroupLabel } from './section'

/* Type helper for custom CSS properties passed through style. */
const vars = (o: Record<string, string | number>) => o as React.CSSProperties

/* 1. Neutral ramp. */

const RAMP = Array.from({ length: 12 }, (_, i) => i + 1)

const RAMP_ROLE: Record<number, string> = {
  1: 'App background',
  2: 'Subtle surface',
  3: 'Popover/skeleton surface',
  4: 'Hover surface',
  5: 'Selected surface',
  6: 'Border',
  7: 'Input outline',
  8: 'Hover border',
  9: 'Focus ring',
  10: 'placeholder',
  11: 'Secondary text',
  12: 'Body text',
}

function Ramp() {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
      {RAMP.map((n) => (
        <div key={n} className="min-w-0">
          <div
            className="h-14 rounded-md border border-border"
            style={vars({ background: `var(--n-${n})` })}
          />
          <p className="mt-1.5 truncate font-mono text-caption text-muted-foreground">n-{n}</p>
          <p className="truncate text-caption text-muted-foreground">{RAMP_ROLE[n]}</p>
        </div>
      ))}
    </div>
  )
}

/* 2. Semantic swatches. */

const SURFACES: [string, string, string][] = [
  ['background', 'bg-background', 'text-foreground'],
  ['card', 'bg-card', 'text-card-foreground'],
  ['popover', 'bg-popover', 'text-popover-foreground'],
  ['primary', 'bg-primary', 'text-primary-foreground'],
  ['secondary', 'bg-secondary', 'text-secondary-foreground'],
  ['muted', 'bg-muted', 'text-muted-foreground'],
  ['accent (hover)', 'bg-accent', 'text-accent-foreground'],
  ['selected', 'bg-selected', 'text-foreground'],
  ['skeleton', 'bg-skeleton', 'text-muted-foreground'],
]

const LINES: [string, string][] = [
  ['border', 'bg-border'],
  ['border-strong', 'bg-border-strong'],
  ['input', 'bg-input'],
  ['ring', 'bg-ring'],
]

const TEXT_TONES: [string, string, string][] = [
  ['foreground', 'text-foreground', 'Primary body and headings'],
  ['soft-foreground', 'text-soft-foreground', 'Descriptions and gray body text'],
  ['muted-foreground', 'text-muted-foreground', 'Help and metadata'],
  ['subtle-foreground', 'text-subtle-foreground', 'Tertiary information and placeholders'],
  ['disabled-foreground', 'text-disabled-foreground', 'Disabled text and icons'],
]

function SemanticSwatches() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SURFACES.map(([name, bg, fg]) => (
          <div key={name} className={`rounded-lg border border-border p-4 ${bg}`}>
            <p className={`text-title-sm ${fg}`}>{name}</p>
            <p className={`mt-0.5 font-mono text-caption ${fg}`}>
              {bg} · {fg}
            </p>
          </div>
        ))}
      </div>

      <div>
        <GroupLabel>Text semantics</GroupLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TEXT_TONES.map(([name, color, role]) => (
            <div key={name} className="rounded-lg border border-border bg-card p-4">
              <p className={`text-title-sm ${color}`}>Abc Ag</p>
              <p className={`mt-2 font-mono text-caption ${color}`}>{name}</p>
              <p className="mt-1 text-caption text-muted-foreground">{role}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <GroupLabel>Lines and focus</GroupLabel>
        <div className="flex flex-wrap gap-6">
          {LINES.map(([name, bg]) => (
            <div key={name} className="flex items-center gap-2">
              <span className={`h-8 w-8 rounded-md ${bg}`} />
              <span className="font-mono text-caption text-muted-foreground">{name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-md bg-placeholder" />
            <span className="font-mono text-caption text-muted-foreground">placeholder</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* 3. Radius scale with live controls. */

const RADII = [
  ['none', 'rounded-none', '0'],
  ['xs', 'rounded-xs', '4px'],
  ['sm', 'rounded-sm', '6px'],
  ['md', 'rounded-md', '8px'],
  ['lg', 'rounded-lg', '10px'],
  ['xl', 'rounded-xl', '14px'],
  ['2xl', 'rounded-2xl', '16px'],
  ['pill', 'rounded-pill', 'Pill'],
  ['full', 'rounded-full', 'Always circular'],
] as const

function RadiusLadder() {
  const [scale, setScale] = React.useState(1)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="radius-scale" className="font-mono text-caption text-muted-foreground">
          --radius-scale
        </label>
        <input
          id="radius-scale"
          type="range"
          min={0}
          max={2.6}
          step={0.1}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="h-1 w-64 cursor-pointer appearance-none rounded-pill bg-border accent-primary"
        />
        <span className="w-10 font-mono text-caption tabular-nums text-foreground">
          {scale.toFixed(1)}
        </span>
        <span className="text-caption text-muted-foreground">
          0 = square corners · 2.6 = exaggerated rounding
        </span>
      </div>

      <div className="flex flex-wrap gap-4" style={vars({ '--radius-scale': scale })}>
        {RADII.map(([name, cls, note]) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div className={`size-16 border border-border bg-muted ${cls}`} />
            <span className="font-mono text-caption text-muted-foreground">{name}</span>
            <span className="text-caption text-muted-foreground">{note}</span>
          </div>
        ))}
      </div>

      <p className="text-body-sm text-muted-foreground">
        <strong className="font-semibold text-foreground">
          Pill can be squared; full stays circular.
        </strong>{' '}
        Consumers can square pills such as chips and calendar cells, while avatars and radio dots
        must remain circular. Sharing one token would turn radios square when radius-scale becomes
        0.
      </p>
    </div>
  )
}

/* 4. Elevation in light and dark modes. */

const ELEVATIONS = [
  'shadow-xs',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shadow-xl',
  'shadow-raised',
]

function ElevationGrid({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <div className={dark ? 'dark' : undefined}>
      <div className="rounded-xl border border-border bg-background p-6">
        <p className="mb-4 font-mono text-caption text-muted-foreground">{label}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ELEVATIONS.map((s) => (
            <div
              key={s}
              className={`flex h-20 items-center justify-center rounded-lg bg-card text-caption text-muted-foreground ${s}`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── 5. Typography ──────────────────────────────────────────── */

const TYPE = [
  ['text-display-xl', '40 / 1.1 / 700'],
  ['text-display-lg', '32 / 1.14 / 700'],
  ['text-display-md', '28 / 1.18 / 700'],
  ['text-display-sm', '22 / 1.27 / 700'],
  ['text-title-lg', '18 / 1.33 / 600'],
  ['text-title-md', '16 / 1.38 / 600'],
  ['text-title-sm', '14 / 1.43 / 600'],
  ['text-body', '15 / 1.6'],
  ['text-body-sm', '13 / 1.6'],
  ['text-label', '14 / 1.29'],
  ['text-caption', '12 / 1.33'],
  ['text-micro', '11 / 1.27'],
] as const

const WEIGHTS = ['font-normal', 'font-medium', 'font-semibold', 'font-bold'] as const

function Typography() {
  return (
    <div className="space-y-8">
      <div>
        <GroupLabel>Heading slots inherit the display font automatically</GroupLabel>
        <div className="rounded-lg border border-border p-6">
          {/* data-slot="card-title" connects this heading to --display-font. */}
          <h3 data-slot="card-title" className="text-display-sm text-foreground">
            Headings use --display-font
          </h3>
          <p className="mt-2 text-body-sm text-soft-foreground">
            Body text keeps --font-sans. Setting a serif --display-font changes only the heading,
            without editing components.
          </p>
        </div>
      </div>

      <div>
        <GroupLabel>Purpose-based type scale</GroupLabel>
        <div className="space-y-3 rounded-lg border border-border p-6">
          {TYPE.map(([cls, spec]) => (
            <div key={cls} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className={`${cls} min-w-0 flex-1 text-foreground`}>
                The quick brown fox jumps over the lazy dog
              </span>
              <span className="font-mono text-caption text-muted-foreground">{cls}</span>
              <span className="w-28 text-right font-mono text-caption text-muted-foreground">
                {spec}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <GroupLabel>Weight scale — --weight-* controls</GroupLabel>
        <div className="flex flex-wrap gap-6 rounded-lg border border-border p-6">
          {WEIGHTS.map((w) => (
            <div key={w} className="flex flex-col gap-1">
              <span className={`text-title-md text-foreground ${w}`}>Design tokens</span>
              <span className="font-mono text-caption text-muted-foreground">{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* 6. Border width with live controls. */

function BorderWidth() {
  const [bw, setBw] = React.useState(1)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="border-width" className="font-mono text-caption text-muted-foreground">
          --border-width
        </label>
        <input
          id="border-width"
          type="range"
          min={1}
          max={4}
          step={1}
          value={bw}
          onChange={(e) => setBw(Number(e.target.value))}
          className="h-1 w-48 cursor-pointer appearance-none rounded-pill bg-border accent-primary"
        />
        <span className="w-10 font-mono text-caption tabular-nums text-foreground">{bw}px</span>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border bg-card"
        style={vars({ '--border-width': `${bw}px` })}
      >
        <div className="border-b border-border px-4 py-3 text-title-sm text-card-foreground">
          Card outline and header divider
        </div>
        <div className="space-y-3 p-4">
          <p className="text-body-sm text-muted-foreground">
            bare <code className="font-mono">border</code> and directional borders (
            <code className="font-mono">border-b</code>) share the same control. No component code
            changes.
          </p>
          <Input placeholder="Input outlines use border-input" />
        </div>
        <div className="border-t border-border px-4 py-3 text-caption text-muted-foreground">
          Footer divider
        </div>
      </div>
    </div>
  )
}

/* ── 7. Motion & State ─────────────────────────────────────── */

function MotionState() {
  const [checked, setChecked] = React.useState(true)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-lg border border-border p-6">
        <GroupLabel>Press and transitions — --press-scale · --duration-fast</GroupLabel>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Press me</Button>
          <Button variant="outline">outline</Button>
          <Chip>ripple</Chip>
        </div>
        <p className="text-caption text-muted-foreground">
          Set --press-scale to 1, --duration-base to 0, and --ripple-opacity to 0 for an immediate
          response without pressed scaling.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-border p-6">
        <GroupLabel>State overlays — --state-hover · --state-selected</GroupLabel>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              id="fnd-check"
            />
            <label htmlFor="fnd-check" className="text-body-sm text-foreground">
              Halos follow currentColor
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Switch defaultChecked id="fnd-switch" />
            <label htmlFor="fnd-switch" className="text-body-sm text-foreground">
              Thumb uses --switch-thumb
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-pill text-primary state-hover-layer">
            hover
          </span>
          <span className="grid size-10 place-items-center rounded-pill text-primary state-selected-layer">
            sel
          </span>
          <span className="text-caption text-muted-foreground">
            state-hover-layer · state-selected-layer
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── 8. Overlay / Glass ────────────────────────────────────── */

function OverlayGlass() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[false, true].map((dark) => (
        <div key={String(dark)} className={dark ? 'dark' : undefined}>
          <div className="relative h-44 overflow-hidden rounded-xl border border-border bg-background">
            <div className="p-4 text-body-sm text-muted-foreground">
              {dark ? 'Dark' : 'Light'} — bg-overlay scrim below
            </div>
            <div className="absolute inset-0 bg-overlay" />
            <div className="absolute inset-x-6 bottom-6 rounded-lg border border-border bg-popover p-4 shadow-xl">
              <p className="text-title-sm text-popover-foreground">Modal panel</p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                White inset highlights define the outline in dark mode
              </p>
            </div>
            <div className="absolute right-3 top-3 rounded-pill border border-border bg-surface-glass px-2.5 py-1 text-caption text-foreground backdrop-blur">
              bg-surface-glass
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* Assembly. */

export function Foundations() {
  return (
    <div className="space-y-12">
      <div>
        <GroupLabel>1 · Neutral ramp (L0 · private)</GroupLabel>
        <p className="mb-4 max-w-2xl text-body-sm text-muted-foreground">
          Radix 12-step convention. These values generate no utilities, preventing components from
          using raw colors directly. Retheme the entire palette by changing{' '}
          <span className="font-mono">these 12 values</span> .
        </p>
        <Ramp />
      </div>

      <div>
        <GroupLabel>2 · Semantics (L1 · ramp aliases)</GroupLabel>
        <SemanticSwatches />
      </div>

      <div>
        <GroupLabel>3 · Radius scale</GroupLabel>
        <RadiusLadder />
      </div>

      <div>
        <GroupLabel>4 · Elevation — dark mode uses tone and inset highlights</GroupLabel>
        <div className="grid gap-4 lg:grid-cols-2">
          <ElevationGrid label="light" />
          <ElevationGrid label="dark" dark />
        </div>
      </div>

      <div>
        <GroupLabel>5 · Typography</GroupLabel>
        <Typography />
      </div>

      <div>
        <GroupLabel>6 · Border width</GroupLabel>
        <BorderWidth />
      </div>

      <div>
        <GroupLabel>7 · Motion &amp; State</GroupLabel>
        <MotionState />
      </div>

      <div>
        <GroupLabel>8 · Overlay &amp; Glass</GroupLabel>
        <OverlayGlass />
      </div>
    </div>
  )
}
