import { cn } from '@/lib/utils'

type AdminPageProps = {
  /** Maximum content width: wide for lists/dashboards (5xl/6xl), narrow for forms/details (3xl). Default: 5xl. */
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
 * Standard admin page container.
 * Centers content with consistent horizontal padding and space-y-6 between sections,
 * replacing repeated per-page p-6 space-y-6 wrappers.
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
