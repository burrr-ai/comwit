/** Format a KST date, e.g. '2026. 07. 20.'. */
export function kstDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/** Format KST date/time in 24-hour notation, e.g. '2026. 07. 20. 15:04:05'. */
export function kstDateTime(date: Date): string {
  const time = date.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Seoul',
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${kstDate(date)} ${time}`
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * API display labels for activity/created/updated timestamps; months/years use 30/365 days.
 * Treat future activity as clock skew and display the localized equivalent of "just now".
 */
export function kstRelativeTime(date: Date, now = new Date()): string {
  const elapsed = Math.max(0, now.getTime() - date.getTime())

  if (elapsed < MINUTE) return '방금 전'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}분 전`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}시간 전`
  if (elapsed < DAY * 2) return '어제'
  if (elapsed < DAY * 7) return `${Math.floor(elapsed / DAY)}일 전`
  if (elapsed < DAY * 30) return `${Math.floor(elapsed / (DAY * 7))}주 전`
  if (elapsed < DAY * 365) return `${Math.floor(elapsed / (DAY * 30))}개월 전`

  return `${Math.floor(elapsed / (DAY * 365))}년 전`
}
