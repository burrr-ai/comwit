import * as React from 'react'

/**
 * month-engine — headless engine for the month-picker year/month grid.
 *
 * Owns all UX logic: input parsing, the 12-month grid, selected/disabled states, view-year state and navigation,
 * today's date, and formatting onChange output. No styles, Tailwind classes, or labels.
 * The consuming template only renders the returned model.
 */

export function parseYM(value: string | undefined): { year: number; month: number } | null {
  if (!value) return null
  const [y, m] = value.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) return null
  return { year: y, month: m }
}

export function formatYM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function ymKey({ year, month }: { year: number; month: number }): number {
  return year * 12 + (month - 1)
}

export type MonthCell = {
  month: number
  isSelected: boolean
  isCurrent: boolean
  isDisabled: boolean
}

export type MonthPanel = {
  viewYear: number
  selected: { year: number; month: number } | null
  today: { year: number; month: number }
  months: MonthCell[]
  prevYear(): void
  nextYear(): void
  selectMonth(month: number): string | null
  selectToday(): string | null
}

export function useMonthPanel(opts: {
  value?: string
  min?: string
  max?: string
  /** Popover open state. Opening resets the view year to (selected value ?? today), preserving the original useEffect behavior. */
  open?: boolean
}): MonthPanel {
  const { value, min, max, open } = opts

  const selected = React.useMemo(() => parseYM(value), [value])
  const minYm = React.useMemo(() => parseYM(min), [min])
  const maxYm = React.useMemo(() => parseYM(max), [max])
  const today = React.useMemo(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }, [])

  const [viewYear, setViewYear] = React.useState<number>(() => (selected ?? today).year)

  // Whenever the popover opens, restore the view year to the selected value's year, or today's year.
  // Accept open as an argument so the effect runs in the engine (no setState during template rendering).
  React.useEffect(() => {
    if (open) setViewYear((selected ?? today).year)
  }, [open, selected, today])

  const isMonthDisabled = React.useCallback(
    (year: number, month: number) => {
      const k = ymKey({ year, month })
      if (minYm && k < ymKey(minYm)) return true
      if (maxYm && k > ymKey(maxYm)) return true
      return false
    },
    [minYm, maxYm]
  )

  const months = React.useMemo<MonthCell[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        return {
          month,
          isSelected: !!selected && selected.year === viewYear && selected.month === month,
          isCurrent: today.year === viewYear && today.month === month,
          isDisabled: isMonthDisabled(viewYear, month),
        }
      }),
    [selected, viewYear, today, isMonthDisabled]
  )

  const prevYear = React.useCallback(() => setViewYear((y) => y - 1), [])
  const nextYear = React.useCallback(() => setViewYear((y) => y + 1), [])

  const selectMonth = React.useCallback(
    (month: number): string | null => {
      if (isMonthDisabled(viewYear, month)) return null
      return formatYM(viewYear, month)
    },
    [isMonthDisabled, viewYear]
  )

  const selectToday = React.useCallback((): string | null => {
    if (isMonthDisabled(today.year, today.month)) return null
    return formatYM(today.year, today.month)
  }, [isMonthDisabled, today])

  return {
    viewYear,
    selected,
    today,
    months,
    prevYear,
    nextYear,
    selectMonth,
    selectToday,
  }
}
