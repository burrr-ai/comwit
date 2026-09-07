'use client'

import { useSyncExternalStore } from 'react'
import { formatRelativeTime } from '@/lib/relative-time'

function subscribe(callback: () => void) {
  const interval = window.setInterval(callback, 60_000)
  window.addEventListener('focus', callback)
  return () => {
    window.clearInterval(interval)
    window.removeEventListener('focus', callback)
  }
}

function getCurrentMinute() {
  return Math.floor(Date.now() / 60_000) * 60_000
}

function getServerSnapshot() {
  return null
}

export function RelativeTime({ date }: { date: string }) {
  // Keep static HTML and hydration identical, then use the reader's current time.
  const now = useSyncExternalStore(subscribe, getCurrentMinute, getServerSnapshot)
  return (
    <time dateTime={date} title={date}>
      {now === null ? date : formatRelativeTime(date, now)}
    </time>
  )
}
