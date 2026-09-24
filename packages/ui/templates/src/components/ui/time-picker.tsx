'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { useTimePanel } from '@comwit/ui'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useMobile } from '../../hooks'
import { popup } from '../../lib/popup'
import { focusField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

type TimePickerProps = {
  id?: string
  value?: string // HH:mm (24h)
  onChange: (value: string) => void
  placeholder?: string
  /** 슬롯 간격(분). 기본 30분. */
  stepMinutes?: number
  className?: string
  disabled?: boolean
}

/** 'HH:mm' → '오전 9시' / '오후 6시 30분' */
function formatDisplay(value: string): string {
  const [hh, mm] = value.split(':').map(Number)
  if (Number.isNaN(hh) || Number.isNaN(mm)) return ''
  const period = hh < 12 ? '오전' : '오후'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  const base = `${period} ${h12}시`
  return mm === 0 ? base : `${base} ${mm}분`
}

const TRIGGER_CLASS = cn(
  'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm transition-[border-color,box-shadow]',
  'hover:border-input-hover',
  focusField,
  'disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:[&_svg]:text-disabled-foreground'
)

export function TimePicker({
  id,
  value,
  onChange,
  placeholder = '시간 선택',
  stepMinutes = 30,
  className,
  disabled,
}: TimePickerProps) {
  const { isMobile, detected } = useMobile()
  const [open, setOpen] = React.useState(false)
  const display = value ? formatDisplay(value) : ''

  const triggerInner = (
    <>
      <span className={cn('min-w-0 truncate', display ? 'text-foreground' : 'text-placeholder')}>
        {display || placeholder}
      </span>
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  )

  // 모바일: 아래에서 올라오는 바텀시트.
  if (detected && isMobile) {
    const openSheet = async () => {
      if (disabled) return
      const picked = await popup.sheet<string>(
        ({ resolve }) => (
          <div className="max-h-[52vh] overflow-y-auto">
            <TimePanel value={value} stepMinutes={stepMinutes} onSelect={resolve} />
          </div>
        ),
        { title: '시간 선택' }
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
        className="max-h-[280px] w-[var(--radix-popover-trigger-width)] min-w-[180px] overflow-y-auto rounded-lg border border-border bg-popover p-1.5 shadow-lg"
      >
        <TimePanel
          value={value}
          stepMinutes={stepMinutes}
          onSelect={(v) => {
            onChange(v)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** 시간 슬롯 목록(30분 간격 등). Popover·바텀시트 공유. */
function TimePanel({
  value,
  stepMinutes,
  onSelect,
}: {
  value?: string
  stepMinutes: number
  onSelect: (value: string) => void
}) {
  const { slots, isSelected, selectedRef } = useTimePanel({ value, stepMinutes })

  return (
    <>
      {slots.map((slot) => (
        <button
          key={slot}
          ref={isSelected(slot) ? selectedRef : undefined}
          type="button"
          onClick={() => onSelect(slot)}
          className={cn(
            'flex w-full items-center rounded-xl px-4 py-2 text-left text-sm transition-colors',
            isSelected(slot)
              ? 'bg-primary font-semibold text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          )}
        >
          {formatDisplay(slot)}
        </button>
      ))}
    </>
  )
}
