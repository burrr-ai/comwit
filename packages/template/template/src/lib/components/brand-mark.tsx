'use client'

/**
 * 기본 심볼 마크 — 2인 실루엣 + 블루 그라디언트, 무배경. 브랜드가 정해지면 교체한다.
 */

import { useId } from 'react'

type BrandMarkProps = {
  size?: number
  className?: string
}

export function BrandMark({ size = 44, className }: BrandMarkProps) {
  const inner = Math.round(size * 0.72)
  const gid = useId()
  const frontId = `${gid}-front`
  const backId = `${gid}-back`
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center ${className ?? ''}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <svg viewBox="0 0 24 24" width={inner} height={inner} fill="none">
        <defs>
          <linearGradient id={frontId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7EA3F5" />
            <stop offset="100%" stopColor="#4A6DD8" />
          </linearGradient>
          <linearGradient id={backId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4C6CC4" />
            <stop offset="100%" stopColor="#2E4A9C" />
          </linearGradient>
        </defs>

        {/* 뒤 인물 (왼쪽) */}
        <circle cx="9" cy="7.5" r="2.8" fill={`url(#${backId})`} />
        <path d="M4 20 C4 14.5 6 12.5 9 12.5 C12 12.5 14 14.5 14 20 Z" fill={`url(#${backId})`} />

        {/* 앞 인물 (오른쪽) */}
        <circle cx="15" cy="7.5" r="2.8" fill={`url(#${frontId})`} />
        <path
          d="M10 20 C10 14.5 12 12.5 15 12.5 C18 12.5 20 14.5 20 20 Z"
          fill={`url(#${frontId})`}
        />
      </svg>
    </span>
  )
}
