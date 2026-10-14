'use client'

import { cn } from '@/lib/utils'

export type AdminDefRowItem = {
  label: string
  value: React.ReactNode
  /** Display the value in a monospace font, e.g. IDs or hashes. */
  mono?: boolean
}

type AdminDefinitionListProps = {
  items: AdminDefRowItem[]
  /** Two columns by default (sm:grid-cols-2); set columns={1} for one column. */
  columns?: 1 | 2
  className?: string
}

/**
 * Admin detail key/value grid with Toss-inspired styling.
 * Small muted labels above foreground or monospace values.
 * Preserve dl/dt/dd semantics and use Tailwind tokens for appearance.
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
