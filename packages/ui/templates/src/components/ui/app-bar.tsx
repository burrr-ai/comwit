'use client'

/**
 * AppBar — mobile top app bar. Separates screen content from scroll behavior.
 *
 * behavior (owned by @comwit/ui AppBar.Root; this layer styles its data-state):
 * - flow: scrolls away with the document; useful for tab roots that rarely need an app bar.
 * - pinned: remains sticky at the top; useful for sheets and lists with immediate actions.
 * - reveal: hides when scrolling down and returns on a small upward scroll; default for details.
 *
 * The background extends beneath the notch while controls stay within the safe area. The glass surface fades
 * at its lower edge without a border. reveal follows scroll intent from the nearest ScrollChromeProvider.
 *
 *   <AppBar behavior="reveal">
 *     <AppBarBackButton onClick={() => router.back()} />
 *     <AppBarTitle>Settings</AppBarTitle>
 *     <AppBarActions><Button size="icon" variant="ghost">…</Button></AppBarActions>
 *   </AppBar>
 */

import * as React from 'react'
import { ChevronLeftIcon, XIcon } from '@comwit/ui/icons'
import { AppBar as AppBarPrimitive } from '@comwit/ui'

import { Button } from './button'
import { Glass, GlassButton, type GlassVariant } from './glass'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

export type AppBarBehavior = NonNullable<
  React.ComponentProps<typeof AppBarPrimitive.Root>['behavior']
>

type AppBarProps = React.ComponentProps<typeof AppBarPrimitive.Root> & {
  /** Surface material. False leaves only controls over the content. Defaults to fading glass. */
  glass?: GlassVariant | false
}

function AppBar({
  behavior = 'pinned',
  glass = 'fade',
  className,
  children,
  ...props
}: AppBarProps) {
  return (
    <AppBarPrimitive.Root
      behavior={behavior}
      data-slot="app-bar"
      className={cn(
        // shrink-0: in a fixed-height flex column, the app bar can shrink to its 36px content height. When the exiting page
        // becomes absolute, it returns to 56px and shifts content by the difference. App chrome must never shrink.
        'box-content isolate z-appbar flex h-appbar shrink-0 items-center bg-transparent',
        'pt-[env(safe-area-inset-top)] pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))]',
        behavior === 'flow' ? 'relative' : 'sticky top-0',
        behavior === 'reveal' &&
          'transform-gpu transition-transform duration-slow ease-out focus-within:pointer-events-auto focus-within:translate-y-0',
        'data-[state=hidden]:pointer-events-none data-[state=hidden]:-translate-y-full',
        className
      )}
      {...props}
    >
      {glass ? <Glass variant={glass} shape="panel" /> : null}
      {/* Separate the masked backdrop and foreground into compositing layers from the first transition frame, including Safari. */}
      <div className="relative z-raised flex w-full min-w-0 transform-gpu items-center gap-1">
        {children}
      </div>
    </AppBarPrimitive.Root>
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
  /** Back: a glass circle with a bold chevron for navigation. Close: a simple X for dismissing a sheet. */
  icon?: 'back' | 'close'
  children?: React.ReactNode
}

/** App-bar back button: 44px glass circle, no shadow, 28px chevron with stroke 2.5. */
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
        aria-label={ariaLabel ?? uiText.close}
        className={cn(
          'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-accent',
          className
        )}
        {...(props as React.ComponentProps<typeof Button>)}
      >
        {children ?? <XIcon className="size-5" aria-hidden="true" />}
      </Button>
    )
  }
  return (
    <GlassButton
      shape="circle"
      shadow={false}
      aria-label={ariaLabel ?? uiText.back}
      className={cn('size-11 shrink-0', className)}
      {...props}
    >
      {children ?? <ChevronLeftIcon className="size-7" strokeWidth={2.5} aria-hidden="true" />}
    </GlassButton>
  )
}

/**
 * Standalone back button floating above a full-bleed hero. Only the button is fixed, without an app-bar surface.
 * It slides upward out of view when scrolling down (ScrollChrome compact).
 */
function FloatingBackButton({
  className,
  style,
  ...props
}: React.ComponentProps<typeof AppBarBackButton>) {
  return (
    <AppBarPrimitive.Root asChild behavior="reveal">
      <div
        data-slot="floating-back-button"
        className={cn(
          'fixed z-appbar transition-[transform,opacity] duration-slow ease-out',
          'data-[state=hidden]:pointer-events-none data-[state=hidden]:opacity-0 data-[state=hidden]:[transform:translateY(calc(-100%-env(safe-area-inset-top)-16px))]',
          className
        )}
        style={{
          left: 'max(12px, env(safe-area-inset-left))',
          top: 'calc(env(safe-area-inset-top) + 12px)',
          ...style,
        }}
      >
        <AppBarBackButton {...props} />
      </div>
    </AppBarPrimitive.Root>
  )
}

export { AppBar, AppBarTitle, AppBarActions, AppBarBackButton, FloatingBackButton }
