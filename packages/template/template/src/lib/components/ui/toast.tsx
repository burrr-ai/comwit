'use client'

/**
 * Toast — glass notification. Mobile uses the layout width at top center with upward swipe; desktop uses
 * a fixed width at top right with rightward swipe.
 *
 * Sonner owns positioning, stacking, swiping, timers, and accessibility. We own the surface: toast() supplies
 * a Toast component through sonner toast.custom, using GlassSurface with the same refractive glass as menus
 * and popovers. Each toast is a React component rather than a CSS override of Sonner's default skin.
 *
 *   // Mount once at the app root, beside overlay-kit's OverlayProvider.
 *   <Toaster />
 *
 *   import { toast } from '@/components/ui/toast'
 *   toast.success('Changes saved', { description: 'Just now', action: { label: 'Undo', onClick } })
 *   toast.promise(save(), { loading: 'Saving…', success: 'Saved', error: 'Could not save' })
 *
 * Success, error, and warning share the same surface; only the small solid icon circle on the left indicates
 * status. Auto-dismiss means no close button by default; enable closeButton when needed. Mobile spacing
 * uses --page-gutter and safe-area tokens. Always import toast from this file: importing directly from
 * sonner displays its default skin.
 */

import * as React from 'react'
import { CheckCircle2Icon, InfoIcon, Loader2Icon, AlertTriangleIcon, XIcon, XCircleIcon } from '@comwit/ui/icons'
import { Toaster as Sonner, toast as sonner, type ExternalToast, type ToasterProps } from 'sonner'

import { Button } from '@/lib/components/ui/button'
import { GlassSurface } from '@/lib/components/ui/glass'
import { useMobile } from '@comwit/ui'
import { focusRing } from '@/lib/interaction'
import { cn } from '@/lib/utils/cn'
import { uiText } from '@/lib/ui-text'

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'

export type ToastAction = {
  label: React.ReactNode
  /**
   * Calling preventDefault keeps the toast open.
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export type ToastOptions = {
  /**
   * Calling again with the same ID updates that toast, such as loading → success.
   */
  id?: string | number
  description?: React.ReactNode
  /**
   * Duration in milliseconds. Infinity keeps it until dismissed; loading defaults to Infinity.
   */
  duration?: number
  /**
   * Replaces the status icon.
   */
  icon?: React.ReactNode
  action?: ToastAction
  cancel?: ToastAction
  closeButton?: boolean
  /**
   * False prevents dismissal by swipe or click.
   */
  dismissible?: boolean
  position?: ToasterProps['position']
  onDismiss?: () => void
  onAutoClose?: () => void
}

const STATUS_ICON: Record<Exclude<ToastType, 'default'>, React.ReactNode> = {
  success: (
    <span className="flex size-8 items-center justify-center rounded-full bg-success text-success-foreground">
      <CheckCircle2Icon className="size-4" aria-hidden="true" />
    </span>
  ),
  error: (
    <span className="flex size-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
      <XCircleIcon className="size-4" aria-hidden="true" />
    </span>
  ),
  warning: (
    <span className="flex size-8 items-center justify-center rounded-full bg-warning text-warning-foreground">
      <AlertTriangleIcon className="size-4" aria-hidden="true" />
    </span>
  ),
  info: (
    <span className="flex size-8 items-center justify-center rounded-full bg-info text-info-foreground">
      <InfoIcon className="size-4" aria-hidden="true" />
    </span>
  ),
  loading: (
    <span className="flex size-8 items-center justify-center rounded-full bg-primary-surface text-primary">
      <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
    </span>
  ),
}

type ToastProps = Pick<
  ToastOptions,
  'description' | 'icon' | 'action' | 'cancel' | 'closeButton'
> & {
  /**
   * Toast ID supplied by Sonner, used by buttons when dismissing it.
   */
  id: string | number
  type?: ToastType
  title: React.ReactNode
  className?: string
}

/**
 * One toast: the glass surface passed to Sonner by toast(). It can also be rendered directly:
 * toast.custom((id) => <Toast id={id} title="…" />). Width comes from Toaster's --width because Sonner
 * does not set a width on custom-toast slots.
 */
