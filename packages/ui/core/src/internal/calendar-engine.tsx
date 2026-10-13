'use client'

import * as React from 'react'

// ════════════════════════════════════════════════════════════════════════
// Calendar engine — headless date-selection logic for date-picker.
//
// Owns UX logic only: input parsing, the 42-cell month grid, selected/disabled states,
// view-month state and navigation, today's date, and formatting onChange output.
// The consuming template owns presentation such as Tailwind classes, labels, and display strings.
// ════════════════════════════════════════════════════════════════════════

// ── Pure helpers ─────────────────────────────────────────────────────────

/** "YYYY-MM-DD" → Date at local midnight. Returns null on parse failure. */
export function parseYMD(value: string | undefined): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** Date → "YYYY-MM-DD", the output passed to onChange. */
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
  /** The viewMonth month number, 1-based for display. */
  month: number
  selected: Date | null
  days: CalendarDay[]
  goPrevMonth: () => void
  goNextMonth: () => void
  /** Return "YYYY-MM-DD" if selection is allowed (not disabled), otherwise null. The consumer passes it to onChange. */
  selectDate: (d: Date) => string | null
  today: Date
}

/**
 * Headless hook for the calendar body: month navigation, 42-cell grid, and selected/disabled states.
 * value/min/max are "YYYY-MM-DD" strings. On mount, the view month starts at the selected month or today,
 * then changes only through goPrev/goNextMonth navigation, preserving the original behavior.
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
