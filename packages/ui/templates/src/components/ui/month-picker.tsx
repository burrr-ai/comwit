'use client'

import * as React from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMonthPanel } from '@comwit/ui'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { focusField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

type MonthPickerProps = {
  id?: string
  value?: string // YYYY-MM
  onChange: (value: string) => void
  placeholder?: string
  min?: string // YYYY-MM
  max?: string // YYYY-MM
  className?: string
  disabled?: boolean
}

const MONTH_LABELS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
]

const TRIGGER_CLASS = cn(
  'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm transition-[border-color,box-shadow]',
  'hover:border-input-hover',
  focusField,
  'disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:[&_svg]:text-disabled-foreground'
)

export function MonthPicker({
  id,
  value,
  onChange,
  placeholder = '월 선택',
  min,
  max,
  className,
  disabled,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false)
  const panel = useMonthPanel({ value, min, max, open })
  const { selected, viewYear } = panel

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" disabled={disabled} className={cn(TRIGGER_CLASS, className)}>
          <span
            className={cn('min-w-0 truncate', selected ? 'text-foreground' : 'text-placeholder')}
          >
            {selected ? `${selected.year}년 ${selected.month}월` : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[280px] rounded-lg border border-border bg-popover p-4 shadow-lg"
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => panel.prevYear()}
            className="flex h-8 w-8 items-center justify-center rounded-pill text-muted-foreground transition-colors hover:bg-muted"
            aria-label="이전 해"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold text-foreground">{viewYear}년</div>
          <button
            type="button"
            onClick={() => panel.nextYear()}
            className="flex h-8 w-8 items-center justify-center rounded-pill text-muted-foreground transition-colors hover:bg-muted"
            aria-label="다음 해"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {panel.months.map((cell) => {
            const label = MONTH_LABELS[cell.month - 1]
            const isSelected = cell.isSelected
            const isCurrent = cell.isCurrent
            const disabledCell = cell.isDisabled
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const next = panel.selectMonth(cell.month)
                  if (next !== null) {
                    onChange(next)
                    setOpen(false)
                  }
                }}
                disabled={disabledCell}
                className={cn(
                  'flex h-10 items-center justify-center rounded-pill text-sm transition-colors',
                  !isSelected && !disabledCell && 'text-foreground hover:bg-muted',
                  isSelected &&
                    'bg-primary font-semibold text-primary-foreground hover:bg-primary/90',
                  !isSelected && isCurrent && 'ring-1 ring-inset ring-ring',
                  disabledCell && 'cursor-not-allowed text-disabled-foreground hover:bg-transparent'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-muted pt-3">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            지우기
          </button>
          <button
            type="button"
            onClick={() => {
              const next = panel.selectToday()
              if (next !== null) {
                onChange(next)
                setOpen(false)
              }
            }}
            className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            이번 달
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
