'use client'

/**
 * PullToRefresh — 스크롤 최상단에서 아래로 당겨 새로고침.
 *
 * 제스처·상태는 @comwit/ui 의 PullToRefresh 프리미티브가 갖는다. 여기서는 스피너 뱃지만 그린다:
 * 위치·불투명도·회전은 프리미티브가 래퍼에 쓰는 `--ptr-pull`(당김 px)로 계산하고, 상태는
 * 인디케이터의 `data-state="idle | pulling | armed | refreshing"` 로 읽는다. 당기는 동안 리렌더 0.
 *
 * 이 컴포넌트가 스크롤러(overflow-y-auto)를 직접 렌더한다. `ref` 는 그 스크롤러로 전달되므로
 * <ScrollChromeProvider scrollRef={ref}> 와 함께 쓰면 앱바·바텀내비가 같은 스크롤을 본다.
 * 콘텐츠(스크롤러)는 transform 되지 않는다 — 안의 sticky 앱바·바텀내비가 그대로 산다.
 */

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { PullToRefresh as PullToRefreshPrimitive } from '@comwit/ui'

import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

/** 인디케이터 원의 지름(px). */
const DIAL = 34

type PullToRefreshProps = Omit<
  React.ComponentProps<typeof PullToRefreshPrimitive.Scroller>,
  'ref'
> &
  Pick<
    React.ComponentProps<typeof PullToRefreshPrimitive.Root>,
    'onRefresh' | 'enabled' | 'threshold' | 'maxPull' | 'resting'
  > & {
    /** 스크롤러 요소 ref — ScrollChromeProvider 에 넘긴다. */
    ref?: React.Ref<HTMLElement>
    /** 바깥 래퍼 className (스크롤러는 className) */
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

/** 상단 스피너 뱃지 — 당김 0 이면 위로 숨고, 당길수록 내려오며 발동 지점에서 살짝 커진다. */
function PullIndicator() {
  return (
    <PullToRefreshPrimitive.Indicator
      data-slot="pull-to-refresh-indicator"
      className="group/ptr pointer-events-none absolute top-[env(safe-area-inset-top)] left-1/2 z-appbar transition-none data-[transition]:transition-[transform,opacity] data-[transition]:duration-slow data-[transition]:ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        // 당김 0 → 위로 숨김(-지름-10), 당길수록 내려온다.
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
            <Loader2
              size={18}
              strokeWidth={2.5}
              aria-hidden="true"
              className="text-subtle-foreground transition-colors group-data-[state=armed]/ptr:text-primary group-data-[state=refreshing]/ptr:animate-spin group-data-[state=refreshing]/ptr:text-primary"
              // 당기는 중엔 당김에 비례해 살짝 감긴다(발동 전 피드백). 도는 중엔 animate-spin 이 담당.
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
