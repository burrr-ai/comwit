'use client'

/**
 * BottomNav — 유리 렌즈가 터치를 따라 이동하는 플로팅 탭바.
 * 위치·속도를 유지하는 스프링으로 빠른 연속 탭에도 끊기지 않는다. 이동 방향으로 늘어나고,
 * 누르는 동안 부풀며, 드래그를 놓으면 해당 탭을 선택한다. 링크의 원래 click 동작을 유지한다.
 * 렌즈는 아이콘 위에 놓아 가장자리에서 아이콘과 배경을 함께 굴절시킨다.
 */

import * as React from 'react'
import { BottomNav as BottomNavPrimitive, Slottable } from '@comwit/ui'

import { Glass } from './glass'
import { focusRing, pressable } from '../../lib/interaction'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

type BottomNavProps = Omit<React.ComponentProps<typeof BottomNavPrimitive.Root>, 'children'> & {
  value?: string
  /** 아이콘 아래 작은 라벨을 보인다. 기본은 아이콘만. */
  showLabels?: boolean
  /** sticky(스크롤러 안 맨 아래) · fixed(뷰포트 맨 아래) */
  position?: 'sticky' | 'fixed'
  children: React.ReactNode
}

/** 스크롤에 따른 캡슐 축소 곡선. 렌즈의 위치·탄성은 엔진 스프링이 처리한다. */
const SPRING = {
  '--nav-scale-duration': '395ms',
  '--nav-scale-ease':
    'linear(0, 0.0596, 0.1942, 0.3408, 0.4902, 0.613, 0.7201, 0.7991, 0.8628, 0.9067, 0.9401, 0.9619, 0.9768, 0.9872, 0.9934, 0.9974, 0.9995, 1.0007, 1.0011, 1.0013, 1.0012, 1.001, 1.0008, 1.0007, 1)',
} as React.CSSProperties

function BottomNav({
  value,
  showLabels = false,
  position = 'sticky',
  compact: compactProp,
  className,
  style,
  children,
  'aria-label': ariaLabel = uiText.bottomNav,
  ...props
}: BottomNavProps) {
  const items = React.Children.toArray(children).filter(
    React.isValidElement
  ) as React.ReactElement<{ value: string }>[]
  const count = Math.max(1, items.length)
  const { barRef, lensRef } = BottomNavPrimitive.useIndicator()

  return (
    <BottomNavPrimitive.Root
      value={value}
      compact={compactProp}
      data-slot="bottom-nav"
      data-labels={showLabels ? '' : undefined}
      aria-label={ariaLabel}
      className={cn(
        'group/nav bottom-0 z-appbar px-[max(0.75rem,env(safe-area-inset-left))] pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] shrink-0',
        position === 'fixed' ? 'fixed inset-x-0' : 'sticky',
        className
      )}
      style={{ ...SPRING, ...style }}
      {...props}
    >
      {/* 유리 캡슐 — 프리미티브가 compact 를 알리면(data-state) 0.86 으로 줄어든다.
          AppBar 와 같은 규칙: 부모 페이지가 transform 중(드릴 전환)이면 WebKit 은 z-index 만으로
          backdrop-filter 레이어와 전경을 분리하지 못해 블러가 빠진다 — 캡슐은 isolate,
          인디케이터·탭은 각자 합성 레이어(transform-gpu)에 둔다. */}
      <div
        ref={barRef}
        className={cn(
          'bottom-nav-capsule relative isolate mx-auto grid h-14 w-full max-w-[336px] origin-bottom rounded-pill p-1',
          'transition-[scale] duration-(--nav-scale-duration) ease-(--nav-scale-ease)',
          'group-data-[state=compact]/nav:scale-[0.86]'
        )}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        <Glass variant="liquid" className="bottom-nav-glass" />
        {items}
        <span ref={lensRef} aria-hidden="true" className="bottom-nav-bubble">
          <Glass variant="liquid" className="bottom-nav-lens" shadow={false} />
        </span>
      </div>
    </BottomNavPrimitive.Root>
  )
}

type BottomNavItemProps = React.ComponentProps<typeof BottomNavPrimitive.Item> & {
  /** 접근성 이름. showLabels 면 아이콘 아래에도 보인다. */
  label: string
  icon: React.ReactNode
  /** 자식 요소(<a>·<Link>)를 탭으로 렌더한다. 아이콘·라벨은 그 안에 주입된다. */
  asChild?: boolean
}

function BottomNavItem({
  label,
  icon,
  asChild = false,
  className,
  children,
  ...props
}: BottomNavItemProps) {
  const content = (
    <>
      {icon}
      <span
        className="hidden text-micro font-semibold group-data-[labels]/nav:block"
        aria-hidden="true"
      >
        {label}
      </span>
    </>
  )
  return (
    <BottomNavPrimitive.Item
      asChild={asChild}
      data-slot="bottom-nav-item"
      aria-label={label}
      className={cn(
        'relative z-raised flex min-w-0 transform-gpu flex-col items-center justify-center gap-0.5 rounded-pill',
        focusRing,
        pressable,
        '[&_svg]:size-6 [&_svg]:shrink-0 [&_img]:size-7 [&_img]:object-contain',
        '[&_svg]:transition-[opacity,transform] [&_img]:transition-[filter,opacity,transform] [&_svg]:duration-base [&_img]:duration-base',
        'text-foreground/65 hover:text-foreground [&_img]:opacity-65 [&_img]:grayscale-[0.72]',
        'data-[state=active]:text-foreground data-[state=active]:[&_img]:scale-105 data-[state=active]:[&_svg]:scale-105 data-[state=active]:[&_img]:opacity-100 data-[state=active]:[&_img]:grayscale-0',
        className
      )}
      {...props}
    >
      {asChild ? <Slottable child={children}>{() => content}</Slottable> : content}
    </BottomNavPrimitive.Item>
  )
}

export { BottomNav, BottomNavItem }
