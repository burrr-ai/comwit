'use client'

import { cn } from '@/lib/utils'

type AdminListRowProps = {
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

/**
 * Admin list row on a card surface with a hairline border.
 * Share the flex justify-between rounded border p-3 pattern for members, seed users, and projects.
 * Keep borders, radii, and card shadows driven by Tailwind tokens.
 */
export function AdminListRow({ className, onClick, children }: AdminListRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-card',
        onClick &&
          'cursor-pointer transition-shadow hover:shadow-card-hover',
        className,
      )}
    >
      {children}
    </div>
  )
}
