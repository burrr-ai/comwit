'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from '@comwit/ui'

import { GlassSurface, type GlassPanelVariant } from './glass'
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
  glassVariant = 'morphing',
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Transparent edge refraction (default) or a denser, softly blurred panel. */
  glassVariant?: GlassPanelVariant
}) {
  return (
    <PopoverPrimitive.Portal>
      <GlassSurface variant={glassVariant} shape="panel">
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
          {/* Grow from scale 0.6 toward the trigger and exit along the same path using lib/overlay-motion. */}
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
