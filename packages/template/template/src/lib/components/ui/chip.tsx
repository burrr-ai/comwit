'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { XIcon } from '@comwit/ui/icons'

import { useRipple } from '@comwit/ui'
import { disabledStyle, focusRing, pressable, rippleItemClassName } from '@/lib/interaction'
import { cn } from '@/lib/utils/cn'
import { uiText } from '@/lib/ui-text'

// Chip: filter, tag, or selection. compoundVariants owns tone × variant colors; hooks below own interaction.
const chipVariants = cva(
  cn(
    'inline-flex shrink-0 select-none items-center justify-center gap-1 whitespace-nowrap rounded-pill font-semibold',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0'
  ),
  {
    variants: {
      variant: {
        solid: '',
        soft: '',
        outline: 'border bg-transparent',
      },
      tone: {
        neutral: '',
        brand: '',
        success: '',
        warning: '',
        destructive: '',
        info: '',
      },
      size: {
        sm: 'h-6 px-2.5 text-caption',
        md: 'h-8 px-3 text-body-sm',
        lg: 'h-9 px-4 text-body-sm',
      },
    },
    compoundVariants: [
      // solid: saturated surface and contrasting text (neutral uses ink).
      { variant: 'solid', tone: 'neutral', class: 'bg-foreground text-background' },
      { variant: 'solid', tone: 'brand', class: 'bg-primary text-primary-foreground' },
      { variant: 'solid', tone: 'success', class: 'bg-success text-success-foreground' },
      { variant: 'solid', tone: 'warning', class: 'bg-warning text-warning-foreground' },
      {
        variant: 'solid',
        tone: 'destructive',
        class: 'bg-destructive text-destructive-foreground',
      },
      { variant: 'solid', tone: 'info', class: 'bg-info text-info-foreground' },
      // soft: subtle surface with text from the same color family.
      { variant: 'soft', tone: 'neutral', class: 'bg-secondary text-secondary-foreground' },
      { variant: 'soft', tone: 'brand', class: 'bg-primary-surface text-primary' },
      {
        variant: 'soft',
        tone: 'success',
        class: 'bg-success-surface text-success-surface-foreground',
      },
      {
        variant: 'soft',
        tone: 'warning',
        class: 'bg-warning-surface text-warning-surface-foreground',
      },
      {
        variant: 'soft',
        tone: 'destructive',
        class: 'bg-destructive-surface text-destructive-surface-foreground',
      },
      { variant: 'soft', tone: 'info', class: 'bg-info-surface text-info-surface-foreground' },
      // outline: matching border and text from the same color family.
      { variant: 'outline', tone: 'neutral', class: 'border-border text-foreground' },
      { variant: 'outline', tone: 'brand', class: 'border-primary/40 text-primary' },
      {
        variant: 'outline',
        tone: 'success',
        class: 'border-success-border text-success-surface-foreground',
      },
      {
        variant: 'outline',
        tone: 'warning',
        class: 'border-warning-border text-warning-surface-foreground',
      },
      {
        variant: 'outline',
        tone: 'destructive',
        class: 'border-destructive-border text-destructive-surface-foreground',
      },
      {
        variant: 'outline',
        tone: 'info',
        class: 'border-info-border text-info-surface-foreground',
      },
    ],
    defaultVariants: {
      variant: 'soft',
      tone: 'neutral',
      size: 'md',
    },
  }
)

// selected: data-selected overrides tone/variant colors with the brand color.
const selectedStyle = cn(
  'data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
  'data-[selected=true]:border-transparent'
)

// Clickable chip: ripple host, pressed state, and focus ring.
const clickableStyle = cn(
  'relative cursor-pointer overflow-hidden',
  focusRing,
  pressable,
  disabledStyle
)

interface ChipProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof chipVariants> {
  // Selection state is highlighted through aria-pressed and data-selected.
  selected?: boolean
  // Delete callback. When present, adds an XIcon delete button on the right.
  onDelete?: () => void
  // Accessible name for the delete button.
  deleteLabel?: string
  disabled?: boolean
}

function Chip({
  className,
  variant,
  tone,
  size,
  selected,
  onClick,
  onDelete,
  deleteLabel = uiText.chip.remove,
  disabled,
  onPointerDown,
  children,
  ...props
}: ChipProps) {
  const clickable = onClick != null
  const { onRippleDown, ripples } = useRipple(disabled, rippleItemClassName)

  const rootClassName = cn(
    chipVariants({ variant, tone, size }),
    clickable && clickableStyle,
    selectedStyle,
    // A deletable chip has an outer div, so disabled: variants do not apply. Use aria-disabled for the same appearance.
    'aria-disabled:pointer-events-none aria-disabled:opacity-disabled',
    className
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (clickable) onRippleDown(e)
    onPointerDown?.(e)
  }

  const sharedProps = {
    'data-slot': 'chip',
    'data-selected': selected === undefined ? undefined : selected,
    'aria-pressed': selected === undefined ? undefined : selected,
    className: rootClassName,
    onClick,
    onPointerDown: handlePointerDown,
  }

  const content = (
    <>
      {clickable ? ripples : null}
      {children}
    </>
  )

  if (onDelete) {
    // Clickable, deletable chip: give the outer div a button role, focusability, and Enter/Space support.
    const interactive = clickable && !disabled
    return (
      <div
        {...sharedProps}
        role={clickable ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
          if (!interactive || e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.currentTarget.click()
          }
        }}
        {...props}
      >
        {content}
        <button
          type="button"
          aria-label={deleteLabel}
          disabled={disabled}
          className={cn(
            '-mr-1 inline-flex items-center justify-center rounded-pill p-0.5',
            'transition-colors duration-fast hover:bg-current/10',
            focusRing,
            disabledStyle
          )}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    )
  }

  if (clickable) {
    return (
      <button type="button" disabled={disabled} {...sharedProps} {...props}>
        {content}
      </button>
    )
  }

  return (
    <span {...sharedProps} {...props}>
      {children}
    </span>
  )
}

export { Chip, chipVariants }
