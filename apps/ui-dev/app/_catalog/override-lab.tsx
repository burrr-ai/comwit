'use client'

import * as React from 'react'

/**
 * Override Lab — 소비처 커스터마이징 모델을 그대로 시연한다.
 *
 * 라이브러리는 테마를 싣지 않는다. 토큰(노브)만 싣고, 쓰는 쪽이 값을 덮는다.
 * 아래 컨트롤은 래퍼에 CSS 변수를 인라인으로 꽂을 뿐인데, 페이지 전체가 리스킨된다.
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

/** 지금 상태를 소비처가 그대로 붙여넣을 수 있는 CSS 로 뽑는다. */
function toCss(ov: Overrides, dark: boolean) {
  const lines: string[] = []
  if (ov.primary !== DEFAULTS.primary) lines.push(`  --primary: ${ov.primary};`)
  if (ov.radiusScale !== DEFAULTS.radiusScale) lines.push(`  --radius-scale: ${ov.radiusScale};`)
  if (ov.borderWidth !== DEFAULTS.borderWidth) lines.push(`  --border-width: ${ov.borderWidth}px;`)
  if (ov.durationBase !== DEFAULTS.durationBase)
    lines.push(`  --duration-base: ${ov.durationBase}ms;`)

  const body = lines.length ? lines.join('\n') : '  /* 기본값 그대로 */'
  return [
    `/* app/globals.css — import 뒤에 두면 같은 특이성에서 나중 선언이 이긴다 */`,
    `@import "@comwit/ui-templates/styles.css";`,
    ``,
    `:root {`,
    body,
    `}`,
    ...(dark ? [``, `/* 다크는 값이 아니라 스위치 → <html class="dark"> */`] : []),
  ].join('\n')
}

const btn =
  'rounded-pill border border-border px-3 py-1.5 text-caption font-medium transition-colors data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-accent data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground'

const PRIMARY_PRESETS: [string, string][] = [
  ['#1d1d1f', '잉크(기본)'],
  ['#0b68ba', '블루'],
  ['#6b5bd6', '바이올렛'],
  ['#ff2dd9', '마젠타'],
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

/** 컨트롤 바 — 섹션 01 상단에 박힌다. */
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
          {dark ? '다크' : '라이트'}
        </button>

        {touched && (
          <button type="button" onClick={reset} data-active={false} className={btn}>
            되돌리기
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
          라이브러리는 테마를 싣지 않는다.{' '}
          <strong className="font-semibold text-foreground">토큰만 싣고 쓰는 쪽이 덮는다.</strong>{' '}
          아래를 그대로 붙여넣으면 지금 화면이 된다 — 컴포넌트 코드는 0줄 변한다.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-caption text-foreground">
          {toCss(ov, dark)}
        </pre>
      </div>
    </div>
  )
}

/** 전 섹션을 감싸는 래퍼. CSS 변수를 인라인으로 꽂는다 = 소비처의 :root 오버라이드와 같은 일. */
export function OverrideLab({ children }: { children: React.ReactNode }) {
  const [ov, setOv] = React.useState<Overrides>(DEFAULTS)
  const [dark, setDark] = React.useState(false)

  const set = React.useCallback(
    <K extends keyof Overrides>(k: K, v: Overrides[K]) => setOv((p) => ({ ...p, [k]: v })),
    []
  )
  const reset = React.useCallback(() => setOv(DEFAULTS), [])

  const value = React.useMemo(() => ({ ov, set, reset, dark, setDark }), [ov, set, reset, dark])

  /* --primary 는 시맨틱, 나머지는 L0 노브. 전부 var() 로 참조되므로 이 요소에서 치환된다.
     소비처가 :root 에 쓰는 것과 같은 일 — 다만 여기선 스코프가 이 래퍼일 뿐이다. */
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
