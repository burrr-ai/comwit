'use client'

/**
 * Toast — 유리 토스트. 모바일은 상단 가운데(위로 스와이프), 데스크톱은 우하단(오른쪽 스와이프).
 *
 * 엔진은 sonner 다: 위치·스택·스와이프·타이머·접근성을 맡는다. 면은 우리 것이다 — `toast()` 가 sonner 의
 * `toast.custom` 에 <Toast>(GlassSurface · 메뉴·앱바·다이얼로그와 같은 굴절 유리)를 꽂는다. 그래서 sonner 의
 * 기본 스킨을 CSS 로 덮지 않고, 토스트 한 장이 그냥 리액트 컴포넌트다.
 *
 *   // 앱 루트에 한 번 (overlay-kit 의 OverlayProvider 옆)
 *   <Toaster />
 *
 *   import { toast } from '@/components/ui/toast'
 *   toast.success('Changes saved', { description: 'Just now', action: { label: 'Undo', onClick } })
 *   toast.promise(save(), { loading: 'Saving…', success: 'Saved', error: 'Could not save' })
 *
 * 상태색은 작은 솔리드 아이콘 원이 전달하고, 유리 틴트는 상태 틴트 면을 살짝 섞는다(styles.css).
 * `import { toast } from 'sonner'` 로 직접 부르면 sonner 의 기본 스킨으로 뜬다 — 항상 이 파일의 toast 를 쓴다.
 */

import * as React from 'react'
import { CircleCheck, Info, LoaderCircle, TriangleAlert, X, XCircle } from 'lucide-react'
import { Toaster as Sonner, toast as sonner, type ExternalToast, type ToasterProps } from 'sonner'

import { Button } from './button'
import { GlassSurface } from './glass'
import { useMobile } from '@comwit/ui'
import { focusRing } from '../../lib/interaction'
import { cn } from '../../lib/utils'

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'

export type ToastAction = {
  label: React.ReactNode
  /** preventDefault 하면 토스트가 닫히지 않는다. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export type ToastOptions = {
  /** 같은 id 로 다시 부르면 그 토스트를 갱신한다(loading → success 등). */
  id?: string | number
  description?: React.ReactNode
  /** ms. Infinity 면 닫을 때까지 남는다. loading 은 기본이 Infinity. */
  duration?: number
  /** 상태 아이콘을 대신한다. */
  icon?: React.ReactNode
  action?: ToastAction
  cancel?: ToastAction
  closeButton?: boolean
  /** false 면 스와이프·클릭으로 못 닫는다. */
  dismissible?: boolean
  position?: ToasterProps['position']
  onDismiss?: () => void
  onAutoClose?: () => void
}

const STATUS_ICON: Record<Exclude<ToastType, 'default'>, React.ReactNode> = {
  success: (
    <span className="flex size-7 items-center justify-center rounded-full bg-success text-success-foreground">
      <CircleCheck className="size-3.5" aria-hidden="true" />
    </span>
  ),
  error: (
    <span className="flex size-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
      <XCircle className="size-3.5" aria-hidden="true" />
    </span>
  ),
  warning: (
    <span className="flex size-7 items-center justify-center rounded-full bg-warning text-warning-foreground">
      <TriangleAlert className="size-3.5" aria-hidden="true" />
    </span>
  ),
  info: (
    <span className="flex size-7 items-center justify-center rounded-full bg-info text-info-foreground">
      <Info className="size-3.5" aria-hidden="true" />
    </span>
  ),
  loading: (
    <span className="flex size-7 items-center justify-center rounded-full bg-primary-surface text-primary">
      <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
    </span>
  ),
}

type ToastProps = Pick<
  ToastOptions,
  'description' | 'icon' | 'action' | 'cancel' | 'closeButton'
> & {
  /** sonner 가 준 토스트 id — 버튼이 닫을 때 쓴다. */
  id: string | number
  type?: ToastType
  title: React.ReactNode
  className?: string
}

/**
 * 토스트 한 장 — `toast()` 가 sonner 에 꽂는 유리 면. 직접 렌더할 수도 있다:
 * `toast.custom((id) => <Toast id={id} title="…" />)`. 폭은 Toaster 가 정한 --width 를 따른다.
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
    <GlassSurface variant="morphing" shape="panel" dense>
      <div
        data-slot="toast"
        data-type={type}
        className={cn(
          'flex w-(--width) items-center gap-2.5 rounded-sheet px-3.5 py-3 text-label text-popover-foreground',
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
            <p className="mt-0.5 text-caption text-soft-foreground">{description}</p>
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
            aria-label="Close notification"
            onClick={() => sonner.dismiss(id)}
            className={cn(
              focusRing,
              '-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground'
            )}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </GlassSurface>
  )
}

function show(type: ToastType, title: React.ReactNode, options: ToastOptions = {}) {
  const { id, description, duration, icon, action, cancel, closeButton, ...rest } = options
  // undefined 키를 넘기지 않는다 — 같은 id 로 갱신할 때 sonner 가 이전 값(예: loading 의 Infinity)을 지워버린다.
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
    /** 한 토스트를 loading → success / error 로 옮긴다. id 를 돌려주므로 직접 갱신할 수도 있다. */
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
    /** 임의 컴포넌트를 토스트로. 유리 면이 필요하면 <Toast> 로 감싼다. */
    custom: sonner.custom,
    dismiss: sonner.dismiss,
  }
)

/** 앱 루트에 한 번 마운트한다. 면은 <Toast> 가 그리므로 여기엔 위치·스택 설정만 있다. */
function Toaster({ ...props }: ToasterProps) {
  const { isMobile } = useMobile(767)

  return (
    <Sonner
      position={isMobile ? 'top-center' : 'bottom-right'}
      offset={{ right: 24, bottom: 24 }}
      mobileOffset={{
        top: 'calc(env(safe-area-inset-top) + 14px)',
        right: 12,
        bottom: 12,
        left: 12,
      }}
      swipeDirections={isMobile ? ['top'] : ['right']}
      gap={10}
      visibleToasts={3}
      containerAriaLabel="Notifications"
      className="comwit-toaster toaster group"
      style={
        {
          '--width': isMobile ? 'min(344px, calc(100vw - 28px))' : '352px',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, Toast, toast }
