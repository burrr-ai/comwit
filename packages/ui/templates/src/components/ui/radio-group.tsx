'use client'

import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive, useCenterRipple } from '@comwit/ui'
import { focusRing, rippleItemClassName } from '../../lib/interaction'
import { cn } from '../../lib/utils'

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  disabled,
  onPointerDown,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  const { onRippleDown, ripples } = useCenterRipple(disabled, rippleItemClassName)

  return (
    <span className="peer relative inline-flex shrink-0">
      <RadioGroupPrimitive.Item
        data-slot="radio-group-item"
        disabled={disabled}
        className={cn(
          'peer relative z-raised size-5 shrink-0 cursor-pointer rounded-full border border-input bg-background',
          'transition-[border-color] duration-base',
          'data-[state=checked]:border-primary',
          focusRing,
          'disabled:cursor-not-allowed disabled:opacity-disabled',
          className
        )}
        onPointerDown={(event) => {
          onRippleDown()
          onPointerDown?.(event)
        }}
        {...props}
      >
        {/* 도트는 forceMount 로 항상 두고 scale 스프링으로 팝 인/아웃 (해제 시 exit 애니 유지) */}
        <RadioGroupPrimitive.Indicator
          forceMount
          className="pointer-events-none absolute inset-0 z-raised m-auto size-2.5 scale-0 rounded-full bg-primary transition-transform duration-base ease-emphasized data-[state=checked]:scale-100 data-[disabled]:opacity-disabled"
        />
      </RadioGroupPrimitive.Item>
      {/* 호버 헤일로 + 센터 리플 — 버튼 뒤에 깔리는 pill 면 */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-2 rounded-pill text-foreground transition-colors duration-base',
          'peer-hover:state-hover-layer peer-data-[state=checked]:text-primary peer-data-[state=checked]:peer-hover:state-selected-layer peer-disabled:hidden'
        )}
      >
        {ripples}
      </span>
    </span>
  )
}

export { RadioGroup, RadioGroupItem }
