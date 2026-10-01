/** KST 날짜 표시 — '2026. 07. 20.' */
export function kstDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/** KST 날짜·시각 표시 (24시간제) — '2026. 07. 20. 15:04:05' */
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
 * 활동·작성·수정 시각의 API 표시용 문자열. 월·년은 각각 30일·365일 기준이다.
 * 미래 활동 시각은 시계 오차로 보고 '방금 전'으로 표시한다.
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
