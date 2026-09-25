'use client'

import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMonthPanel } from '@comwit/ui'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useMobile } from '@comwit/ui'
import { popup } from '../../lib/popup'
import { focusField, disabledStyle } from '../../lib/interaction'
import { cn } from '../../lib/utils'

type MonthPickerLabels = {
  /** 모바일 바텀시트 제목 */
  title?: string
  clear?: string
  thisMonth?: string
  previousYear?: string
  nextYear?: string
}

type MonthPickerProps = {
  id?: string
  value?: string // YYYY-MM
  onChange: (value: string) => void
  placeholder?: string
  min?: string // YYYY-MM
  max?: string // YYYY-MM
  /** 표시 로케일(Intl). 'ko-KR' 이면 "2026년 9월". */
  locale?: string
  labels?: MonthPickerLabels
  className?: string
  disabled?: boolean
}

const DEFAULT_LABELS: Required<MonthPickerLabels> = {
  title: 'Select month',
  clear: 'Clear',
  thisMonth: 'This month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
}

const TRIGGER_CLASS = cn(
  'flex h-9 w-full items-center justify-between gap-2 rounded-control border border-input bg-transparent px-3 text-left text-body-sm transition-[border-color,box-shadow,background-color] hover:bg-accent',
  focusField,
  disabledStyle,
  'disabled:cursor-not-allowed'
)

const NAV_CLASS =
  'flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast hover:bg-accent'

/**
 * 월 선택 — 데스크톱은 유리 팝오버, 모바일은 바텀시트(popup.sheet).
 * 연도 페이지·선택/비활성 판정은 @comwit/ui useMonthPanel 이 소유한다.
 */
export function MonthPicker({
  id,
  value,
  onChange,
  placeholder = 'Select month',
  min,
  max,
  locale = 'en-US',
  labels,
  className,
  disabled,
}: MonthPickerProps) {
  const { isMobile, detected } = useMobile()
  const [open, setOpen] = React.useState(false)
  const text = { ...DEFAULT_LABELS, ...labels }
  const display = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }),
    [locale]
  )
  const selected = React.useMemo(() => {
    const m = /^(\d{4})-(\d{2})$/.exec(value ?? '')
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : null
  }, [value])

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

  // 모바일: 아래에서 올라오는 바텀시트.
  if (detected && isMobile) {
    const openSheet = async () => {
      if (disabled) return
      const picked = await popup.sheet<string>(
        ({ resolve }) => (
          <MonthPanel
            value={value}
            min={min}
            max={max}
            locale={locale}
            labels={text}
            open
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" disabled={disabled} className={cn(TRIGGER_CLASS, className)}>
          {triggerInner}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[280px] p-4">
        <MonthPanel
          value={value}
          min={min}
          max={max}
          locale={locale}
          labels={text}
          open={open}
          onSelect={(ym) => {
            onChange(ym)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** 연도 네비 + 12개월 그리드 + 지우기/이번 달. 팝오버·바텀시트 공유. 지우기는 빈 문자열을 통지한다. */
function MonthPanel({
  value,
  min,
  max,
  locale,
  labels,
  open,
  onSelect,
}: {
  value?: string
  min?: string
  max?: string
  locale: string
  labels: Required<MonthPickerLabels>
  open: boolean
  onSelect: (ym: string) => void
}) {
  const panel = useMonthPanel({ value, min, max, open })
  const { viewYear } = panel
  const formats = React.useMemo(
    () => ({
      year: new Intl.DateTimeFormat(locale, { year: 'numeric' }),
      month: new Intl.DateTimeFormat(locale, { month: 'short' }),
    }),
    [locale]
  )

  return (
    <div className="mx-auto w-full max-w-picker">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => panel.prevYear()}
          data-glass-item
          className={NAV_CLASS}
          aria-label={labels.previousYear}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-body-sm font-semibold text-foreground" aria-live="polite">
          {formats.year.format(new Date(viewYear, 0, 1))}
        </div>
        <button
          type="button"
          onClick={() => panel.nextYear()}
          data-glass-item
          className={NAV_CLASS}
          aria-label={labels.nextYear}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {panel.months.map((cell) => {
          const isSelected = cell.isSelected
          const disabledCell = cell.isDisabled
          return (
            <button
              key={cell.month}
              type="button"
              onClick={() => {
                const next = panel.selectMonth(cell.month)
                if (next !== null) onSelect(next)
              }}
              disabled={disabledCell}
              aria-pressed={isSelected}
              data-glass-item={isSelected ? undefined : ''}
              className={cn(
                'flex h-10 items-center justify-center rounded-pill text-body-sm transition-colors duration-fast',
                !isSelected && !disabledCell && 'text-foreground hover:bg-accent',
                isSelected &&
                  'bg-primary font-semibold text-primary-foreground hover:bg-primary-strong',
                !isSelected && cell.isCurrent && 'ring-1 ring-inset ring-ring',
                disabledCell &&
                  'cursor-not-allowed text-disabled-foreground opacity-disabled-content hover:bg-transparent'
              )}
            >
              {formats.month.format(new Date(viewYear, cell.month - 1, 1))}
            </button>
          )
        })}
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
          onClick={() => {
            const next = panel.selectToday()
            if (next !== null) onSelect(next)
          }}
          className="text-caption font-medium text-primary transition-colors duration-fast hover:text-primary-strong"
        >
          {labels.thisMonth}
        </button>
      </div>
    </div>
  )
}
