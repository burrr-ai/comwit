'use client'

/**
 * AppBar — 모바일 상단 앱바. 화면의 의미(무엇을 보여줄지)와 스크롤 동작(어떻게 붙어 있을지)을 분리한다.
 *
 * behavior
 *  - flow   : 문서 흐름대로 스크롤되어 올라간다. 탭 루트처럼 앱바가 거의 필요 없을 때.
 *  - pinned : 항상 상단에 붙는다(sticky). 시트·즉시 작업이 있는 목록.
 *  - reveal : 아래로 스크롤하면 숨고, 조금만 올려도 다시 나온다. 상세 화면의 기본.
 *
 * 배경은 노치까지 이어지고 실제 컨트롤만 safe-area 안쪽에 놓인다. 면은 아래로 사라지는 fade 유리라
 * 경계선이 없다. reveal 은 가장 가까운 <ScrollChromeProvider> 의 스크롤 의도를 따른다.
 *
 *   <AppBar behavior="reveal">
 *     <AppBarBackButton onClick={() => router.back()} />
 *     <AppBarTitle>Settings</AppBarTitle>
 *     <AppBarActions><Button size="icon" variant="ghost">…</Button></AppBarActions>
 *   </AppBar>
 */

import * as React from 'react'
import { ChevronLeft, X } from 'lucide-react'

import { Button } from './button'
import { Glass, GlassButton, type GlassVariant } from './glass'
import { useScrollChrome } from '../../hooks/use-scroll-chrome'
import { cn } from '../../lib/utils'

export type AppBarBehavior = 'flow' | 'pinned' | 'reveal'

type AppBarProps = React.ComponentProps<'header'> & {
  behavior?: AppBarBehavior
  /** 면 재질. false 면 투명(콘텐츠 위에 컨트롤만). 기본 fade 유리. */
  glass?: GlassVariant | false
}

function AppBar({
  behavior = 'pinned',
  glass = 'fade',
  className,
  children,
  ...props
}: AppBarProps) {
  const { compact } = useScrollChrome()
  const hidden = behavior === 'reveal' && compact

  return (
    <header
      data-slot="app-bar"
      data-behavior={behavior}
      data-hidden={hidden || undefined}
      className={cn(
        'box-content isolate z-appbar flex h-appbar items-center bg-transparent',
        'pt-[env(safe-area-inset-top)] pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))]',
        behavior === 'flow' ? 'relative' : 'sticky top-0',
        behavior === 'reveal' &&
          'transform-gpu transition-transform duration-slow ease-out focus-within:pointer-events-auto focus-within:translate-y-0 motion-reduce:transition-none',
        hidden && 'pointer-events-none -translate-y-full',
        className
      )}
      {...props}
    >
      {glass ? <Glass variant={glass} shape="panel" /> : null}
      {/* 마스크된 백드롭과 전경은 전환 첫 프레임부터 합성 레이어를 분리해야 한다(Safari 포함). */}
      <div className="relative z-raised flex w-full min-w-0 transform-gpu items-center gap-1">
        {children}
      </div>
    </header>
  )
}

function AppBarTitle({
  className,
  size = 'md',
  ...props
}: React.ComponentProps<'span'> & { size?: 'md' | 'lg' }) {
  return (
    <span
      data-slot="app-bar-title"
      className={cn(
        'min-w-0 truncate text-foreground',
        size === 'lg' ? 'pl-1 text-title-lg' : 'text-title-md',
        className
      )}
      {...props}
    />
  )
}

function AppBarActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="app-bar-actions"
      className={cn('ml-auto flex shrink-0 items-center gap-1 pl-1', className)}
      {...props}
    />
  )
}

type AppBarBackButtonProps = Omit<React.ComponentProps<typeof GlassButton>, 'children'> & {
  /** back = 유리 원 + 굵은 셰브론(이탈 동선) · close = 담백한 X(시트 닫기) */
  icon?: 'back' | 'close'
  children?: React.ReactNode
}

/** 앱바 뒤로가기 — 44px 유리 원, 그림자 없음, 28px 셰브론(stroke 2.5). */
function AppBarBackButton({
  icon = 'back',
  className,
  children,
  'aria-label': ariaLabel,
  ...props
}: AppBarBackButtonProps) {
  if (icon === 'close') {
    return (
      <Button
        variant="plain"
        size="none"
        aria-label={ariaLabel ?? 'Close'}
        className={cn(
          'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-accent',
          className
        )}
        {...(props as React.ComponentProps<typeof Button>)}
      >
        {children ?? <X className="size-5" aria-hidden="true" />}
      </Button>
    )
  }
  return (
    <GlassButton
      shape="circle"
      shadow={false}
      aria-label={ariaLabel ?? 'Back'}
      className={cn('size-11 shrink-0', className)}
      {...props}
    >
      {children ?? <ChevronLeft className="size-7" strokeWidth={2.5} aria-hidden="true" />}
    </GlassButton>
  )
}

/**
 * 풀블리드 히어로 위에 홀로 뜨는 뒤로가기. 앱바 면 없이 버튼만 고정되고,
 * 아래로 스크롤하면(ScrollChrome compact) 위로 빠져나간다.
 */
function FloatingBackButton({
  className,
  style,
  ...props
}: React.ComponentProps<typeof AppBarBackButton>) {
  const { compact } = useScrollChrome()
  return (
    <div
      data-slot="floating-back-button"
      className={cn(
        'fixed z-appbar transition-[transform,opacity] duration-slow ease-out motion-reduce:transition-none',
        compact && 'pointer-events-none opacity-0',
        className
      )}
      style={{
        left: 'max(12px, env(safe-area-inset-left))',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        transform: compact
          ? 'translateY(calc(-100% - env(safe-area-inset-top) - 16px))'
          : 'translateY(0)',
        ...style,
      }}
    >
      <AppBarBackButton {...props} />
    </div>
  )
}

export { AppBar, AppBarTitle, AppBarActions, AppBarBackButton, FloatingBackButton }
