'use client'

/**
 * BottomNav — 플로팅 유리 캡슐 하단 탭바.
 *
 *  - 캡슐은 morphing 유리, 활성 탭 뒤로 알약 인디케이터가 스프링으로 미끄러지며 살짝 찌그러진다.
 *  - 아래로 스크롤하면 0.86 으로 작아지고(ScrollChrome compact), 누르거나 포커스가 들어오면 즉시 펼친다.
 *  - 기본은 아이콘만(라벨은 aria-label). 터치 영역은 44px 이상, safe-area-inset-bottom 을 더한다.
 *
 *   <BottomNav value={tab} onValueChange={setTab}>
 *     <BottomNavItem value="home" label="Home" icon={<House />} />
 *     <BottomNavItem value="feed" label="Feed" icon={<Compass />} asChild>
 *       <Link href="/feed" />
 *     </BottomNavItem>
 *   </BottomNav>
 */

import * as React from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'

import { Glass } from './glass'
import { useScrollChrome } from '../../hooks/use-scroll-chrome'
import { focusRing, pressable } from '../../lib/interaction'
import { cn } from '../../lib/utils'

type BottomNavContextValue = {
  value?: string
  onValueChange?: (value: string) => void
  showLabels: boolean
}

const BottomNavContext = React.createContext<BottomNavContextValue>({ showLabels: false })

type BottomNavProps = Omit<React.ComponentProps<'nav'>, 'children'> & {
  value?: string
  onValueChange?: (value: string) => void
  /** 아이콘 아래 작은 라벨을 보인다. 기본은 아이콘만. */
  showLabels?: boolean
  /** sticky(스크롤러 안 맨 아래) · fixed(뷰포트 맨 아래) */
  position?: 'sticky' | 'fixed'
  /** 스크롤 의도 대신 호출부가 compact 를 직접 정할 때 */
  compact?: boolean
  children: React.ReactNode
}

const SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.72 } as const
const SCALE_SPRING = { type: 'spring', stiffness: 390, damping: 30, mass: 0.72 } as const
const SQUASH = { scaleX: [1, 1.12, 0.98, 1], scaleY: [1, 0.97, 1.01, 1] }

function BottomNav({
  value,
  onValueChange,
  showLabels = false,
  position = 'sticky',
  compact: compactProp,
  className,
  children,
  'aria-label': ariaLabel = 'Main',
  ...props
}: BottomNavProps) {
  const reduceMotion = Boolean(useReducedMotion())
  const chrome = useScrollChrome()
  const compact = compactProp ?? chrome.compact

  const items = React.Children.toArray(children).filter(
    React.isValidElement
  ) as React.ReactElement<{
    value: string
  }>[]
  const count = Math.max(1, items.length)
  const activeIndex = items.findIndex((item) => item.props.value === value)

  // 탭 수만큼 위치/찌그러짐 변형을 만든다 — 키가 바뀔 때마다 부모 위치 스프링과 자식 squash 가 함께 돈다.
  const { position: positionVariants, shape: shapeVariants } = React.useMemo(() => {
    const pos: Variants = {}
    const shape: Variants = {}
    for (let i = 0; i < count; i += 1) {
      pos[String(i)] = { x: `${i * 100}%` }
      shape[String(i)] = SQUASH
    }
    return { position: pos, shape }
  }, [count])

  const context = React.useMemo(
    () => ({ value, onValueChange, showLabels }),
    [value, onValueChange, showLabels]
  )

  return (
    <nav
      data-slot="bottom-nav"
      aria-label={ariaLabel}
      className={cn(
        'bottom-0 z-appbar px-[max(0.75rem,env(safe-area-inset-left))] pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]',
        position === 'fixed' ? 'fixed inset-x-0' : 'sticky',
        className
      )}
      onPointerDownCapture={() => {
        if (compact) chrome.expand()
      }}
      onFocusCapture={() => {
        if (compact) chrome.expand()
      }}
      {...props}
    >
      <motion.div
        className="relative mx-auto grid h-14 w-full max-w-[336px] origin-bottom rounded-pill p-1"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        initial={false}
        animate={{ scale: compact ? 0.86 : 1 }}
        transition={reduceMotion ? { duration: 0 } : SCALE_SPRING}
      >
        <Glass />
        {activeIndex >= 0 ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-1">
            <motion.span
              className="absolute inset-y-0 left-0 flex justify-center"
              style={{ width: `${100 / count}%` }}
              initial={false}
              animate={String(activeIndex)}
              variants={positionVariants}
              transition={reduceMotion ? { duration: 0 } : SPRING}
            >
              <motion.span
                className="floating-tab-indicator size-full rounded-pill"
                variants={reduceMotion ? undefined : shapeVariants}
                transition={{ duration: 0.4, times: [0, 0.38, 0.72, 1], ease: 'easeInOut' }}
              />
            </motion.span>
          </div>
        ) : null}
        <BottomNavContext.Provider value={context}>{items}</BottomNavContext.Provider>
      </motion.div>
    </nav>
  )
}

type BottomNavItemProps = Omit<React.ComponentProps<'button'>, 'value'> & {
  value: string
  /** 접근성 이름. showLabels 면 아이콘 아래에도 보인다. */
  label: string
  icon: React.ReactNode
  /** 자식 요소(<a>·<Link>)를 탭으로 렌더한다. 아이콘·라벨은 그 안에 주입된다. */
  asChild?: boolean
}

function BottomNavItem({
  value,
  label,
  icon,
  asChild = false,
  className,
  onClick,
  children,
  ...props
}: BottomNavItemProps) {
  const nav = React.useContext(BottomNavContext)
  const active = nav.value === value

  const itemProps = {
    'data-slot': 'bottom-nav-item',
    'data-active': active || undefined,
    'aria-current': active ? ('page' as const) : undefined,
    'aria-label': label,
    className: cn(
      'relative z-raised flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-pill',
      focusRing,
      pressable,
      'motion-reduce:transition-none motion-reduce:active:scale-100',
      '[&_svg]:size-6 [&_svg]:shrink-0 [&_img]:size-7 [&_img]:object-contain',
      '[&_svg]:transition-[opacity,transform] [&_img]:transition-[filter,opacity,transform] [&_svg]:duration-base [&_img]:duration-base',
      active
        ? 'text-foreground [&_img]:scale-105 [&_svg]:scale-105'
        : 'text-foreground/65 hover:bg-accent/35 hover:text-foreground [&_img]:opacity-65 [&_img]:grayscale-[0.72]',
      className
    ),
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) nav.onValueChange?.(value)
    },
  }

  const content = (
    <>
      {icon}
      {nav.showLabels ? (
        <span className="text-micro font-semibold" aria-hidden="true">
          {label}
        </span>
      ) : null}
    </>
  )

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>
    return React.cloneElement(
      child,
      {
        ...props,
        ...itemProps,
        className: cn(itemProps.className, child.props.className as string | undefined),
      },
      content
    )
  }

  return (
    <button type="button" {...props} {...itemProps}>
      {content}
    </button>
  )
}

export { BottomNav, BottomNavItem }
