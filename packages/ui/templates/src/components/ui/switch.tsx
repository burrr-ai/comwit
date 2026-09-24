'use client'

import * as React from 'react'
import { cva } from 'class-variance-authority'

import { Switch as SwitchPrimitive } from '@comwit/ui'
import { focusRing } from '../../lib/interaction'
import { cn } from '../../lib/utils'

// 트랙 = Root(button). 이름 있는 group/switch 로 눌림을 썸에 전달 — 바깥 .group 과 섞이지 않게
const switchTrackVariants = cva(
  'group/switch relative inline-flex shrink-0 cursor-pointer rounded-pill bg-input transition-colors duration-base data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-disabled',
  {
    variants: {
      size: {
        default: 'h-6 w-10',
        sm: 'h-5 w-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

/* 썸 색은 트랙 상태를 따라간다 — 꺼짐은 항상 밝은 --switch-thumb, 켜짐은 primary 와 대비되는
   --primary-foreground. 단색 하나로는 다크에서 둘 중 하나가 트랙에 묻힌다. */
const switchThumbVariants = cva(
  'pointer-events-none absolute left-0.5 top-0.5 rounded-pill bg-switch-thumb shadow-raised transition-transform duration-base ease-out group-active/switch:scale-press-thumb data-[state=checked]:bg-primary-foreground',
  {
    variants: {
      size: {
        default: 'size-5 data-[state=checked]:translate-x-4',
        sm: 'size-4 data-[state=checked]:translate-x-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

// size 는 우리 토큰 배리언트 (프리미티브의 button size 와 충돌하지 않게 Omit)
type SwitchProps = Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, 'size'> & {
  size?: 'sm' | 'default'
}

function Switch({ className, size, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchTrackVariants({ size }), focusRing, className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
