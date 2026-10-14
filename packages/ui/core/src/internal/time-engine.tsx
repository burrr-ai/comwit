'use client'

import * as React from 'react'

function buildSlots(stepMinutes: number): string[] {
  const slots: string[] = []
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

/**
 * Time slots (for example, 30-minute intervals), shared by Popover and bottom sheet.
 * If the current value is off the slot interval (for example, a seeded or legacy 18:45), insert it into the list
 * to highlight and preserve it instead of silently overwriting it with a nearby slot. Scroll to the selected slot on mount.
 */
export function useTimePanel(opts: { value?: string; stepMinutes: number }): {
  slots: string[]
  isSelected(slot: string): boolean
  selectedRef: React.RefObject<HTMLButtonElement | null>
} {
  const { value, stepMinutes } = opts

  const slots = React.useMemo(() => {
    const base = buildSlots(stepMinutes)
    if (value && !base.includes(value)) {
      base.push(value)
      base.sort() // Zero-padded HH:mm strings sort lexicographically in chronological order.
    }
    return base
  }, [stepMinutes, value])

  const selectedRef = React.useRef<HTMLButtonElement | null>(null)
  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  const isSelected = React.useCallback((slot: string) => slot === value, [value])

  return { slots, isSelected, selectedRef }
}
