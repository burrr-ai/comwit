'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from '@comwit/ui'

import { GlassSurface } from './glass'
import { OverlayMotion } from '../../lib/overlay-motion'
import { cn } from '../../lib/utils'

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <GlassSurface variant="morphing" shape="panel">
        <PopoverPrimitive.Content
          data-slot="popover-content"
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'text-popover-foreground z-dropdown w-72 origin-(--radix-popover-content-transform-origin) rounded-card p-4 outline-none',
            className
          )}
          {...props}
          asChild
        >
          {/* 트리거 쪽에서 0.6 배로 커지며 나타나고 같은 길로 사라진다 — lib/overlay-motion */}
          <OverlayMotion preset="menu">{children}</OverlayMotion>
        </PopoverPrimitive.Content>
      </GlassSurface>
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
