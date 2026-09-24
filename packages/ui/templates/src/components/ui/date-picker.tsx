'use client'

import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarPanel, parseYMD, formatYMD } from '@comwit/ui'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useMobile } from '../../hooks'
import { popup } from '../../lib/popup'
import { focusField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

type DatePickerProps = {
  id?: string
  value?: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  min?: string // YYYY-MM-DD
  max?: string // YYYY-MM-DD
  className?: string
  disabled?: boolean
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function formatDisplay(date: Date): string {
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`
}

const TRIGGER_CLASS = cn(
  'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm transition-[border-color,box-shadow]',
  'hover:border-input-hover',
  focusField,
  'disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:[&_svg]:text-disabled-foreground'
)

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = '날짜 선택',
  min,
  max,
  className,
  disabled,
}: DatePickerProps) {
  const { isMobile, detected } = useMobile()
  const [open, setOpen] = React.useState(false)
  const selected = React.useMemo(() => parseYMD(value), [value])

  const triggerInner = (
    <>
      <span className={cn('min-w-0 truncate', selected ? 'text-foreground' : 'text-placeholder')}>
        {selected ? formatDisplay(selected) : placeholder}
      </span>
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  )

  // 모바일: 아래에서 올라오는 바텀시트(popup.sheet, overlay-kit).
  if (detected && isMobile) {
    const openSheet = async () => {
      if (disabled) return
      const picked = await popup.sheet<string>(
        ({ resolve }) => <CalendarPanel value={value} min={min} max={max} onSelect={resolve} />,
        { title: '날짜 선택' }
      )
      if (picked !== undefined) onChange(picked)
    }
    return (
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={openSheet}
        className={cn(TRIGGER_CLASS, className)}
      >
        {triggerInner}
      </button>
    )
  }

  // 데스크톱: 팝오버.
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" disabled={disabled} className={cn(TRIGGER_CLASS, className)}>
          {triggerInner}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-picker rounded-lg border border-border bg-popover p-4 shadow-lg"
      >
        <CalendarPanel
          value={value}
          min={min}
          max={max}
          onSelect={(ymd) => {
            onChange(ymd)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * 달력 본문(월 네비 + 그리드 + 지우기/오늘). Popover(데스크톱)·바텀시트(모바일) 공유.
 * onSelect(ymd): 날짜 선택 시 'YYYY-MM-DD', '지우기' 시 빈 문자열을 통지한다.
 *
 * 달력 로직(그리드 빌드·선택/비활성 판정·뷰-월 네비·오늘 계산)은 @comwit/ui 의
 * useCalendarPanel 헤드리스 훅이 소유한다. 여기는 그 모델을 클래스·라벨로 그릴 뿐이다.
 */
function CalendarPanel({
  value,
  min,
  max,
  onSelect,
}: {
  value?: string
  min?: string
  max?: string
  onSelect: (ymd: string) => void
}) {
  const { year, month, days, goPrevMonth, goNextMonth, selectDate, today } = useCalendarPanel({
    value,
    min,
    max,
  })

  const select = (d: Date) => {
    const ymd = selectDate(d)
    if (ymd !== null) onSelect(ymd)
  }

  return (
    <div className="mx-auto w-full max-w-picker">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-pill text-muted-foreground transition-colors hover:bg-muted"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-semibold text-foreground">
          {year}년 {month}월
        </div>
        <button
          type="button"
          onClick={goNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-pill text-muted-foreground transition-colors hover:bg-muted"
          aria-label="다음 달"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'flex h-8 items-center justify-center text-xs font-medium',
              i === 0 && 'text-destructive',
              i === 6 && 'text-primary',
              i !== 0 && i !== 6 && 'text-muted-foreground'
            )}
          >
            {label}
          </div>
        ))}
        {days.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => select(d.date)}
            disabled={d.isDisabled}
            className={cn(
              'mx-auto flex h-9 w-9 items-center justify-center rounded-pill text-sm transition-colors',
              !d.isSelected && !d.isDisabled && 'hover:bg-muted',
              d.isSelected &&
                'bg-primary font-semibold text-primary-foreground hover:bg-primary/90',
              !d.isSelected && d.isToday && 'ring-1 ring-inset ring-ring',
              !d.isSelected && d.inMonth && d.weekday === 0 && 'text-destructive',
              !d.isSelected && d.inMonth && d.weekday === 6 && 'text-primary',
              !d.isSelected && d.inMonth && d.weekday !== 0 && d.weekday !== 6 && 'text-foreground',
              !d.isSelected && !d.inMonth && 'text-muted-foreground',
              d.isDisabled && 'cursor-not-allowed text-disabled-foreground hover:bg-transparent'
            )}
          >
            {d.day}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-muted pt-3">
        <button
          type="button"
          onClick={() => onSelect('')}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          지우기
        </button>
        <button
          type="button"
          onClick={() => select(today)}
          className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          오늘
        </button>
      </div>
    </div>
  )
}
