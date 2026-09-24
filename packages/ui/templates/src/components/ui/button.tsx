'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { Button as ButtonPrimitive } from '@comwit/ui'
import { disabledStyle, focusRing, pressable } from '../../lib/interaction'
import { cn } from '../../lib/utils'

/** 면이 있는 변형이 공유하는 컨트롤 박스 — 반경·타입스케일·굵기. `plain` 은 이걸 안 받는다. */
const controlBox = 'rounded-pill text-label font-semibold'

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none shrink-0',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    focusRing,
    pressable,
    disabledStyle
  ),
  {
    variants: {
      variant: {
        default: `${controlBox} bg-primary text-primary-foreground hover:bg-primary-strong`,
        destructive: `${controlBox} bg-destructive text-destructive-foreground hover:bg-destructive-strong`,
        outline: `${controlBox} border border-input bg-background hover:bg-accent hover:text-accent-foreground`,
        secondary: `${controlBox} bg-secondary text-secondary-foreground hover:bg-accent`,
        ghost: `${controlBox} hover:bg-accent hover:text-accent-foreground`,
        link: `${controlBox} text-primary underline-offset-4 hover:underline`,
        /**
         * 외형 없음 — 반경·타입스케일·굵기·색을 하나도 강제하지 않는다.
         * 이미 자기 스타일을 다 갖고 있는 native `<button>` 을 옮길 때 쓴다.
         * 얻는 건 공용 포커스 링·눌림·비활성 처리뿐이라 화면이 그대로 유지된다.
         */
        plain: '',
      },
      size: {
        sm: 'h-8 px-3',
        default: 'h-9 px-4',
        lg: 'h-10 px-6',
        icon: 'size-9',
        /** 높이·패딩을 호출부가 소유한다(`plain` 과 짝). */
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * 호출부가 들고 온 `transition-*` 을 걷어낸다.
 *
 * 전환은 Button 이 소유한다(`pressable` — 색·보더·그림자·**transform**). 호출부에 `transition-colors`
 * 가 있으면 tailwind-merge 가 그쪽을 남기는데, 그 목록엔 transform 이 없어 눌림 스케일이 튄다.
 * `duration-*`·`ease-*` 는 남긴다 — 곡선·시간은 호출부가 정해도 된다.
 */
function stripTransition(className?: string) {
  if (!className) return className
  return className
    .split(/\s+/)
    .filter((token) => !token.slice(token.lastIndexOf(':') + 1).startsWith('transition'))
    .join(' ')
}

/**
 * 동작(disabled·type·asChild)은 comwit-ui Button 프리미티브가 소유하고, 여기서는 시각만 입힌다.
 *
 * **리플은 쓰지 않는다.** 누른 느낌은 `pressable`(살짝 눌리는 스케일) 하나로 낸다 — 즉시 반응해서
 * 더 조용하고, 리플이 요구하던 `overflow:hidden` 이 사라져 밑줄·링·배지를 잘라먹지 않는다.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  return (
    <ButtonPrimitive
      asChild={asChild}
      disableRipple
      className={cn(buttonVariants({ variant, size, className: stripTransition(className) }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
