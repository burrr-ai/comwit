'use client'

/**
 * BottomNav — floating glass capsule tab bar.
 *
 * - Morphing glass capsule with a spring-driven pill indicator that slides and briefly squashes behind the active tab.
 * - Scales to 0.86 on downward scroll (ScrollChrome compact), expanding immediately on press or focus.
 * - Icons only by default, with labels in aria-label. Touch targets are at least 44px; adds safe-area-inset-bottom.
 *
 * The @comwit/ui BottomNav primitive owns selection, compact mode, and expansion, exposing data-state.
 * This layer draws the glass capsule, spring indicator, and labels. Springs use CSS transition linear() curves
 * (SPRING below). Only the squash uses a one-shot Web Animations API animation on tab changes; no animation library.
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
  /** Show a small label below each icon. Defaults to icons only. */
  showLabels?: boolean
  /** sticky: bottom of the scroller; fixed: bottom of the viewport. */
  position?: 'sticky' | 'fixed'
  children: React.ReactNode
}

/**
 * Spring samples expanded into CSS curves. Position uses stiffness 420, damping 32, mass 0.72 (no overshoot);
 * capsule scale uses 390, 30, 0.72 (0.1% overshoot). Adjust both the curve and duration to change the feel.
 */
const SPRING = {
  '--nav-slide-duration': '293ms',
  '--nav-slide-ease':
    'linear(0, 0.0386, 0.1241, 0.2407, 0.3533, 0.4611, 0.559, 0.6447, 0.7233, 0.7832, 0.8322, 0.8716, 0.9029, 0.9292, 0.9478, 0.962, 0.9727, 0.9813, 0.987, 0.9912, 0.9942, 0.9964, 0.9979, 0.9989, 1)',
  '--nav-scale-duration': '395ms',
  '--nav-scale-ease':
    'linear(0, 0.0596, 0.1942, 0.3408, 0.4902, 0.613, 0.7201, 0.7991, 0.8628, 0.9067, 0.9401, 0.9619, 0.9768, 0.9872, 0.9934, 0.9974, 0.9995, 1.0007, 1.0011, 1.0013, 1.0012, 1.001, 1.0008, 1.0007, 1)',
} as React.CSSProperties

/** Squash and restore the indicator once when the active tab changes. */
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

  // Squash only after a tab change, never on the initial render.
  const shapeRef = React.useRef<HTMLSpanElement>(null)
  const previousIndex = React.useRef(activeIndex)
  React.useEffect(() => {
    if (previousIndex.current === activeIndex) return
    previousIndex.current = activeIndex
    const shape = shapeRef.current
    if (!shape || typeof shape.animate !== 'function') return
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
      {/*
       * Glass capsule scales to 0.86 when the primitive exposes compact data-state.
       * Same rule as AppBar: while a parent page is transformed during a drill transition, WebKit cannot separate
       * the backdrop-filter layer and foreground using z-index alone, so blur disappears. Isolate the capsule
       * and put the indicator and tabs on their own compositing layers with transform-gpu.
       */}
      <div
        className={cn(
          'relative isolate mx-auto grid h-14 w-full max-w-[336px] origin-bottom rounded-pill p-1',
          'transition-[scale] duration-(--nav-scale-duration) ease-(--nav-scale-ease)',
          'group-data-[state=compact]/nav:scale-[0.86]'
        )}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        <Glass />
        {activeIndex >= 0 ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-1 transform-gpu">
            <span
              className="absolute inset-y-0 left-0 flex justify-center transition-[translate] duration-(--nav-slide-duration) ease-(--nav-slide-ease)"
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
  /** Accessible name. Also displayed below the icon when showLabels is enabled. */
  label: string
  icon: React.ReactNode
  /** Render the child (a or Link) as the tab, injecting its icon and label inside. */
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