function Toast({
  id,
  type = 'default',
  title,
  description,
  icon,
  action,
  cancel,
  closeButton,
  className,
}: ToastProps) {
  const statusIcon = icon ?? (type === 'default' ? null : STATUS_ICON[type])
  const press =
    (handler: ToastAction['onClick']) => (event: React.MouseEvent<HTMLButtonElement>) => {
      handler?.(event)
      if (!event.defaultPrevented) sonner.dismiss(id)
    }

  return (
    <GlassSurface variant="morphing" shape="panel">
      <div
        data-slot="toast"
        data-type={type}
        className={cn(
          'flex w-(--width) items-center gap-3 rounded-sheet px-4 py-3.5 text-label text-popover-foreground',
          className
        )}
      >
        {statusIcon ? (
          <span data-slot="toast-icon" className="flex shrink-0 items-center justify-center">
            {statusIcon}
          </span>
        ) : null}
        <div data-slot="toast-content" className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-foreground">{title}</p>
          {description ? (
            <p className="mt-0.5 text-body-sm leading-snug text-soft-foreground">{description}</p>
          ) : null}
        </div>
        {cancel ? (
          <Button size="sm" variant="secondary" onClick={press(cancel.onClick)}>
            {cancel.label}
          </Button>
        ) : null}
        {action ? (
          <Button size="sm" onClick={press(action.onClick)}>
            {action.label}
          </Button>
        ) : null}
        {closeButton ? (
          <button
            type="button"
            aria-label={uiText.toast.close}
            onClick={() => sonner.dismiss(id)}
            className={cn(
              focusRing,
              '-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground'
            )}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </GlassSurface>
  )
}

function show(type: ToastType, title: React.ReactNode, options: ToastOptions = {}) {
  const { id, description, duration, icon, action, cancel, closeButton, ...rest } = options
  // Do not pass undefined keys: when updating the same ID, Sonner would erase prior values such as loading's Infinity duration.
  const data: ExternalToast = {}
  if (id !== undefined) data.id = id
  const life = duration ?? (type === 'loading' ? Infinity : undefined)
  if (life !== undefined) data.duration = life
  if (rest.dismissible !== undefined) data.dismissible = rest.dismissible
  if (rest.position !== undefined) data.position = rest.position
  if (rest.onDismiss) data.onDismiss = () => rest.onDismiss?.()
  if (rest.onAutoClose) data.onAutoClose = () => rest.onAutoClose?.()

  return sonner.custom(
    (toastId) => (
      <Toast
        id={toastId}
        type={type}
        title={title}
        description={description}
        icon={icon}
        action={action}
        cancel={cancel}
        closeButton={closeButton}
      />
    ),
    data
  )
}

type PromiseMessages<T> = {
  loading: React.ReactNode
  success: React.ReactNode | ((value: T) => React.ReactNode)
  error: React.ReactNode | ((error: unknown) => React.ReactNode)
  description?: React.ReactNode
}

/** `toast('…')` · `toast.success('…', { description })` · `toast.promise(p, { loading, success, error })` */
const toast = Object.assign(
  (title: React.ReactNode, options?: ToastOptions) => show('default', title, options),
  {
    success: (title: React.ReactNode, options?: ToastOptions) => show('success', title, options),
    error: (title: React.ReactNode, options?: ToastOptions) => show('error', title, options),
    warning: (title: React.ReactNode, options?: ToastOptions) => show('warning', title, options),
    info: (title: React.ReactNode, options?: ToastOptions) => show('info', title, options),
    loading: (title: React.ReactNode, options?: ToastOptions) => show('loading', title, options),
    /**
     * Move one toast from loading to success/error. Returns its ID so it can also be updated manually.
     */
    promise<T>(
      promise: Promise<T> | (() => Promise<T>),
      messages: PromiseMessages<T>,
      options: Omit<ToastOptions, 'id' | 'description'> = {}
    ) {
      const id = show('loading', messages.loading, {
        ...options,
        description: messages.description,
      })
      const pending = typeof promise === 'function' ? promise() : promise
      pending.then(
        (value) =>
          show(
            'success',
            typeof messages.success === 'function' ? messages.success(value) : messages.success,
            {
              ...options,
              id,
              description: messages.description,
            }
          ),
        (error: unknown) =>
          show(
            'error',
            typeof messages.error === 'function' ? messages.error(error) : messages.error,
            {
              ...options,
              id,
              description: messages.description,
            }
          )
      )
      return id
    },
    /**
     * Render any component as a toast. Wrap it in Toast when a glass surface is needed.
     */
    custom: sonner.custom,
    dismiss: sonner.dismiss,
  }
)

/**
 * Mobile spacing uses the page-gutter token (--page-gutter, the same expression as px-gutter) to align with page content.
 */
const GUTTER = 'var(--page-gutter, 1rem)'
const GUTTER_LEFT = `max(${GUTTER}, env(safe-area-inset-left))`
const GUTTER_RIGHT = `max(${GUTTER}, env(safe-area-inset-right))`
const MOBILE_OFFSET = {
  top: `calc(env(safe-area-inset-top) + ${GUTTER})`,
  right: GUTTER_RIGHT,
  left: GUTTER_LEFT,
}

/**
 * Mount once at the app root. Toast draws the surface; this component configures only positioning and stacking.
 */
function Toaster({ ...props }: ToasterProps) {
  const { isMobile } = useMobile(767)

  return (
    <Sonner
      position={isMobile ? 'top-center' : 'top-right'}
      // Sonner uses mobileOffset only at 600px or below. Set both offsets so larger mobile widths up to 767px use the same spacing.
      offset={isMobile ? MOBILE_OFFSET : { top: 24, right: 24 }}
      mobileOffset={MOBILE_OFFSET}
      swipeDirections={isMobile ? ['top'] : ['right']}
      gap={10}
      visibleToasts={3}
      containerAriaLabel="Notifications"
      className="comwit-toaster toaster group"
      style={
        {
          // On mobile, subtract only the gutters from layout width; at 600px or below Sonner calculates the same width from mobileOffset.
          '--width': isMobile ? `calc(100vw - ${GUTTER_LEFT} - ${GUTTER_RIGHT})` : '356px',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, Toast, toast }
