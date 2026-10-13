'use client'

/**
 * PullToRefresh — pull downward at the top of the scroller to refresh.
 *
 * The @comwit/ui PullToRefresh primitive owns gestures and state. This layer draws only the spinner badge.
 * Position, opacity, and rotation come from --ptr-pull (pull distance in pixels) on the primitive wrapper;
 * state comes from indicator data-state="idle | pulling | armed | refreshing". No rerenders while pulling.
 *
 * This component renders its own overflow-y-auto scroller and forwards ref to it. Use
 * <ScrollChromeProvider scrollRef={ref}> so the app bar and bottom navigation observe the same scrolling.
 * The scroller content is never transformed, preserving sticky app bars and bottom navigation inside.
 */

import * as React from 'react'
import { Loader2Icon } from '@comwit/ui/icons'
import { PullToRefresh as PullToRefreshPrimitive } from '@comwit/ui'

import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

/** Indicator circle diameter in pixels. */
const DIAL = 34

type PullToRefreshProps = Omit<
  React.ComponentProps<typeof PullToRefreshPrimitive.Scroller>,
  'ref'
> &
  Pick<
    React.ComponentProps<typeof PullToRefreshPrimitive.Root>,
    'onRefresh' | 'enabled' | 'threshold' | 'maxPull' | 'resting'
  > & {
    /** Scroller element ref, passed to ScrollChromeProvider. */
    ref?: React.Ref<HTMLElement>
    /** Outer wrapper className; className itself styles the scroller. */
    wrapperClassName?: string
  }

function PullToRefresh({
  onRefresh,
  enabled,
  threshold,
  maxPull,
  resting,
  ref,
  className,
  wrapperClassName,
  children,
  ...props
}: PullToRefreshProps) {
  return (
    <PullToRefreshPrimitive.Root
      onRefresh={onRefresh}
      enabled={enabled}
      threshold={threshold}
      maxPull={maxPull}
      resting={resting}
      data-slot="pull-to-refresh"
      className={cn('relative flex min-h-0 flex-1 flex-col', wrapperClassName)}
    >
      <PullIndicator />
      <PullToRefreshPrimitive.Scroller
        ref={ref}
        className={cn('relative z-0 min-h-0 flex-1 overflow-x-clip', className)}
        {...props}
      >
        {children}
      </PullToRefreshPrimitive.Scroller>
    </PullToRefreshPrimitive.Root>
  )
}

/** Top spinner badge: hidden above at zero pull, moves downward as pulled, and grows slightly at the trigger point. */
function PullIndicator() {
  return (
    <PullToRefreshPrimitive.Indicator
      data-slot="pull-to-refresh-indicator"
      className="group/ptr pointer-events-none absolute top-[env(safe-area-inset-top)] left-1/2 z-appbar transition-none data-[transition]:transition-[transform,opacity] data-[transition]:duration-slow data-[transition]:ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        // At zero pull, hide above by -diameter-10; move downward as pull increases.
        transform: `translate(-50%, calc(var(--ptr-pull, 0) * 1px - ${DIAL + 10}px))`,
        opacity: 'clamp(0, calc(var(--ptr-pull, 0) / 40), 1)',
        willChange: 'transform, opacity',
      }}
    >
      {({ state }) => (
        <>
          <span className="sr-only">
            {state === 'refreshing' ? uiText.pullToRefresh.refreshing : ''}
          </span>
          <div
            className="flex items-center justify-center rounded-full bg-background shadow-panel ring-1 ring-border transition-transform duration-base group-data-[state=armed]/ptr:scale-105 group-data-[state=refreshing]/ptr:scale-105"
            style={{ width: DIAL, height: DIAL }}
          >
            <Loader2Icon
              size={18}
              strokeWidth={2.5}
              aria-hidden="true"
              className="text-subtle-foreground transition-colors group-data-[state=armed]/ptr:text-primary group-data-[state=refreshing]/ptr:animate-spin group-data-[state=refreshing]/ptr:text-primary"
              // Rotate slightly in proportion to pull for pre-trigger feedback; animate-spin handles active refreshing.
              style={
                state === 'refreshing' ? undefined : { rotate: 'calc(var(--ptr-pull, 0) * 2.6deg)' }
              }
            />
          </div>
        </>
      )}
    </PullToRefreshPrimitive.Indicator>
  )
}

export { PullToRefresh, PullIndicator }
