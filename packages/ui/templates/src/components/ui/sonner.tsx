'use client'

import { CircleCheck, Info, TriangleAlert, XCircle } from 'lucide-react'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheck className="size-4 text-success" />,
        error: <XCircle className="size-4 text-destructive" />,
        warning: <TriangleAlert className="size-4 text-warning" />,
        info: <Info className="size-4 text-info" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          /* sonner 변수명 ↔ 우리 토큰 매핑. border 3종은 전역 토큰과 이름이 같아
             직접 참조가 자기참조 invalid — @theme 이 만든 --color-* 별칭으로 우회. */
          '--success-bg': 'var(--success-surface)',
          '--success-text': 'var(--success-surface-foreground)',
          '--success-border': 'var(--color-success-border)',
          '--error-bg': 'var(--destructive-surface)',
          '--error-text': 'var(--destructive-surface-foreground)',
          '--error-border': 'var(--destructive-border)',
          '--warning-bg': 'var(--warning-surface)',
          '--warning-text': 'var(--warning-surface-foreground)',
          '--warning-border': 'var(--color-warning-border)',
          '--info-bg': 'var(--info-surface)',
          '--info-text': 'var(--info-surface-foreground)',
          '--info-border': 'var(--color-info-border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
