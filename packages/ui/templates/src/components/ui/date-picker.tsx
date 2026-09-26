'use client'

import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarPanel, parseYMD } from '@comwit/ui'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useMobile } from '@comwit/ui'
import { popup } from '../../lib/popup'
import { focusField, disabledStyle } from '../../lib/interaction'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

type DatePickerLabels = {
  /** 모바일 바텀시트 제목 */
  title?: string
  clear?: string
  today?: string
  previousMonth?: string
  nextMonth?: string
}

type DatePickerProps = {
  id?: string
  value?: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  min?: string // YYYY-MM-DD
  max?: string // YYYY-MM-DD
  /** 표시 로케일(Intl). 'ko-KR' 이면 "2026. 9. 24." · "2026년 9월" · 일월화… */
  locale?: string
  labels?: DatePickerLabels
  className?: string
  disabled?: boolean
}

const DEFAULT_LABELS: Required<DatePickerLabels> = {
  title: uiText.datePicker.title,
  clear: uiText.datePicker.clear,
  today: uiText.datePicker.today,
  previousMonth: uiText.datePicker.previousMonth,
  nextMonth: uiText.datePicker.nextMonth,
}

const TRIGGER_CLASS = cn(
  'flex h-9 w-full items-center justify-between gap-2 rounded-control border border-input bg-transparent px-3 text-left text-body-sm transition-[border-color,box-shadow,background-color] hover:bg-accent',
  focusField,
  disabledStyle,
  'disabled:cursor-not-allowed'
)

/**
 * 날짜 선택 — 데스크톱은 유리 팝오버, 모바일은 아래에서 올라오는 바텀시트(popup.sheet).
 * 같은 CalendarPanel 을 두 표면이 공유한다. 그리드·선택/비활성 판정은 @comwit/ui 가 소유한다.
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = uiText.datePicker.placeholder,
  min,
  max,
  locale = uiText.locale,
  labels,
  className,
  disabled,
}: DatePickerProps) {
  const { isMobile, detected } = useMobile()
  const [open, setOpen] = React.useState(false)
  const selected = React.useMemo(() => parseYMD(value), [value])
  const text = { ...DEFAULT_LABELS, ...labels }
  const display = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
    [locale]
  )

  const triggerInner = (
    <>
      <span
        className={cn('min-w-0 truncate', selected ? 'text-foreground' : 'text-subtle-foreground')}
      >
        {selected ? display.format(selected) : placeholder}
      </span>
      <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
    </>
  )

  // 모바일: 아래에서 올라오는 바텀시트(popup.sheet, overlay-kit).
  if (detected && isMobile) {
    const openSheet = async () => {
      if (disabled) return
      const picked = await popup.sheet<string>(
        ({ resolve }) => (
          <CalendarPanel
            value={value}
            min={min}
            max={max}
            locale={locale}
            labels={text}
            onSelect={resolve}
          />
        ),
        { title: text.title }
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
      <PopoverContent align="start" sideOffset={8} className="w-picker p-4">
        <CalendarPanel
          value={value}
          min={min}
          max={max}
          locale={locale}
          labels={text}
          onSelect={(ymd) => {
            onChange(ymd)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

const NAV_CLASS =
  'flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast hover:bg-accent'

/**
 * 달력 본문(월 네비 + 그리드 + 지우기/오늘). Popover(데스크톱)·바텀시트(모바일) 공유.
 * onSelect(ymd): 날짜 선택 시 'YYYY-MM-DD', 지우기 시 빈 문자열을 통지한다.
 */
function CalendarPanel({
  value,
  min,
  max,
  locale,
  labels,
  onSelect,
}: {
  value?: string
  min?: string
  max?: string
  locale: string
  labels: Required<DatePickerLabels>
  onSelect: (ymd: string) => void
}) {
  const { year, month, days, goPrevMonth, goNextMonth, selectDate, today } = useCalendarPanel({
    value,
    min,
    max,
  })

  const { caption, weekdays } = React.useMemo(() => {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    return {
      caption: new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }),
      // 2023-01-01 은 일요일 — 일요일 시작 7일을 로케일 약칭으로 뽑는다.
      weekdays: Array.from({ length: 7 }, (_, i) => weekday.format(new Date(2023, 0, 1 + i))),
    }
  }, [locale])

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
          data-glass-item
          className={NAV_CLASS}
          aria-label={labels.previousMonth}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-body-sm font-semibold text-foreground" aria-live="polite">
          {caption.format(new Date(year, month - 1, 1))}
        </div>
        <button
          type="button"
          onClick={goNextMonth}
          data-glass-item
          className={NAV_CLASS}
          aria-label={labels.nextMonth}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {weekdays.map((label, i) => (
          <div
            key={i}
            className={cn(
              'flex h-8 items-center justify-center text-caption font-medium',
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
            aria-pressed={d.isSelected}
            aria-current={d.isToday ? 'date' : undefined}
            data-glass-item={d.isSelected ? undefined : ''}
            className={cn(
              'mx-auto flex size-9 items-center justify-center rounded-pill text-body-sm transition-colors duration-fast',
              !d.isSelected && !d.isDisabled && 'hover:bg-accent',
              d.isSelected &&
                'bg-primary font-semibold text-primary-foreground hover:bg-primary-strong',
              !d.isSelected && d.isToday && 'ring-1 ring-inset ring-ring',
              !d.isSelected && d.inMonth && d.weekday === 0 && 'text-destructive',
              !d.isSelected && d.inMonth && d.weekday === 6 && 'text-primary',
              !d.isSelected && d.inMonth && d.weekday !== 0 && d.weekday !== 6 && 'text-foreground',
              !d.isSelected && !d.inMonth && 'text-subtle-foreground',
              d.isDisabled &&
                'cursor-not-allowed text-disabled-foreground opacity-disabled-content hover:bg-transparent'
            )}
          >
            {d.day}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onSelect('')}
          className="text-caption font-medium text-muted-foreground transition-colors duration-fast hover:text-foreground"
        >
          {labels.clear}
        </button>
        <button
          type="button"
          onClick={() => select(today)}
          className="text-caption font-medium text-primary transition-colors duration-fast hover:text-primary-strong"
        >
          {labels.today}
        </button>
      </div>
    </div>
  )
}
