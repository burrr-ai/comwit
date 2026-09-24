'use client'

import { CircleCheck, Info, LoaderCircle, TriangleAlert, XCircle } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useMobile } from '../../hooks/use-mobile'

// 유리 토스트 — 모바일은 상단 가운데(위로 스와이프), 데스크톱은 우하단(오른쪽 스와이프).
// 색은 전부 토큰에서 오고, 상태색은 작은 솔리드 아이콘 원이 주로 전달한다.
// 면 스타일(블러·반경·그림자)은 styles.css 의 `.comwit-toaster` 가 담당한다.
const Toaster = ({ ...props }: ToasterProps) => {
  const { isMobile } = useMobile(767)

  return (
    <Sonner
      theme="light"
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
      richColors
      icons={{
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
      }}
      toastOptions={{ closeButtonAriaLabel: 'Close notification' }}
      style={
        {
          '--width': isMobile ? 'min(344px, calc(100vw - 28px))' : '352px',
          '--border-radius': 'var(--radius-sheet)',
          '--normal-bg': 'color-mix(in srgb, var(--color-popover) 82%, transparent)',
          '--normal-text': 'var(--color-popover-foreground)',
          '--normal-border': 'color-mix(in srgb, var(--color-popover) 58%, transparent)',
          // sonner 변수명(--success-border 등)이 우리 토큰명과 겹친다. 같은 엘리먼트에서
          // 정의하며 읽으면 자기참조로 무효화되므로, @theme 이 :root 에 내보낸 --color-* 별칭을 읽는다.
          '--success-bg':
            'color-mix(in srgb, color-mix(in srgb, var(--color-success-surface) 22%, var(--color-popover)) 82%, transparent)',
          '--success-text': 'var(--color-popover-foreground)',
          '--success-border': 'color-mix(in srgb, var(--color-success-border) 32%, transparent)',
          '--error-bg':
            'color-mix(in srgb, color-mix(in srgb, var(--color-destructive-surface) 22%, var(--color-popover)) 82%, transparent)',
          '--error-text': 'var(--color-popover-foreground)',
          '--error-border': 'color-mix(in srgb, var(--color-destructive-border) 32%, transparent)',
          '--warning-bg':
            'color-mix(in srgb, color-mix(in srgb, var(--color-warning-surface) 22%, var(--color-popover)) 82%, transparent)',
          '--warning-text': 'var(--color-popover-foreground)',
          '--warning-border': 'color-mix(in srgb, var(--color-warning-border) 32%, transparent)',
          '--info-bg':
            'color-mix(in srgb, color-mix(in srgb, var(--color-info-surface) 22%, var(--color-popover)) 82%, transparent)',
          '--info-text': 'var(--color-popover-foreground)',
          '--info-border': 'color-mix(in srgb, var(--color-info-border) 32%, transparent)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
