import * as React from 'react'

/**
 * month-engine — month-picker(연/월 그리드)용 헤드리스 엔진.
 *
 * UX-JS 전부(입력 문자열 파싱, 12칸 월 그리드 구성, 선택/비활성 판정, 뷰-연도 상태·이동,
 * today 계산, onChange 로 넘길 출력값 포매팅)를 소유한다. 스타일/Tailwind/라벨은 없다.
 * 소비 템플릿은 반환된 모델을 렌더링만 한다.
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
  /** 팝오버 open 상태. 열릴 때 뷰-연도를 (선택값 ?? today) 연도로 리셋한다(원본 useEffect 동작). */
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

  // 팝오버가 열릴 때마다 뷰-연도를 선택값(없으면 today)의 연도로 되돌린다.
  // open 을 인자로 받아 이펙트를 엔진 안에서 돌린다(템플릿 렌더 중 setState 금지).
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
