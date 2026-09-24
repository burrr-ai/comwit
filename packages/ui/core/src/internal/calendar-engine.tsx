'use client'

import * as React from 'react'

// ════════════════════════════════════════════════════════════════════════
// Calendar engine — 날짜 선택 달력의 헤드리스 로직 (date-picker 용)
//
// 여기에는 UX-JS 만 산다: 입력값 파싱, 42-셀 월 그리드 빌드, 선택/비활성 판정,
// 뷰-월 상태 + 이월 네비게이션, 오늘 계산, onChange 로 넘길 출력값 포매팅.
// Tailwind 클래스·라벨·표시 문자열 등 프레젠테이션은 소비 템플릿이 소유한다.
// ════════════════════════════════════════════════════════════════════════

// ── Pure helpers ─────────────────────────────────────────────────────────

/** "YYYY-MM-DD" → Date(로컬 자정). 파싱 실패 시 null. */
export function parseYMD(value: string | undefined): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** Date → "YYYY-MM-DD" (onChange 로 넘길 출력값). */
export function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildMonthGrid(viewMonth: Date): Date[] {
  const first = startOfMonth(viewMonth)
  const startWeekday = first.getDay()
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - startWeekday)
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
  }
  return cells
}

// ── Hook ─────────────────────────────────────────────────────────────────

export type CalendarDay = {
  key: string
  date: Date
  day: number
  inMonth: boolean
  isSelected: boolean
  isToday: boolean
  isDisabled: boolean
  weekday: number
}

export type CalendarPanel = {
  viewMonth: Date
  year: number
  /** viewMonth 의 월(표시용 1-based). */
  month: number
  selected: Date | null
  days: CalendarDay[]
  goPrevMonth: () => void
  goNextMonth: () => void
  /** 선택 허용(비활성 아님) 시 "YYYY-MM-DD" 반환, 아니면 null. 소비자가 onChange 로 넘긴다. */
  selectDate: (d: Date) => string | null
  today: Date
}

/**
 * 달력 본문(월 네비 + 42-셀 그리드 + 선택/비활성 판정)의 헤드리스 훅.
 * value/min/max 는 "YYYY-MM-DD" 문자열. 뷰-월은 마운트 시 선택값(없으면 오늘)의
 * 달로 초기화되고, 이후 goPrev/goNextMonth 네비게이션으로만 바뀐다(원래 동작 보존).
 */
export function useCalendarPanel(opts: {
  value?: string
  min?: string
  max?: string
}): CalendarPanel {
  const { value, min, max } = opts

  const selected = React.useMemo(() => parseYMD(value), [value])
  const minDate = React.useMemo(() => parseYMD(min), [min])
  const maxDate = React.useMemo(() => parseYMD(max), [max])
  const today = React.useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const [viewMonth, setViewMonth] = React.useState<Date>(() => startOfMonth(selected ?? today))

  const isDisabled = React.useCallback(
    (d: Date) => {
      if (minDate && d < minDate) return true
      if (maxDate && d > maxDate) return true
      return false
    },
    [minDate, maxDate]
  )

  const goMonth = React.useCallback((delta: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }, [])

  const goPrevMonth = React.useCallback(() => goMonth(-1), [goMonth])
  const goNextMonth = React.useCallback(() => goMonth(1), [goMonth])

  const selectDate = React.useCallback(
    (d: Date): string | null => {
      if (isDisabled(d)) return null
      return formatYMD(d)
    },
    [isDisabled]
  )

  const days = React.useMemo<CalendarDay[]>(() => {
    const grid = buildMonthGrid(viewMonth)
    return grid.map((d) => ({
      key: d.toISOString(),
      date: d,
      day: d.getDate(),
      inMonth: d.getMonth() === viewMonth.getMonth(),
      isSelected: selected ? isSameDay(d, selected) : false,
      isToday: isSameDay(d, today),
      isDisabled: isDisabled(d),
      weekday: d.getDay(),
    }))
  }, [viewMonth, selected, today, isDisabled])

  return {
    viewMonth,
    year: viewMonth.getFullYear(),
    month: viewMonth.getMonth() + 1,
    selected,
    days,
    goPrevMonth,
    goNextMonth,
    selectDate,
    today,
  }
}
