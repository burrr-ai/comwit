import { cn } from '@/lib/utils'

type AdminPageProps = {
  /** 본문 최대 폭. 리스트/대시보드는 넓게(5xl·6xl), 상세/폼은 좁게(3xl). 기본 5xl */
  width?: '3xl' | '4xl' | '5xl' | '6xl' | 'full'
  className?: string
  children: React.ReactNode
}

const WIDTH: Record<NonNullable<AdminPageProps['width']>, string> = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-none',
}

/**
 * 모든 어드민 페이지의 표준 컨테이너.
 * 중앙 정렬 + 일관된 가로 패딩 + 섹션 간 수직 리듬(space-y-6)을 보장한다.
 * (각 페이지가 제각각 `p-6 space-y-6` 박던 것을 하나로.)
 */
export function AdminPage({ width = '5xl', className, children }: AdminPageProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 py-8 sm:px-8 space-y-6',
        WIDTH[width],
        className,
      )}
    >
      {children}
    </div>
  )
}
