'use client'

/**
 * BottomNav — 플로팅 유리 캡슐 하단 탭바.
 *
 *  - 캡슐은 morphing 유리, 활성 탭 뒤로 알약 인디케이터가 스프링으로 미끄러지며 살짝 찌그러진다.
 *  - 아래로 스크롤하면 0.86 으로 작아지고(ScrollChrome compact), 누르거나 포커스가 들어오면 즉시 펼친다.
 *  - 기본은 아이콘만(라벨은 aria-label). 터치 영역은 44px 이상, safe-area-inset-bottom 을 더한다.
 *
 * 선택·compact·펼치기 동작은 @comwit/ui 의 BottomNav 프리미티브가 갖는다(data-state 로 알린다).
 * 여기서는 유리 캡슐·스프링 인디케이터·라벨 표시만 입힌다. 스프링은 CSS 전환의 linear() 곡선이고(아래 SPRING),
 * 찌그러짐만 탭이 바뀔 때 Web Animations API 로 한 번 돈다 — 애니메이션 라이브러리 없이.
 *
 *   <BottomNav value={tab} onValueChange={setTab}>
 *     <BottomNavItem value="home" label="Home" icon={<House />} />
 *     <BottomNavItem value="feed" label="Feed" icon={<Compass />} asChild>
 *       <Link href="/feed" />
 *     </BottomNavItem>
 *   </BottomNav>
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

/**
 * 스프링을 CSS 곡선으로 편 값 — 위치는 stiffness 420 · damping 32 · mass 0.72(오버슈트 없음),
 * 캡슐 스케일은 390 · 30 · 0.72(0.1% 넘쳤다 돌아온다). 느낌을 바꾸려면 곡선과 시간을 같이 바꾼다.
 */
const SPRING = {
  '--nav-slide-duration': '293ms',
  '--nav-slide-ease':
    'linear(0, 0.0386, 0.1241, 0.2407, 0.3533, 0.4611, 0.559, 0.6447, 0.7233, 0.7832, 0.8322, 0.8716, 0.9029, 0.9292, 0.9478, 0.962, 0.9727, 0.9813, 0.987, 0.9912, 0.9942, 0.9964, 0.9979, 0.9989, 1)',
  '--nav-scale-duration': '395ms',
  '--nav-scale-ease':
    'linear(0, 0.0596, 0.1942, 0.3408, 0.4902, 0.613, 0.7201, 0.7991, 0.8628, 0.9067, 0.9401, 0.9619, 0.9768, 0.9872, 0.9934, 0.9974, 0.9995, 1.0007, 1.0011, 1.0013, 1.0012, 1.001, 1.0008, 1.0007, 1)',
} as React.CSSProperties

/** 탭이 바뀔 때 인디케이터가 한 번 찌그러졌다 돌아온다. */
const SQUASH: Keyframe[] = [
  { transform: 'scale(1, 1)', easing: 'ease-in-out' },
  { transform: 'scale(1.12, 0.97)', offset: 0.38, easing: 'ease-in-out' },
  { transform: 'scale(0.98, 1.01)', offset: 0.72, easing: 'ease-in-out' },
  { transform: 'scale(1, 1)' },
]

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
  const activeIndex = items.findIndex((item) => item.props.value === value)

  // 탭이 바뀐 뒤에만 찌그러진다 — 첫 렌더와 동작 줄이기 설정에선 돌지 않는다.
  const shapeRef = React.useRef<HTMLSpanElement>(null)
  const previousIndex = React.useRef(activeIndex)
  React.useEffect(() => {
    if (previousIndex.current === activeIndex) return
    previousIndex.current = activeIndex
    const shape = shapeRef.current
    if (!shape || typeof shape.animate !== 'function') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    shape.animate(SQUASH, { duration: 400 })
  }, [activeIndex])

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
        className={cn(
          'relative isolate mx-auto grid h-14 w-full max-w-[336px] origin-bottom rounded-pill p-1',
          'transition-[scale] duration-(--nav-scale-duration) ease-(--nav-scale-ease) motion-reduce:transition-none',
          'group-data-[state=compact]/nav:scale-[0.86]'
        )}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        <Glass />
        {activeIndex >= 0 ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-1 transform-gpu">
            <span
              className="absolute inset-y-0 left-0 flex justify-center transition-[translate] duration-(--nav-slide-duration) ease-(--nav-slide-ease) motion-reduce:transition-none"
              style={{ width: `${100 / count}%`, translate: `${activeIndex * 100}% 0` }}
            >
              <span ref={shapeRef} className="floating-tab-indicator size-full rounded-pill" />
            </span>
          </div>
        ) : null}
        {items}
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
        'motion-reduce:transition-none motion-reduce:active:scale-100',
        '[&_svg]:size-6 [&_svg]:shrink-0 [&_img]:size-7 [&_img]:object-contain',
        '[&_svg]:transition-[opacity,transform] [&_img]:transition-[filter,opacity,transform] [&_svg]:duration-base [&_img]:duration-base',
        'text-foreground/65 hover:bg-accent/35 hover:text-foreground [&_img]:opacity-65 [&_img]:grayscale-[0.72]',
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
