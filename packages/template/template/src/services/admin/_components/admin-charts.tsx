'use client'

import { cn } from '@/lib/utils'

/**
 * Lightweight inline SVG charts for admin dashboards.
 * Sparklines, multiline, donut, and bar charts without dependencies such as recharts.
 * Accept CSS color strings directly, e.g. 'var(--accent)' or '#10b981'.
 */

/** Mini sparkline, e.g. below a StatCard. Color comes from text-* classes via currentColor. */
export function AdminSparkline({
  data,
  height = 32,
  className,
}: {
  data: number[]
  height?: number
  className?: string
}) {
  if (data.length < 2) return null
  const w = 100
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = height - 2 - ((v - min) / range) * (height - 4)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={cn('w-full text-primary', className)}
      style={{ height }}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export type AdminLineSeries = { label: string; color: string; data: number[] }

/** Multiple line series sharing an x-axis. */
export function AdminLineChart({
  series,
  height = 168,
  className,
}: {
  series: AdminLineSeries[]
  height?: number
  className?: string
}) {
  const n = Math.max(0, ...series.map((s) => s.data.length))
  if (n < 2) return null
  const w = 320
  const padY = 10
  const all = series.flatMap((s) => s.data)
  const max = Math.max(1, ...all)
  const min = Math.min(0, ...all)
  const range = max - min || 1
  const px = (i: number) => (i / (n - 1)) * w
  const py = (v: number) => height - padY - ((v - min) / range) * (height - padY * 2)
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden
    >
      {[0.5].map((f) => (
        <line
          key={f}
          x1={0}
          x2={w}
          y1={height * f}
          y2={height * f}
          stroke="var(--secondary)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {series.map((s) => (
        <polyline
          key={s.label}
          points={s.data
            .map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`)
            .join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

export type AdminDonutSegment = { label: string; value: number; color: string }

/** Donut chart, e.g. status distribution. */
export function AdminDonut({
  segments,
  size = 132,
  thickness = 18,
  className,
}: {
  segments: AdminDonutSegment[]
  size?: number
  thickness?: number
  className?: string
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0)
  const r = (size - thickness) / 2
  const c = size / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="var(--secondary)"
        strokeWidth={thickness}
      />
      {total > 0 &&
        segments.map((s) => {
          const dash = (s.value / total) * circ
          const node = (
            <circle
              key={s.label}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`}
            />
          )
          offset += dash
          return node
        })}
    </svg>
  )
}

export type AdminBarItem = { label: string; value: number; color?: string }

/** Horizontal bar list, e.g. reason distribution. */
export function AdminBarList({
  items,
  className,
}: {
  items: AdminBarItem[]
  className?: string
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className={cn('space-y-2.5', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 truncate text-caption text-muted-foreground">
            {item.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? 'var(--accent)',
              }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-caption font-semibold text-foreground tabular-nums">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
