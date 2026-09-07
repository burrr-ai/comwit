const minute = 60_000
const hour = 60 * minute
const day = 24 * hour
const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'always' })
const units = [
  ['year', 365 * day],
  ['month', 30 * day],
  ['day', day],
  ['hour', hour],
  ['minute', minute],
] as const

export function formatRelativeTime(date: string, now: number): string {
  const difference = new Date(date).getTime() - now
  if (!Number.isFinite(difference)) return date
  if (Math.abs(difference) < minute) return 'just now'

  for (const [unit, duration] of units) {
    if (Math.abs(difference) >= duration) {
      return formatter.format(Math.trunc(difference / duration), unit)
    }
  }

  return date
}
