'use client'

/**
 * RadioGroup — 라디오 스타일 레이어. **동작·a11y(roving focus·화살표키·form 참여)는
 * comwit-ui `RadioGroup` 프리미티브(= Radix)가 책임**지고, 여기서는 우리 토큰으로 **시각만** 입힌다.
 *
 * 프리미티브의 Item 은 <button role="radio">(네이티브 input 아님)이라, 기존 커스텀 UX 를
 * `data-state`(checked/unchecked)·`data-disabled` 훅으로 그대로 재현한다:
 *  - 호버 헤일로 + 중앙 리플(useCenterRipple) — 버튼 뒤에 깔리는 pill 면.
 *  - 도트 팝 — Indicator(forceMount)를 항상 마운트해 두고 scale 로 스프링 인/아웃(체크 해제 시 exit 애니 유지).
 *  - 포커스 링(focusRing) · 체크 시 보더 강조.
 *
 * public API 보존: RadioGroup(value/defaultValue/onValueChange/name/disabled), RadioGroupItem(value).
 */

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
    <span className="relative inline-flex shrink-0">
      <RadioGroupPrimitive.Item
        data-slot="radio-group-item"
        disabled={disabled}
        className={cn(
          'peer relative z-raised size-5 shrink-0 cursor-pointer rounded-full border border-input bg-transparent',
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
        {/* 도트 — 항상 마운트(forceMount)해 두고 스프링으로 팝 인/아웃. */}
        <RadioGroupPrimitive.Indicator
          forceMount
          className="pointer-events-none absolute inset-0 z-raised m-auto size-2.5 scale-0 rounded-full bg-primary transition-transform duration-base ease-emphasized data-[state=checked]:scale-100 data-[disabled]:opacity-disabled"
        />
      </RadioGroupPrimitive.Item>
      {/* 호버 헤일로 + 센터 리플 (버튼 뒤에 깔리는 pill 면) */}
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
