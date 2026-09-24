import * as React from 'react'

import { cn } from '../../lib/utils'

type EmptyStateProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  /** 큰 이모지 또는 아이콘 */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** CTA 슬롯 — 보통 Button 하나 */
  action?: React.ReactNode
}

/**
 * 빈 상태 — 옅은 면 · 경계선 없음 · 큰 이모지 한 줄 카피 · 보조 설명 · CTA.
 * 목록이 비었을 때 "다음에 할 일"을 하나만 제안한다.
 */
function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl bg-muted px-8 py-16 text-center',
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="text-[44px] leading-none text-muted-foreground grayscale-[0.2] [&_svg]:size-11"
        >
          {icon}
        </div>
      ) : null}
      <h3 className="text-title-lg text-foreground">{title}</h3>
      {description ? (
        <p className="max-w-md text-body-sm text-soft-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-3 flex items-center gap-2">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
