'use client'

import * as React from 'react'

import { Button } from '@comwit/ui-templates/button'
import { Switch } from '@comwit/ui-templates/switch'
import { Checkbox } from '@comwit/ui-templates/checkbox'
import { Input } from '@comwit/ui-templates/input'
import { Chip } from '@comwit/ui-templates/chip'

import { GroupLabel } from './section'

/* 커스텀 프로퍼티를 style 로 넘길 때 TS 를 달래는 헬퍼 */
const vars = (o: Record<string, string | number>) => o as React.CSSProperties

/* ── 1. 뉴트럴 램프 ─────────────────────────────────────────── */

const RAMP = Array.from({ length: 12 }, (_, i) => i + 1)

const RAMP_ROLE: Record<number, string> = {
  1: '앱 배경',
  2: 'subtle 면',
  3: '팝오버/skeleton 면',
  4: 'hover 면',
  5: 'selected 면',
  6: '보더',
  7: '입력 외곽',
  8: 'hover 보더',
  9: '포커스 링',
  10: 'placeholder',
  11: '보조 텍스트',
  12: '본문 텍스트',
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

/* ── 2. Semantic 스와치 ─────────────────────────────────────── */

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
  ['foreground', 'text-foreground', '핵심 본문·제목'],
  ['soft-foreground', 'text-soft-foreground', '읽는 설명·회색 본문'],
  ['muted-foreground', 'text-muted-foreground', '도움말·메타 정보'],
  ['subtle-foreground', 'text-subtle-foreground', '3차 정보·플레이스홀더'],
  ['disabled-foreground', 'text-disabled-foreground', '비활성 텍스트·아이콘'],
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
        <GroupLabel>텍스트 시멘틱</GroupLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TEXT_TONES.map(([name, color, role]) => (
            <div key={name} className="rounded-lg border border-border bg-card p-4">
              <p className={`text-title-sm ${color}`}>가나다 Ag</p>
              <p className={`mt-2 font-mono text-caption ${color}`}>{name}</p>
              <p className="mt-1 text-caption text-muted-foreground">{role}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <GroupLabel>선 · 포커스</GroupLabel>
        <div className="flex flex-wrap gap-6">
          {LINES.map(([name, bg]) => (
            <div key={name} className="flex items-center gap-2">
              <span className={`h-8 w-8 rounded-md ${bg}`} />
              <span className="font-mono text-caption text-muted-foreground">{name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-md bg-subtle-foreground" />
            <span className="font-mono text-caption text-muted-foreground">
              subtle-foreground (placeholder)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 3. Radius 사다리 (라이브 노브) ─────────────────────────── */

const RADII = [
  ['none', 'rounded-none', '0'],
  ['xs', 'rounded-xs', '4px'],
  ['sm', 'rounded-sm', '6px'],
  ['md', 'rounded-md', '8px'],
  ['lg', 'rounded-lg', '10px'],
  ['xl', 'rounded-xl', '14px'],
  ['2xl', 'rounded-2xl', '16px'],
  ['pill', 'rounded-pill', '알약'],
  ['full', 'rounded-full', '항상 원'],
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
          0 = 완전 직각 · 2.6 = 과장된 라운드
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
        <strong className="font-semibold text-foreground">pill 은 각지고 full 은 안 각진다.</strong>{' '}
        알약(칩·캘린더 셀)은 소비처가 각지게 만들 수 있어야 하고, 아바타·라디오 도트는 어떤
        커스텀에서도 원이어야 하기 때문이다. 두 개를 한 토큰으로 묶으면 radius-scale 을 0 으로
        내리는 순간 라디오가 사각형이 된다.
      </p>
    </div>
  )
}

/* ── 4. Elevation (라이트/다크 동시) ────────────────────────── */

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
        <GroupLabel>제목 슬롯 — 디스플레이 폰트가 자동 상속된다</GroupLabel>
        <div className="rounded-lg border border-border p-6">
          {/* data-slot="card-title" 이 곧 배선이다. --display-font 를 바꾸면 이 줄만 폰트가 바뀐다. */}
          <h3 data-slot="card-title" className="text-display-sm text-foreground">
            제목은 --display-font 를 탄다
          </h3>
          <p className="mt-2 text-body-sm text-soft-foreground">
            본문은 --font-sans 그대로. 소비처가 --display-font 에 세리프를 넣으면 위 제목만 세리프가
            된다 — 컴포넌트 수정 0.
          </p>
        </div>
      </div>

      <div>
        <GroupLabel>목적형 스케일</GroupLabel>
        <div className="space-y-3 rounded-lg border border-border p-6">
          {TYPE.map(([cls, spec]) => (
            <div key={cls} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className={`${cls} min-w-0 flex-1 text-foreground`}>
                다람쥐 헌 쳇바퀴에 타고파
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
        <GroupLabel>웨이트 사다리 — --weight-* 노브</GroupLabel>
        <div className="flex flex-wrap gap-6 rounded-lg border border-border p-6">
          {WEIGHTS.map((w) => (
            <div key={w} className="flex flex-col gap-1">
              <span className={`text-title-md text-foreground ${w}`}>디자인 토큰</span>
              <span className="font-mono text-caption text-muted-foreground">{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── 6. Border width (라이브 노브) ──────────────────────────── */

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
          카드 외곽 · 헤더 divider
        </div>
        <div className="space-y-3 p-4">
          <p className="text-body-sm text-muted-foreground">
            bare <code className="font-mono">border</code> 와 방향 보더(
            <code className="font-mono">border-b</code>)가 같은 노브를 탄다. 컴포넌트는 한 글자도 안
            바뀌었다.
          </p>
          <Input placeholder="입력 외곽은 border-input" />
        </div>
        <div className="border-t border-border px-4 py-3 text-caption text-muted-foreground">
          푸터 divider
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
        <GroupLabel>눌림 · 전환 — --press-scale · --duration-fast</GroupLabel>
        <div className="flex flex-wrap items-center gap-3">
          <Button>눌러보기</Button>
          <Button variant="outline">outline</Button>
          <Chip>ripple</Chip>
        </div>
        <p className="text-caption text-muted-foreground">
          --press-scale 을 1, --duration-base 를 0, --ripple-opacity 를 0 으로 두면 즉시 반응하고 안
          눌린다.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-border p-6">
        <GroupLabel>상태 오버레이 — --state-hover · --state-selected</GroupLabel>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              id="fnd-check"
            />
            <label htmlFor="fnd-check" className="text-body-sm text-foreground">
              헤일로가 currentColor 를 탄다
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Switch defaultChecked id="fnd-switch" />
            <label htmlFor="fnd-switch" className="text-body-sm text-foreground">
              썸은 --switch-thumb
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
              {dark ? '다크' : '라이트'} — 아래는 bg-overlay 스크림
            </div>
            <div className="absolute inset-0 bg-overlay" />
            <div className="absolute inset-x-6 bottom-6 rounded-lg border border-border bg-popover p-4 shadow-xl">
              <p className="text-title-sm text-popover-foreground">모달 패널</p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                다크에선 흰 inset 하이라이트가 윤곽을 만든다
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

/* ── 조립 ──────────────────────────────────────────────────── */

export function Foundations() {
  return (
    <div className="space-y-12">
      <div>
        <GroupLabel>1 · 뉴트럴 램프 (L0 · private)</GroupLabel>
        <p className="mb-4 max-w-2xl text-body-sm text-muted-foreground">
          Radix 12-step 규약. 유틸이 생성되지 않으므로 컴포넌트가 직접 못 쓴다 — raw 색 사용을
          구조적으로 차단한다. 톤 전체를 갈아끼우려면 <span className="font-mono">이 12값만</span>{' '}
          바꾼다.
        </p>
        <Ramp />
      </div>

      <div>
        <GroupLabel>2 · 시맨틱 (L1 · 램프의 alias)</GroupLabel>
        <SemanticSwatches />
      </div>

      <div>
        <GroupLabel>3 · Radius 사다리</GroupLabel>
        <RadiusLadder />
      </div>

      <div>
        <GroupLabel>4 · Elevation — 다크는 그림자가 아니라 톤 + inset 하이라이트</GroupLabel>
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
