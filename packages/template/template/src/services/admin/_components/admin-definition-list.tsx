'use client'

import { cn } from '@/lib/utils'

export type AdminDefRowItem = {
  label: string
  value: React.ReactNode
  /** 값을 mono 폰트로 표시 (ID/해시 등) */
  mono?: boolean
}

type AdminDefinitionListProps = {
  items: AdminDefRowItem[]
  /** 기본 2열 (sm:grid-cols-2). 1열 강제 시 `columns={1}` */
  columns?: 1 | 2
  className?: string
}

/**
 * 어드민 상세의 기본 정보 KV 그리드 — Toss 톤.
 * 라벨(xs muted) 위 / 값(sm foreground 또는 mono) 아래.
 * 구현체 = dl·dt·dd 시맨틱 유지, 룩은 Tailwind 토큰이 그대로.
 */
export function AdminDefinitionList({
  items,
  columns = 2,
  className,
}: AdminDefinitionListProps) {
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-x-5 gap-y-3.5 text-label',
        columns === 2 ? 'sm:grid-cols-2' : null,
        className,
      )}
    >
      {items.map((item) => (
        <AdminDefRow key={item.label} {...item} />
      ))}
    </dl>
  )
}

export function AdminDefRow({ label, value, mono }: AdminDefRowItem) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'mt-1',
          mono
            ? 'break-all font-mono text-caption text-foreground'
            : 'text-label text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
