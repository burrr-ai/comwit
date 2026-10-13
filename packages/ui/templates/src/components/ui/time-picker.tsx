'use client'

import * as React from 'react'
import { ClockIcon } from '@comwit/ui/icons'
import { useTimePanel } from '@comwit/ui'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useMobile } from '@comwit/ui'
import { popup } from '../../lib/popup'
import { focusField, disabledStyle } from '../../lib/interaction'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

type TimePickerProps = {
  id?: string
  value?: string // HH:mm (24h)
  onChange: (value: string) => void
  placeholder?: string
  /** Slot interval in minutes. Defaults to 30. */
  stepMinutes?: number
  /** Intl display locale. For example, ko-KR uses Korean AM/PM labels. */
  locale?: string
  /** Mobile bottom-sheet title. */
  title?: string
  className?: string
  disabled?: boolean
}

const TRIGGER_CLASS = cn(
  'flex h-9 w-full items-center justify-between gap-2 rounded-control border border-input bg-transparent px-3 text-left text-body-sm transition-[border-color,box-shadow,background-color] hover:bg-accent',
  focusField,
  disabledStyle,
  'disabled:cursor-not-allowed'
)

function useTimeFormat(locale: string) {
  return React.useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
    /** HH:mm → localized display, such as 6:30 PM. */
    return (value: string) => {
      const [hh, mm] = value.split(':').map(Number)
      if (Number.isNaN(hh) || Number.isNaN(mm)) return ''
      return format.format(new Date(2000, 0, 1, hh, mm))
    }
  }, [locale])
}

/**
 * Time selection: glass popover with time slots on desktop, bottom sheet on mobile.
 * @comwit/ui useTimePanel owns slot generation, insertion of legacy values, and scrolling to the selected slot.
 */
export function TimePicker({
  id,
  value,
  onChange,
  placeholder = uiText.timePicker.placeholder,
  stepMinutes = 30,
  locale = uiText.locale,
  title = uiText.timePicker.title,
  className,
  disabled,
}: TimePickerProps) {
  const { isMobile, detected } = useMobile()
  const [open, setOpen] = React.useState(false)
  const formatTime = useTimeFormat(locale)
  const display = value ? formatTime(value) : ''

  const triggerInner = (
    <>
      <span
        className={cn('min-w-0 truncate', display ? 'text-foreground' : 'text-subtle-foreground')}
      >
        {display || placeholder}
      </span>
      <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
    </>
  )

  // Mobile: rising bottom sheet.
  if (detected && isMobile) {
    const openSheet = async () => {
      if (disabled) return
      const picked = await popup.sheet<string>(
        ({ resolve }) => (
          <div className="max-h-[52vh] overflow-y-auto">
            <TimePanel
              value={value}
              stepMinutes={stepMinutes}
              formatTime={formatTime}
              onSelect={resolve}
            />
          </div>
        ),
        { title }
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

  // Desktop: popover.
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
        className="max-h-[280px] w-(--radix-popover-trigger-width) min-w-[180px] overflow-y-auto p-1.5"
      >
        <TimePanel
          value={value}
          stepMinutes={stepMinutes}
          formatTime={formatTime}
          onSelect={(v) => {
            onChange(v)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function TimePanel({
  value,
  stepMinutes,
  formatTime,
  onSelect,
}: {
  value?: string
  stepMinutes: number
  formatTime: (value: string) => string
  onSelect: (value: string) => void
}) {
  const { slots, isSelected, selectedRef } = useTimePanel({ value, stepMinutes })

  return (
    <div role="listbox" className="grid gap-0.5">
      {slots.map((slot) => (
        <button
          key={slot}
          role="option"
          aria-selected={isSelected(slot)}
          data-glass-item={isSelected(slot) ? undefined : ''}
          ref={isSelected(slot) ? selectedRef : undefined}
          type="button"
          onClick={() => onSelect(slot)}
          className={cn(
            'flex w-full items-center rounded-lg px-3 py-2 text-left text-body-sm transition-colors duration-fast',
            isSelected(slot)
              ? 'bg-primary font-semibold text-primary-foreground'
              : 'text-foreground hover:bg-accent'
          )}
        >
          {formatTime(slot)}
        </button>
      ))}
    </div>
  )
}
