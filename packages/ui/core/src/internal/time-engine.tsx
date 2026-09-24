'use client'

import * as React from 'react'

function buildSlots(stepMinutes: number): string[] {
  const slots: string[] = []
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

/**
 * 시간 슬롯 목록(30분 간격 등). Popover·바텀시트 공유.
 * 현재 value 가 슬롯 배수와 안 맞으면(예: 어드민 시드/레거시 18:45) 그 값을 목록에 끼워 넣어
 * 하이라이트·보존한다(근처 슬롯이 조용히 덮어쓰지 않게). 마운트 시 선택 슬롯을 보이게 스크롤.
 */
export function useTimePanel(opts: { value?: string; stepMinutes: number }): {
  slots: string[]
  isSelected(slot: string): boolean
  selectedRef: React.RefObject<HTMLButtonElement | null>
} {
  const { value, stepMinutes } = opts

  const slots = React.useMemo(() => {
    const base = buildSlots(stepMinutes)
    if (value && !base.includes(value)) {
      base.push(value)
      base.sort() // 'HH:mm' 제로패딩이라 사전식=시간순
    }
    return base
  }, [stepMinutes, value])

  const selectedRef = React.useRef<HTMLButtonElement | null>(null)
  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  const isSelected = React.useCallback((slot: string) => slot === value, [value])

  return { slots, isSelected, selectedRef }
}
